import { env } from "@vi-notes/env/web";

import type { EditorEvent, Snapshot } from "@/components/editor/types";

export type NoteItem = {
  sessionId: string;
  userId: string;
  title: string;
  startTime: number;
  endTime?: number;
};

export type NoteDetail = NoteItem & {
  events: EditorEvent[];
  snapshots: Snapshot[];
};

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

export async function listNotes() {
  const response = await fetch(`${env.VITE_SERVER_URL}/notes`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseResponse<{ notes: NoteItem[] }>(response);
  return data.notes;
}

export async function createNote(title?: string) {
  const response = await fetch(`${env.VITE_SERVER_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title }),
  });

  return parseResponse<{ sessionId: string; title: string; startTime: number }>(response);
}

export async function getNote(sessionId: string) {
  const response = await fetch(`${env.VITE_SERVER_URL}/notes/${sessionId}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseResponse<{ note: NoteDetail }>(response);
  return data.note;
}

export async function renameNote(sessionId: string, title: string) {
  const response = await fetch(`${env.VITE_SERVER_URL}/notes/${sessionId}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title }),
  });

  await parseResponse<{ ok: true }>(response);
}

export async function pushNoteEvent(sessionId: string, event: EditorEvent) {
  const response = await fetch(`${env.VITE_SERVER_URL}/notes/${sessionId}/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ event }),
  });

  await parseResponse<{ ok: true }>(response);
}

export async function pushNoteSnapshot(sessionId: string, snapshot: Snapshot) {
  const response = await fetch(`${env.VITE_SERVER_URL}/notes/${sessionId}/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ snapshot }),
  });

  await parseResponse<{ ok: true }>(response);
}

export async function endNote(sessionId: string, endTime: number) {
  const response = await fetch(`${env.VITE_SERVER_URL}/notes/${sessionId}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ endTime }),
  });

  await parseResponse<{ ok: true }>(response);
}

export type AdminSessionItem = {
  sessionId: string;
  userId: string;
  title: string;
  startTime: number;
  endTime?: number;
};

export async function listAdminSessions() {
  const response = await fetch(`${env.VITE_SERVER_URL}/admin/sessions`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseResponse<{ sessions: AdminSessionItem[] }>(response);
  return data.sessions;
}

export async function getAdminSession(sessionId: string) {
  const response = await fetch(`${env.VITE_SERVER_URL}/admin/sessions/${sessionId}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseResponse<{ session: NoteDetail }>(response);
  return data.session;
}
