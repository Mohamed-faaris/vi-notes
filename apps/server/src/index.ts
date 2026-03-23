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
    methods: ["GET", "POST", "OPTIONS"],
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

const startSessionSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  startTime: z.number().int().positive(),
});

const sessionEventSchema = z.object({
  sessionId: z.string().min(1),
  event: editorEventSchema,
});

const sessionSnapshotSchema = z.object({
  sessionId: z.string().min(1),
  snapshot: snapshotSchema,
});

const endSessionSchema = z.object({
  sessionId: z.string().min(1),
  endTime: z.number().int().positive(),
});

app.post("/session/start", async (req, res) => {
  const parsed = startSessionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { sessionId, userId, startTime } = parsed.data;

  await WritingSession.findOneAndUpdate(
    { sessionId },
    {
      $setOnInsert: {
        sessionId,
        userId,
        startTime,
        events: [],
        snapshots: [],
      },
    },
    { upsert: true, new: true },
  );

  return res.status(201).json({ ok: true, sessionId });
});

app.post("/session/event", async (req, res) => {
  const parsed = sessionEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { sessionId, event } = parsed.data;

  const updated = await WritingSession.findOneAndUpdate(
    { sessionId },
    { $push: { events: event } },
    { new: true },
  );

  if (!updated) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(201).json({ ok: true });
});

app.post("/session/snapshot", async (req, res) => {
  const parsed = sessionSnapshotSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { sessionId, snapshot } = parsed.data;

  const updated = await WritingSession.findOneAndUpdate(
    { sessionId },
    { $push: { snapshots: snapshot } },
    { new: true },
  );

  if (!updated) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(201).json({ ok: true });
});

app.post("/session/end", async (req, res) => {
  const parsed = endSessionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { sessionId, endTime } = parsed.data;

  const updated = await WritingSession.findOneAndUpdate({ sessionId }, { $set: { endTime } }, { new: true });

  if (!updated) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({ ok: true });
});

app.get("/session/:id", async (req, res) => {
  const session = await WritingSession.findOne({ sessionId: req.params.id }).lean();

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({ session });
});

app.get("/session/user/:userId", async (req, res) => {
  const sessions = await WritingSession.find({ userId: req.params.userId })
    .sort({ startTime: -1 })
    .limit(50)
    .lean();

  return res.status(200).json({ sessions });
});

app.get("/session/:id/analysis", async (req, res) => {
  const session = await WritingSession.findOne({ sessionId: req.params.id }).lean();

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const analysis = analyzeSession(session.events, session.snapshots);
  return res.status(200).json({ sessionId: req.params.id, ...analysis });
});

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
