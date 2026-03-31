import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { Outlet, useLocation, useParams } from "react-router";

import { buildEditorEvent } from "@/components/editor/capture";
import { RichEditor } from "@/components/editor/rich-editor";
import type { EditorEvent } from "@/components/editor/types";
import { getNote } from "@/lib/notes-client";
import { useNoteIngest } from "@/hooks/use-note-ingest";

export default function DashboardNoteRoute() {
  const { id } = useParams();
  const location = useLocation();
  const [text, setText] = useState("");
  const [events, setEvents] = useState<EditorEvent[]>([]);
  const [dirtyText, setDirtyText] = useState("");
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef(text);
  const lastSnapshotTextRef = useRef<string | null>(null);
  const { enqueueEvent, enqueueSnapshot, enqueueEnd, flush } = useNoteIngest(id ?? null);
  const isAnalysisRoute = location.pathname.endsWith("/analysis");

  useEffect(() => {
    if (isAnalysisRoute) {
      return;
    }

    if (!id) {
      return;
    }

    const handleSnapshot = () => {
      const currentText = textRef.current;
      if (currentText === lastSnapshotTextRef.current) {
        return;
      }

      lastSnapshotTextRef.current = currentText;
      const now = Date.now();
      enqueueSnapshot({ kind: "snapshot", id: crypto.randomUUID(), clientTs: now, snapshot: { t: now, text: currentText } });
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
  }, [id]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    textRef.current = dirtyText || text;
  }, [dirtyText, text]);

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
        lastSnapshotTextRef.current = latest;
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
      const currentText = textRef.current;
      if (currentText !== lastSnapshotTextRef.current) {
        lastSnapshotTextRef.current = currentText;
        const now = Date.now();
        enqueueSnapshot({ kind: "snapshot", id: crypto.randomUUID(), clientTs: now, snapshot: { t: now, text: currentText } });
      }
    }, 10000);

    return () => {
      const endTime = Date.now();
      const currentText = textRef.current;
      if (currentText !== lastSnapshotTextRef.current) {
        lastSnapshotTextRef.current = currentText;
        enqueueSnapshot({ kind: "snapshot", id: crypto.randomUUID(), clientTs: endTime, snapshot: { t: endTime, text: currentText } });
      }
      window.clearInterval(interval);
      enqueueEnd({ kind: "end", id: crypto.randomUUID(), clientTs: endTime, endTime });
      void flush();
    };
  }, [id, enqueueEnd, enqueueSnapshot, flush, isAnalysisRoute]);

  if (isAnalysisRoute) {
    return <Outlet />;
  }

  if (loading) {
    return <div className="p-6">Loading note...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Card className="h-full min-h-0">
        <CardHeader>
          <CardTitle>Edit note</CardTitle>
          <CardDescription>Write in the editor. Rename from the sidebar menu.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto p-0">
          <RichEditor
            value={text}
            onChange={(next, meta) => {
              setText(next);
              setDirtyText(next);
              const now = Date.now();
              const type = meta?.type ?? "insert";
              const delta = type === "delete" ? next.length - text.length : next.length - text.length;
              const length = type === "paste" ? next.length : Math.max(0, next.length - text.length);
              const captured = buildEditorEvent({
                type,
                now,
                lastEventTime,
                start: 0,
                end: next.length,
                length,
                delta,
              });

              setEvents((prev) => [...prev, captured]);
              setLastEventTime(now);
              enqueueEvent({ kind: "event", id: crypto.randomUUID(), clientTs: now, event: captured });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
