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
import { Link } from "react-router";

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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const textRef = useRef(text);

  async function closeCurrentSession() {
    if (!sessionIdRef.current) {
      return;
    }

    const sessionIdToClose = sessionIdRef.current;
    const endedAt = Date.now();
    const finalSnapshot = { t: endedAt, text: textRef.current };

    await pushSessionSnapshot(sessionIdToClose, finalSnapshot).catch(() => undefined);
    await endSession(sessionIdToClose, endedAt).catch(() => undefined);
  }

  async function createSession(resetEditor: boolean) {
    const sessionId = crypto.randomUUID();
    const startTime = Date.now();

    if (resetEditor) {
      setText("");
      setEvents([]);
      setSnapshots([]);
      setLastEventTime(null);
      setSelectedSessionId("");
    }

    sessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);

    setSessionOptions((prev) => [
      {
        sessionId,
        userId,
        startTime,
        events: [],
        snapshots: [],
      },
      ...prev,
    ]);

    await startSession(sessionId, userId, startTime).catch((error: Error) => {
      setSessionError(error.message);
    });
  }

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!userId || sessionIdRef.current) {
      return;
    }

    void createSession(true);

    return () => {
      void closeCurrentSession();
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
    setEvents(selected.events ?? []);
    setSnapshots(selected.snapshots ?? []);
  }

  function createNewSession() {
    if (isCreatingSession) {
      return;
    }

    setIsCreatingSession(true);
    void closeCurrentSession()
      .then(() => createSession(true))
      .finally(() => {
        setIsCreatingSession(false);
      });
  }

  const visibleEvents = useMemo(() => {
    return events.slice(-MAX_EVENTS_VISIBLE).reverse();
  }, [events]);

  return (
    <div className="flex flex-col gap-4 p-4 lg:flex-row">
      <Card className="w-full lg:w-[320px] lg:shrink-0">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>All writing sessions for this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" className="mb-3 w-full" onClick={createNewSession} disabled={isCreatingSession}>
            {isCreatingSession ? "Creating..." : "Create New Session"}
          </Button>

          <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
            {sessionOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              sessionOptions.map((session) => {
                const isActive = session.sessionId === currentSessionId;
                const isSelected = session.sessionId === selectedSessionId;

                return (
                  <button
                    key={session.sessionId}
                    type="button"
                    onClick={() => loadOldSession(session.sessionId)}
                    className={`w-full rounded border p-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : isSelected
                          ? "border-ring bg-muted/60"
                          : "border-input hover:bg-muted/40"
                    }`}
                  >
                    <p className="text-sm font-medium">{new Date(session.startTime).toLocaleString()}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{session.sessionId}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.events.length} events · {session.snapshots.length} snapshots
                    </p>
                    <div className="mt-2">
                      <Link
                        to={`/dashboard/analyze/${session.sessionId}`}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Analyze
                      </Link>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid flex-1 gap-4 md:grid-cols-2">
        <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>Write with markdown. Behavior events are captured as you type.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <Button type="button" variant="outline" onClick={createNewSession}>
              New Session
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowStats((value) => !value)}>
              {showStats ? "Hide Stats" : "Show Stats"}
            </Button>
          </div>
          <div className="mb-3 text-xs text-muted-foreground">
            Session: <span className="font-mono">{currentSessionId ?? "initializing"}</span>
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

        {showStats ? (
          <>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
