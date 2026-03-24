import { useEffect, useMemo, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { useOutletContext, useParams } from "react-router";

import { buildEditorEvent } from "@/components/editor/capture";
import { Preview } from "@/components/editor/preview";
import type { EditorEvent, Snapshot } from "@/components/editor/types";
import { endNote, getNote, pushNoteEvent, pushNoteSnapshot } from "@/lib/notes-client";
import { useTelemetryFlush } from "@/hooks/use-telemetry-flush";

import type { DashboardOutletContext } from "./dashboard-context";

export default function DashboardNoteRoute() {
  const { id } = useParams();
  const { refreshNotes } = useOutletContext<DashboardOutletContext>();
  const [text, setText] = useState("");
  const [events, setEvents] = useState<EditorEvent[]>([]);
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef(text);

  const telemetry = useTelemetryFlush<EditorEvent>({
    debounceMs: 1000,
    maxBuffer: 50,
    intervalMs: 5000,
    onFlush: async (batch) => {
      await Promise.all(batch.map((event) => (id ? pushNoteEvent(id, event) : Promise.resolve())));
    },
  });

  useEffect(() => {
    if (!id) {
      return;
    }

    const handleSnapshot = () => {
      const snapshot: Snapshot = { t: Date.now(), text: textRef.current };
      void pushNoteSnapshot(id, snapshot)
        .then(() => refreshNotes())
        .catch(() => undefined);
    };

    const handleBlur = () => {
      handleSnapshot();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleSnapshot();
      }
    };

    const handleBeforeUnload = () => {
      handleSnapshot();
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [id, refreshNotes]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);

    void getNote(id)
      .then((note) => {
        const latest = note.snapshots.at(-1)?.text ?? "";
        setText(latest);
        setEvents(note.events ?? []);
      })
      .catch((loadError: Error) => {
        setError(loadError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const interval = window.setInterval(() => {
      const snapshot: Snapshot = { t: Date.now(), text: textRef.current };
      void pushNoteSnapshot(id, snapshot)
        .then(() => refreshNotes())
        .catch(() => undefined);
    }, 10000);

    return () => {
      const endTime = Date.now();
      void pushNoteSnapshot(id, { t: endTime, text: textRef.current })
        .then(() => refreshNotes())
        .catch(() => undefined);
      void endNote(id, endTime).catch(() => undefined);
      window.clearInterval(interval);
      telemetry.flush().catch(() => undefined);
    };
  }, [id, refreshNotes, telemetry]);

  const contentLength = useMemo(() => text.trim().length, [text]);

  if (loading) {
    return <div className="p-6">Loading note...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 xl:grid-cols-2">
      <Card className="h-full min-h-0">
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>{contentLength} characters</CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-72px)]">
          <textarea
            value={text}
            onChange={(event) => {
              const next = event.target.value;
              setText(next);
            }}
            onKeyDown={(event) => {
              const target = event.currentTarget;
              const selectionStart = target.selectionStart;
              const selectionEnd = target.selectionEnd;
              const now = Date.now();
              const hasSelection = selectionEnd > selectionStart;

              if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
                const captured = buildEditorEvent({
                  type: "insert",
                  now,
                  lastEventTime,
                  start: selectionStart,
                  end: selectionStart + 1,
                  length: 1,
                  delta: 1,
                });

                setEvents((prev) => [...prev, captured]);
                setLastEventTime(now);
                telemetry.push(captured);
                return;
              }

              if (event.key === "Backspace" || event.key === "Delete") {
                const deleteLength = hasSelection ? selectionEnd - selectionStart : 1;
                const start = event.key === "Backspace" && !hasSelection ? Math.max(0, selectionStart - 1) : selectionStart;
                const end = hasSelection ? selectionEnd : selectionStart + 1;

                if (deleteLength <= 0) {
                  return;
                }

                const captured = buildEditorEvent({
                  type: "delete",
                  now,
                  lastEventTime,
                  start,
                  end,
                  length: deleteLength,
                  delta: -deleteLength,
                });

                setEvents((prev) => [...prev, captured]);
                setLastEventTime(now);
                telemetry.push(captured);
              }
            }}
            onPaste={(event) => {
              const pastedText = event.clipboardData.getData("text");
              const target = event.currentTarget;
              const selectionStart = target.selectionStart;
              const now = Date.now();
              const captured = buildEditorEvent({
                type: "paste",
                now,
                lastEventTime,
                start: selectionStart,
                end: selectionStart + pastedText.length,
                length: pastedText.length,
                delta: pastedText.length,
              });

              setEvents((prev) => [...prev, captured]);
              setLastEventTime(now);
              telemetry.push(captured);
            }}
            className="h-full min-h-[60svh] w-full resize-none rounded border border-input bg-background p-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
            placeholder="Write your markdown notes here..."
          />
        </CardContent>
      </Card>

      <Card className="h-full min-h-0">
        <CardHeader>
          <CardTitle>Viewer</CardTitle>
          <CardDescription>Live markdown preview</CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-72px)] overflow-auto">
          <Preview markdown={text} />
        </CardContent>
      </Card>
    </div>
  );
}
