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

export type IngestItem =
  | {
      kind: "event";
      id: string;
      seq: number;
      clientTs: number;
      event: EditorEvent;
    }
  | {
      kind: "snapshot";
      id: string;
      seq: number;
      clientTs: number;
      snapshot: Snapshot;
    }
  | {
      kind: "end";
      id: string;
      seq: number;
      clientTs: number;
      endTime: number;
    };

export type IngestResponse = {
  ok: true;
  acceptedCount: number;
  duplicateCount: number;
  lastSeq: number;
};

export type NoteAnalysis = {
  metrics: {
    avgSpeed: number;
    pasteRatio: number;
    pauseCount: number;
    editDensity: number;
    burstCount: number;
  };
  detection: {
    score: number;
    flags: string[];
  };
  summary: {
    events: number;
    snapshots: number;
    finalTextLength: number;
    pasteCount: number;
  };
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

export async function getNoteAnalysis(sessionId: string) {
  const { data } = await api.get<{ note: NoteDetail; analysis: NoteAnalysis }>(`/notes/${sessionId}/analysis`);
  return data;
}

export async function ingestNote(sessionId: string, items: IngestItem[]) {
  const { data } = await api.post<IngestResponse>(`/notes/${sessionId}/ingest`, { items });
  return data;
}

export async function renameNote(sessionId: string, title: string) {
  await api.patch(`/notes/${sessionId}/title`, { title });
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
