import { WritingSession } from "@vi-notes/db/models/writing-session.model";
import { ingestItemSchema } from "../schemas/note.schemas";

import type { z } from "zod";

type IngestItem = z.infer<typeof ingestItemSchema>;

export async function listUserNotes(userId: string) {
  return WritingSession.find({ userId })
    .select({ sessionId: 1, userId: 1, title: 1, startTime: 1, endTime: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function createNote(input: { sessionId: string; userId: string; title: string; startTime: number }) {
  return WritingSession.create({
    sessionId: input.sessionId,
    userId: input.userId,
    title: input.title,
    startTime: input.startTime,
    events: [],
    snapshots: [],
    lastSeq: 0,
  });
}

export async function getNote(sessionId: string) {
  return WritingSession.findOne({ sessionId }).lean();
}

export async function assertNoteOwner(sessionId: string, userId: string) {
  const note = await getNote(sessionId);
  if (!note) {
    return { ok: false as const, status: 404, error: "Note not found" };
  }

  if (note.userId !== userId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, note };
}

export async function renameNote(sessionId: string, title: string) {
  await WritingSession.updateOne({ sessionId }, { $set: { title } });
}

export async function ingestNoteItems(sessionId: string, userId: string, items: IngestItem[]) {
  const access = await assertNoteOwner(sessionId, userId);
  if (!access.ok) {
    return access;
  }

  const note = access.note;
  const seen = new Set<string>();
  const ordered = [...items].sort((a, b) => a.seq - b.seq);

  const accepted: IngestItem[] = [];
  let lastSeq = note.lastSeq ?? 0;

  for (const item of ordered) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);

    if (item.seq <= lastSeq) {
      continue;
    }

    accepted.push(item);
    lastSeq = item.seq;
  }

  const events = accepted.filter((item) => item.kind === "event").map((item) => ({
    id: item.id,
    seq: item.seq,
    clientTs: item.clientTs,
    ...item.event,
  }));

  const snapshots = accepted.filter((item) => item.kind === "snapshot").map((item) => ({
    id: item.id,
    seq: item.seq,
    clientTs: item.clientTs,
    ...item.snapshot,
  }));

  const endTime = accepted.find((item) => item.kind === "end")?.endTime;

  await WritingSession.updateOne(
    { sessionId },
    {
      $push: {
        events: { $each: events },
        snapshots: { $each: snapshots },
      },
      $set: {
        lastSeq,
        ...(typeof endTime === "number" ? { endTime } : {}),
      },
    },
  );

  return {
    ok: true as const,
    acceptedCount: accepted.length,
    duplicateCount: items.length - accepted.length,
    lastSeq,
  };
}

export async function listAllSessions() {
  return WritingSession.find({})
    .select({ sessionId: 1, userId: 1, title: 1, startTime: 1, endTime: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .lean();
}
