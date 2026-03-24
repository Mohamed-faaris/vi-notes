import { useCallback, useEffect, useRef, useState } from "react";

export type TelemetryItem = {
  t: number;
  type: string;
  [key: string]: unknown;
};

export type TelemetryFlushConfig<T extends TelemetryItem> = {
  debounceMs?: number;
  maxBuffer?: number;
  intervalMs?: number;
  immediateEvents?: Array<"blur" | "visibilitychange" | "beforeunload">;
  onFlush: (batch: T[]) => Promise<void> | void;
};

export function useTelemetryFlush<T extends TelemetryItem>({
  debounceMs = 1000,
  maxBuffer = 50,
  intervalMs = 5000,
  immediateEvents = ["blur", "visibilitychange", "beforeunload"],
  onFlush,
}: TelemetryFlushConfig<T>) {
  const bufferRef = useRef<T[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const [size, setSize] = useState(0);

  const flush = useCallback(async () => {
    if (flushingRef.current) {
      return;
    }

    const payload = bufferRef.current;
    if (payload.length === 0) {
      return;
    }

    flushingRef.current = true;
    bufferRef.current = [];
    setSize(0);

    try {
      await onFlush([...payload]);
    } finally {
      flushingRef.current = false;
    }
  }, [onFlush]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void flush();
    }, debounceMs);
  }, [debounceMs, flush]);

  const push = useCallback(
    (item: T) => {
      bufferRef.current.push(item);
      setSize(bufferRef.current.length);

      if (bufferRef.current.length >= maxBuffer) {
        void flush();
        return;
      }

      scheduleFlush();
    },
    [flush, maxBuffer, scheduleFlush],
  );

  const clear = useCallback(() => {
    bufferRef.current = [];
    setSize(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void flush();
    }, intervalMs);

    const handleBlur = () => {
      void flush();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        void flush();
      }
    };

    const handleBeforeUnload = () => {
      void flush();
    };

    if (immediateEvents.includes("blur")) {
      window.addEventListener("blur", handleBlur);
    }
    if (immediateEvents.includes("visibilitychange")) {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    if (immediateEvents.includes("beforeunload")) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      clearInterval(interval);
      clear();
      if (immediateEvents.includes("blur")) {
        window.removeEventListener("blur", handleBlur);
      }
      if (immediateEvents.includes("visibilitychange")) {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (immediateEvents.includes("beforeunload")) {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    };
  }, [clear, flush, immediateEvents, intervalMs]);

  return { push, flush, clear, size };
}
