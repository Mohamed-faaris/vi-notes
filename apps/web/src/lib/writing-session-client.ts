import { env } from "@vi-notes/env/web";

import type { EditorEvent } from "@/components/editor/types";

type Snapshot = {
  t: number;
  text: string;
};

export type SessionItem = {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  events: Array<{
    t: number;
    type: "insert" | "delete" | "paste";
    start: number;
    end: number;
    length: number;
    delta: number;
    delay: number;
  }>;
  snapshots: Snapshot[];
};

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${env.VITE_SERVER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }
}

export async function startSession(sessionId: string, userId: string, startTime: number) {
  await postJson("/session/start", { sessionId, userId, startTime });
}

export async function pushSessionEvent(sessionId: string, event: EditorEvent) {
  await postJson("/session/event", { sessionId, event });
}

export async function pushSessionSnapshot(sessionId: string, snapshot: Snapshot) {
  await postJson("/session/snapshot", { sessionId, snapshot });
}

export async function endSession(sessionId: string, endTime: number) {
  await postJson("/session/end", { sessionId, endTime });
}

export async function getUserSessions(userId: string) {
  const response = await fetch(`${env.VITE_SERVER_URL}/session/user/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { sessions: SessionItem[] };
  return data.sessions;
}
