import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@vi-notes/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";

import {
  endSession,
  getUserSessions,
  pushSessionEvent,
  pushSessionSnapshot,
  startSession,
  type SessionItem,
} from "@/lib/writing-session-client";

import { buildEditorEvent } from "./capture";
import { Preview } from "./preview";
import { TeacherDashboard } from "./teacher-dashboard";
import type { EditorEvent, Snapshot } from "./types";

const MAX_EVENTS_VISIBLE = 20;

type EditorProps = {
  userId: string;
};

export function Editor({ userId }: EditorProps) {
  const [text, setText] = useState("");
  const [events, setEvents] = useState<EditorEvent[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionOptions, setSessionOptions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const sessionIdRef = useRef<string | null>(null);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!userId || sessionIdRef.current) {
      return;
    }

    const sessionId = crypto.randomUUID();
    const startTime = Date.now();

    sessionIdRef.current = sessionId;
    void startSession(sessionId, userId, startTime).catch((error: Error) => {
      setSessionError(error.message);
    });

    return () => {
      if (!sessionIdRef.current) {
        return;
      }

      const sessionIdToClose = sessionIdRef.current;
      const endedAt = Date.now();

      const finalSnapshot = { t: endedAt, text: textRef.current };
      void pushSessionSnapshot(sessionIdToClose, finalSnapshot).catch(() => undefined);
      void endSession(sessionIdToClose, endedAt).catch(() => undefined);
    };
  }, [userId]);

  useEffect(() => {
    if (!sessionIdRef.current) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!sessionIdRef.current) {
        return;
      }

      const snapshotTime = Date.now();
      const snapshot = { t: snapshotTime, text: textRef.current };
      setSnapshots((prev) => [...prev, snapshot]);
      void pushSessionSnapshot(sessionIdRef.current, snapshot).catch(() => undefined);
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!userId || userId === "anonymous") {
      return;
    }

    void getUserSessions(userId)
      .then((sessions) => {
        setSessionOptions(sessions);
      })
      .catch(() => {
        setSessionOptions([]);
      });
  }, [userId]);

  function pushEvent(event: EditorEvent) {
    setEvents((prev) => [...prev, event]);
    setLastEventTime(event.t);

    if (sessionIdRef.current) {
      void pushSessionEvent(sessionIdRef.current, event).catch(() => undefined);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    const hasSelection = selectionEnd > selectionStart;
    const now = Date.now();

    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
      const capturedEvent = buildEditorEvent({
        type: "insert",
        now,
        lastEventTime,
        start: selectionStart,
        end: selectionStart + 1,
        length: 1,
        delta: 1,
      });

      pushEvent(capturedEvent);
      return;
    }

    if (event.key === "Backspace") {
      if (hasSelection) {
        const deleteLength = selectionEnd - selectionStart;

        pushEvent(
          buildEditorEvent({
            type: "delete",
            now,
            lastEventTime,
            start: selectionStart,
            end: selectionEnd,
            length: deleteLength,
            delta: -deleteLength,
          }),
        );

        return;
      }

      if (selectionStart > 0) {
        pushEvent(
          buildEditorEvent({
            type: "delete",
            now,
            lastEventTime,
            start: selectionStart - 1,
            end: selectionStart,
            length: 1,
            delta: -1,
          }),
        );
      }

      return;
    }

    if (event.key === "Delete") {
      if (hasSelection) {
        const deleteLength = selectionEnd - selectionStart;

        pushEvent(
          buildEditorEvent({
            type: "delete",
            now,
            lastEventTime,
            start: selectionStart,
            end: selectionEnd,
            length: deleteLength,
            delta: -deleteLength,
          }),
        );

        return;
      }

      if (selectionStart < text.length) {
        pushEvent(
          buildEditorEvent({
            type: "delete",
            now,
            lastEventTime,
            start: selectionStart,
            end: selectionStart + 1,
            length: 1,
            delta: -1,
          }),
        );
      }
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = event.clipboardData.getData("text");
    const target = event.currentTarget;
    const selectionStart = target.selectionStart;
    const now = Date.now();

    pushEvent(
      buildEditorEvent({
        type: "paste",
        now,
        lastEventTime,
        start: selectionStart,
        end: selectionStart + pastedText.length,
        length: pastedText.length,
        delta: pastedText.length,
      }),
    );
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  function loadOldSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    const selected = sessionOptions.find((session) => session.sessionId === sessionId);
    if (!selected) {
      return;
    }
    const lastSnapshot = selected.snapshots.at(-1)?.text ?? "";
    setText(lastSnapshot);
  }

  function createNewSession() {
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    sessionIdRef.current = sessionId;
    setSelectedSessionId("");
    setText("");
    setEvents([]);
    setSnapshots([]);
    void startSession(sessionId, userId, now).catch((error: Error) => setSessionError(error.message));
  }

  const visibleEvents = useMemo(() => {
    return events.slice(-MAX_EVENTS_VISIBLE).reverse();
  }, [events]);

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>Write with markdown. Behavior events are captured as you type.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div className="flex min-w-[240px] flex-1 flex-col gap-1">
              <label htmlFor="session-select" className="text-xs text-muted-foreground">
                Retrieve old session
              </label>
              <select
                id="session-select"
                value={selectedSessionId}
                onChange={(event) => loadOldSession(event.target.value)}
                className="h-8 border border-input bg-background px-2 text-xs"
              >
                <option value="">Current session</option>
                {sessionOptions.map((session) => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {new Date(session.startTime).toLocaleString()} - {session.sessionId.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" onClick={createNewSession}>
              Create Session
            </Button>
          </div>
          <div className="mb-3 text-xs text-muted-foreground">
            Session: <span className="font-mono">{sessionIdRef.current ?? "initializing"}</span>
          </div>
          {sessionError && <p className="mb-3 text-xs text-red-600">Session error: {sessionError}</p>}
          <textarea
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-[420px] w-full resize-y border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
            placeholder="Start writing your notes here..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Markdown Preview</CardTitle>
          <CardDescription>Live preview of your current text.</CardDescription>
        </CardHeader>
        <CardContent>
          <Preview markdown={text} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Captured Events</CardTitle>
          <CardDescription>Showing latest {MAX_EVENTS_VISIBLE} events (newest first).</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-72 overflow-auto border border-input bg-muted/30 p-3 text-xs">
            {JSON.stringify(visibleEvents, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <TeacherDashboard text={text} events={events} snapshots={snapshots} />
      </div>
    </div>
  );
}
