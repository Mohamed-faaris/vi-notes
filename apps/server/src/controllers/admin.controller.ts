import type { Request, Response } from "express";

import { analyzeSession } from "../lib/session-analysis";
import { requireAdmin } from "../middleware/auth";
import { getNote, listAllSessions } from "../services/notes.service";

function getRouteParam(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }

  return null;
}

export async function listSessionsController(req: Request, res: Response) {
  const session = await requireAdmin(req, res);
  if (!session) {
    return;
  }

  const sessions = await listAllSessions();
  return res.status(200).json({ sessions });
}

export async function getSessionController(req: Request, res: Response) {
  const session = await requireAdmin(req, res);
  if (!session) {
    return;
  }

  const sessionId = getRouteParam(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: "Invalid session id" });
  }

  const note = await getNote(sessionId);
  if (!note) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({ session: note });
}

export async function getSessionAnalysisController(req: Request, res: Response) {
  const session = await requireAdmin(req, res);
  if (!session) {
    return;
  }

  const sessionId = getRouteParam(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: "Invalid session id" });
  }

  const note = await getNote(sessionId);
  if (!note) {
    return res.status(404).json({ error: "Session not found" });
  }

  const analysis = analyzeSession(note.events, note.snapshots);
  return res.status(200).json({ sessionId, ...analysis });
}
