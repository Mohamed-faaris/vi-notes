import { useCallback, useEffect, useRef, useState } from "react";

import { ingestNote, type IngestItem } from "@/lib/notes-client";

type Status = {
  queued: number;
  flushing: boolean;
  failed: number;
};

export function useNoteIngest(sessionId: string | null) {
  const queueRef = useRef<IngestItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const seqRef = useRef(0);
  const [status, setStatus] = useState<Status>({ queued: 0, flushing: false, failed: 0 });

  const syncStatus = useCallback(() => {
    setStatus((current) => ({
      ...current,
      queued: queueRef.current.length,
      flushing: flushingRef.current,
    }));
  }, []);

  const nextSeq = useCallback(() => {
    seqRef.current += 1;
    return seqRef.current;
  }, []);

  const flush = useCallback(async () => {
    if (!sessionId || flushingRef.current || queueRef.current.length === 0) {
      return;
    }

    flushingRef.current = true;
    syncStatus();

    const batch = queueRef.current.splice(0, queueRef.current.length);
    try {
      await ingestNote(sessionId, batch);
    } catch {
      queueRef.current.unshift(...batch);
      setStatus((current) => ({ ...current, failed: current.failed + 1 }));
    } finally {
      flushingRef.current = false;
      syncStatus();
    }
  }, [sessionId, syncStatus]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void flush();
    }, 1000);
  }, [flush]);

  const enqueue = useCallback(
    (item: Omit<IngestItem, "seq">) => {
      queueRef.current.push({ ...item, seq: nextSeq() } as IngestItem);
      syncStatus();
      scheduleFlush();
    },
    [nextSeq, scheduleFlush, syncStatus],
  );

  const enqueueEvent = useCallback(
    (event: Omit<Extract<IngestItem, { kind: "event" }>, "seq">) => enqueue(event),
    [enqueue],
  );

  const enqueueSnapshot = useCallback(
    (snapshot: Omit<Extract<IngestItem, { kind: "snapshot" }>, "seq">) => enqueue(snapshot),
    [enqueue],
  );

  const enqueueEnd = useCallback(
    (end: Omit<Extract<IngestItem, { kind: "end" }>, "seq">) => enqueue(end),
    [enqueue],
  );

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        void flush();
      }
    };

    window.addEventListener("blur", flush);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", flush);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener("blur", flush);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", flush);
    };
  }, [flush]);

  return { enqueueEvent, enqueueSnapshot, enqueueEnd, flush, status };
}
