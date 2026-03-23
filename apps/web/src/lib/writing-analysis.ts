import type {
  DetectionResult,
  EditorEvent,
  Metrics,
  Snapshot,
  TextSegment,
  TextSegmentType,
  TimelinePoint,
} from "@/components/editor/types";

type RangeType = Exclude<TextSegmentType, "normal">;

type Range = {
  start: number;
  end: number;
  type: RangeType;
};

export function computeMetrics(events: EditorEvent[], finalTextLength: number): Metrics {
  const inserts = events.filter((event) => event.type === "insert");
  const deletes = events.filter((event) => event.type === "delete");
  const pastes = events.filter((event) => event.type === "paste");

  const typingChars = inserts.reduce((sum, event) => sum + event.length, 0);
  const pastedChars = pastes.reduce((sum, event) => sum + event.length, 0);
  const deletedChars = deletes.reduce((sum, event) => sum + event.length, 0);

  const spanMs = Math.max(1, (events.at(-1)?.t ?? 0) - (events[0]?.t ?? 0));
  const spanSeconds = spanMs / 1000;
  const avgSpeed = (typingChars + pastedChars) / spanSeconds;

  const speedSamples = events
    .filter((event) => event.delay > 0 && event.delta > 0)
    .map((event) => event.length / (event.delay / 1000));
  const speedVariance = computeVariance(speedSamples);

  const pauseCount = events.filter((event) => event.delay > 2000).length;
  const pasteRatio = safeDivide(pastedChars, Math.max(1, finalTextLength + deletedChars));
  const editDensity = safeDivide(deletedChars, Math.max(1, finalTextLength));
  const burstCount = events.filter((event) => isBurst(event)).length;

  return {
    avgSpeed,
    speedVariance,
    pasteRatio,
    pauseCount,
    editDensity,
    burstCount,
  };
}

export function detectSuspiciousPatterns(metrics: Metrics, finalTextLength: number): DetectionResult {
  const flags: string[] = [];
  let score = 0;

  if (metrics.pasteRatio > 0.5) {
    flags.push("High paste usage");
    score += 0.2;
  }

  if (metrics.burstCount > 0) {
    flags.push("Sudden content injection");
    score += 0.2;
  }

  if (metrics.avgSpeed > 8 && metrics.speedVariance < 1.5) {
    flags.push("Unnatural typing pattern");
    score += 0.2;
  }

  if (finalTextLength > 500 && metrics.editDensity < 0.05) {
    flags.push("Low revision behavior");
    score += 0.2;
  }

  if (metrics.pauseCount === 0 && finalTextLength > 300) {
    flags.push("No natural pauses detected");
    score += 0.2;
  }

  return {
    score: Math.min(1, score),
    flags,
  };
}

export function buildTimeline(snapshots: Snapshot[], events: EditorEvent[], finalText: string): TimelinePoint[] {
  const pointsFromSnapshots = snapshots.map((snapshot) => ({
    t: snapshot.t,
    textLength: snapshot.text.length,
  }));

  if (pointsFromSnapshots.length > 0) {
    return pointsFromSnapshots;
  }

  let length = 0;
  const pointsFromEvents: TimelinePoint[] = events.map((event) => {
    length = Math.max(0, length + event.delta);
    return {
      t: event.t,
      textLength: length,
    };
  });

  if (pointsFromEvents.length === 0) {
    return [{ t: Date.now(), textLength: finalText.length }];
  }

  return pointsFromEvents;
}

