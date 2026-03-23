import type { EditorEvent, EditorEventType } from "./types";

type BuildEventInput = {
  type: EditorEventType;
  now: number;
  lastEventTime: number | null;
  start: number;
  end: number;
  length: number;
  delta: number;
};

export function computeDelay(now: number, lastEventTime: number | null) {
  if (lastEventTime === null) {
    return 0;
  }

  return now - lastEventTime;
}

export function buildEditorEvent(input: BuildEventInput): EditorEvent {
  return {
    t: input.now,
    type: input.type,
    start: input.start,
    end: input.end,
    length: input.length,
    delta: input.delta,
    delay: computeDelay(input.now, input.lastEventTime),
  };
}
