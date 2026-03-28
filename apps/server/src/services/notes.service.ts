import { WritingSession } from "@vi-notes/db/models/writing-session.model";

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

export async function appendNoteEvent(sessionId: string, event: unknown) {
  await WritingSession.updateOne({ sessionId }, { $push: { events: event } });
}

export async function appendNoteSnapshot(sessionId: string, snapshot: unknown) {
  await WritingSession.updateOne({ sessionId }, { $push: { snapshots: snapshot } });
}

export async function endNote(sessionId: string, endTime: number) {
  await WritingSession.updateOne({ sessionId }, { $set: { endTime } });
}

export async function listAllSessions() {
  return WritingSession.find({})
    .select({ sessionId: 1, userId: 1, title: 1, startTime: 1, endTime: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .lean();
}