export function buildHighlightedSegments(
  finalText: string,
  events: EditorEvent[],
  detection: DetectionResult,
): TextSegment[] {
  const ranges: Range[] = [];

  for (const event of events) {
    if (event.type === "paste" && event.length > 0) {
      ranges.push({
        start: clamp(event.start, 0, finalText.length),
        end: clamp(event.end, 0, finalText.length),
        type: "paste",
      });
    }

    if (event.type === "insert" && isBurst(event)) {
      ranges.push({
        start: clamp(event.start, 0, finalText.length),
        end: clamp(event.end, 0, finalText.length),
        type: "flagged",
      });
    }
  }

  if (detection.flags.length > 0 && finalText.length > 0) {
    const suspiciousStart = Math.max(0, finalText.length - Math.min(200, Math.floor(finalText.length * 0.3)));
    ranges.push({ start: suspiciousStart, end: finalText.length, type: "flagged" });
  }

  const merged = mergeRanges(ranges, finalText.length);
  return rangesToSegments(finalText, merged);
}

export function reconstructFromSnapshots(snapshots: Snapshot[]): TextSegment[] {
  if (snapshots.length === 0) {
    return [];
  }

  const ordered = [...snapshots].sort((a, b) => a.t - b.t);
  const segments: TextSegment[] = [];

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];

    const inserted = extractInsertedSlice(previous.text, current.text);
    if (inserted.text.length === 0) {
      continue;
    }

    segments.push({
      text: inserted.text,
      start: inserted.start,
      end: inserted.end,
      type: inserted.text.length >= 40 ? "paste" : "normal",
    });
  }

  if (segments.length === 0) {
    return [
      {
        text: ordered.at(-1)?.text ?? "",
        start: 0,
        end: ordered.at(-1)?.text.length ?? 0,
        type: "normal",
      },
    ];
  }

  return segments;
}

function isBurst(event: EditorEvent) {
  return event.delta >= 20 && event.delay <= 500;
}

function safeDivide(a: number, b: number) {
  if (b <= 0) {
    return 0;
  }

  return a / b;
}

function computeVariance(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDiffs = values.map((value) => (value - mean) ** 2);
  return squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mergeRanges(ranges: Range[], maxLength: number): Range[] {
  const normalized = ranges
    .map((range) => ({
      start: clamp(range.start, 0, maxLength),
      end: clamp(range.end, 0, maxLength),
      type: range.type,
    }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Range[] = [];

  for (const range of normalized) {
    const last = merged.at(-1);

    if (!last || range.start > last.end || range.type !== last.type) {
      merged.push({ ...range });
      continue;
    }

    last.end = Math.max(last.end, range.end);
  }

  return merged;
}

function rangesToSegments(text: string, ranges: Range[]): TextSegment[] {
  if (text.length === 0) {
    return [];
  }

  if (ranges.length === 0) {
    return [{ text, start: 0, end: text.length, type: "normal" }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({
        text: text.slice(cursor, range.start),
        start: cursor,
        end: range.start,
        type: "normal",
      });
    }

    const existingAtStart = segments.find(
      (segment) => segment.start <= range.start && segment.end >= range.end && segment.type !== "normal",
    );

    if (existingAtStart && existingAtStart.type === "paste" && range.type === "flagged") {
      segments.push({
        text: text.slice(range.start, range.end),
        start: range.start,
        end: range.end,
        type: "flagged",
      });
    } else {
      segments.push({
        text: text.slice(range.start, range.end),
        start: range.start,
        end: range.end,
        type: range.type,
      });
    }

    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      start: cursor,
      end: text.length,
      type: "normal",
    });
  }

  return segments.filter((segment) => segment.text.length > 0);
}

function extractInsertedSlice(previous: string, current: string) {
  if (previous === current) {
    return { start: 0, end: 0, text: "" };
  }

  let prefix = 0;
  while (prefix < previous.length && prefix < current.length && previous[prefix] === current[prefix]) {
    prefix += 1;
  }

  let prevSuffix = previous.length - 1;
  let currSuffix = current.length - 1;
  while (prevSuffix >= prefix && currSuffix >= prefix && previous[prevSuffix] === current[currSuffix]) {
    prevSuffix -= 1;
    currSuffix -= 1;
  }

  const start = prefix;
  const end = currSuffix + 1;
  return {
    start,
    end,
    text: current.slice(start, end),
  };
}
