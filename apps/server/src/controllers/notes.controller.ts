import type { Request, Response } from "express";

import { createNoteSchema, endNoteSchema, noteEventSchema, noteSnapshotSchema, renameNoteSchema } from "../schemas/note.schemas";
import { appendNoteEvent, appendNoteSnapshot, assertNoteOwner, createNote, endNote, listUserNotes, renameNote } from "../services/notes.service";
import { requireUser } from "../middleware/auth";

function getRouteParam(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }

  return null;
}

export async function getNotesController(req: Request, res: Response) {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const notes = await listUserNotes(session.user.id);
  return res.status(200).json({ notes });
}

export async function createNoteController(req: Request, res: Response) {
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

  await createNote({ sessionId, userId: session.user.id, title, startTime });

  return res.status(201).json({ sessionId, title, startTime });
}

export async function getNoteController(req: Request, res: Response) {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const noteId = getRouteParam(req.params.id);
  if (!noteId) {
    return res.status(400).json({ error: "Invalid note id" });
  }

  const access = await assertNoteOwner(noteId, session.user.id);
  if (!access.ok) {
    return res.status(access.status).json({ error: access.error });
  }

  return res.status(200).json({ note: access.note });
}

export async function renameNoteController(req: Request, res: Response) {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = renameNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const noteId = getRouteParam(req.params.id);
  if (!noteId) {
    return res.status(400).json({ error: "Invalid note id" });
  }

  const access = await assertNoteOwner(noteId, session.user.id);
  if (!access.ok) {
    return res.status(access.status).json({ error: access.error });
  }

  await renameNote(noteId, parsed.data.title);
  return res.status(200).json({ ok: true });
}

export async function addNoteEventController(req: Request, res: Response) {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = noteEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const noteId = getRouteParam(req.params.id);
  if (!noteId) {
    return res.status(400).json({ error: "Invalid note id" });
  }

  const access = await assertNoteOwner(noteId, session.user.id);
  if (!access.ok) {
    return res.status(access.status).json({ error: access.error });
  }

  await appendNoteEvent(noteId, parsed.data.event);
  return res.status(201).json({ ok: true });
}

export async function addNoteSnapshotController(req: Request, res: Response) {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = noteSnapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const noteId = getRouteParam(req.params.id);
  if (!noteId) {
    return res.status(400).json({ error: "Invalid note id" });
  }

  const access = await assertNoteOwner(noteId, session.user.id);
  if (!access.ok) {
    return res.status(access.status).json({ error: access.error });
  }

  await appendNoteSnapshot(noteId, parsed.data.snapshot);
  return res.status(201).json({ ok: true });
}

export async function endNoteController(req: Request, res: Response) {
  const session = await requireUser(req, res);
  if (!session) {
    return;
  }

  const parsed = endNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const noteId = getRouteParam(req.params.id);
  if (!noteId) {
    return res.status(400).json({ error: "Invalid note id" });
  }

  const access = await assertNoteOwner(noteId, session.user.id);
  if (!access.ok) {
    return res.status(access.status).json({ error: access.error });
  }

  await endNote(noteId, parsed.data.endTime);
  return res.status(200).json({ ok: true });
}
