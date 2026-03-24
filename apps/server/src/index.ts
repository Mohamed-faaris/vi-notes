import { auth } from "@vi-notes/auth";
import { WritingSession } from "@vi-notes/db/models/writing-session.model";
import { env } from "@vi-notes/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { z } from "zod";

import { analyzeSession } from "./lib/session-analysis";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(express.json());

const editorEventSchema = z.object({
  t: z.number().int().positive(),
  type: z.enum(["insert", "delete", "paste"]),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  length: z.number().int().min(0),
  delta: z.number().int(),
  delay: z.number().int().min(0),
});

const snapshotSchema = z.object({
  t: z.number().int().positive(),
  text: z.string(),
});

const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

const renameNoteSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

const noteEventSchema = z.object({
  event: editorEventSchema,
});

const noteSnapshotSchema = z.object({
  snapshot: snapshotSchema,
});

const endNoteSchema = z.object({
  endTime: z.number().int().positive(),
});

async function getServerSession(request: express.Request) {
  const headers = new Headers();
  const cookie = request.headers.cookie;
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const result = await auth.api.getSession({ headers });
  return result;
}

async function requireUser(request: express.Request, response: express.Response) {
  const session = await getServerSession(request);
  if (!session) {
    response.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return session;
}

async function requireAdmin(request: express.Request, response: express.Response) {
  const session = await requireUser(request, response);
  if (!session) {
    return null;
  }

  const role = ((session.user as Record<string, unknown>).role ?? "user") as string;
  if (role !== "admin") {
    response.status(403).json({ error: "Forbidden" });
    return null;
  }

  return session;
}

app.get("/notes", async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const notes = await WritingSession.find({ userId: session.user.id })
    .select({ sessionId: 1, userId: 1, title: 1, startTime: 1, endTime: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .lean();

  return res.status(200).json({ notes });
});

app.post("/notes", async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const sessionId = crypto.randomUUID();
  const startTime = Date.now();
  const title = parsed.data.title ?? "New Note";

  await WritingSession.create({
    sessionId,
    userId: session.user.id,
    title,
    startTime,
    events: [],
    snapshots: [],
  });

  return res.status(201).json({ sessionId, title, startTime });
});

app.get("/notes/:id", async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const note = await WritingSession.findOne({ sessionId: req.params.id }).lean();
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  if (note.userId !== session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.status(200).json({ note });
});

app.patch("/notes/:id/title", async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = renameNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const note = await WritingSession.findOne({ sessionId: req.params.id }).lean();
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  if (note.userId !== session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await WritingSession.updateOne({ sessionId: req.params.id }, { $set: { title: parsed.data.title } });
  return res.status(200).json({ ok: true });
});

app.post("/notes/:id/event", async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = noteEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const note = await WritingSession.findOne({ sessionId: req.params.id }).lean();
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  if (note.userId !== session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await WritingSession.updateOne({ sessionId: req.params.id }, { $push: { events: parsed.data.event } });
  return res.status(201).json({ ok: true });
});

app.post("/notes/:id/snapshot", async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = noteSnapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const note = await WritingSession.findOne({ sessionId: req.params.id }).lean();
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  if (note.userId !== session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await WritingSession.updateOne({ sessionId: req.params.id }, { $push: { snapshots: parsed.data.snapshot } });
  return res.status(201).json({ ok: true });
});

app.post("/notes/:id/end", async (req, res) => {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = endNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const note = await WritingSession.findOne({ sessionId: req.params.id }).lean();
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  if (note.userId !== session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await WritingSession.updateOne({ sessionId: req.params.id }, { $set: { endTime: parsed.data.endTime } });
  return res.status(200).json({ ok: true });
});

app.get("/admin/sessions", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) {
    return;
  }

  const sessions = await WritingSession.find({})
    .select({ sessionId: 1, userId: 1, title: 1, startTime: 1, endTime: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .lean();

  return res.status(200).json({ sessions });
});

app.get("/admin/sessions/:id", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) {
    return;
  }

  const note = await WritingSession.findOne({ sessionId: req.params.id }).lean();
  if (!note) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({ session: note });
});

app.get("/admin/sessions/:id/analysis", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) {
    return;
  }

  const note = await WritingSession.findOne({ sessionId: req.params.id }).lean();
  if (!note) {
    return res.status(404).json({ error: "Session not found" });
  }

  const analysis = analyzeSession(note.events, note.snapshots);
  return res.status(200).json({ sessionId: req.params.id, ...analysis });
});

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
