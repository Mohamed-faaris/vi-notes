import axios from "axios";
import { env } from "@vi-notes/env/web";

import type { EditorEvent, Snapshot } from "@/components/editor/types";

const api = axios.create({
  baseURL: env.VITE_SERVER_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export async function listNotes() {
  const { data } = await api.get<{ notes: NoteItem[] }>("/notes");
  return data.notes;
}

export async function createNote(title?: string) {
  const { data } = await api.post<{ sessionId: string; title: string; startTime: number }>("/notes", { title });
  return data;
}

export async function getNote(sessionId: string) {
  const { data } = await api.get<{ note: NoteDetail }>(`/notes/${sessionId}`);
  return data.note;
}

export async function renameNote(sessionId: string, title: string) {
  await api.patch(`/notes/${sessionId}/title`, { title });
}

export async function pushNoteEvent(sessionId: string, event: EditorEvent) {
  await api.post(`/notes/${sessionId}/event`, { event });
}

export async function pushNoteSnapshot(sessionId: string, snapshot: Snapshot) {
  await api.post(`/notes/${sessionId}/snapshot`, { snapshot });
}

export async function endNote(sessionId: string, endTime: number) {
  await api.post(`/notes/${sessionId}/end`, { endTime });
}

export type AdminSessionItem = {
  sessionId: string;
  userId: string;
  title: string;
  startTime: number;
  endTime?: number;
};

export async function listAdminSessions() {
  const { data } = await api.get<{ sessions: AdminSessionItem[] }>("/admin/sessions");
  return data.sessions;
}

export async function getAdminSession(sessionId: string) {
  const { data } = await api.get<{ session: NoteDetail }>(`/admin/sessions/${sessionId}`);
  return data.session;
}
