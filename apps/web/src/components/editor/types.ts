export type EditorEventType = "insert" | "delete" | "paste";

export type EditorEvent = {
  t: number;
  type: EditorEventType;
  start: number;
  end: number;
  length: number;
  delta: number;
  delay: number;
};

export type Snapshot = {
  t: number;
  text: string;
};

export type Metrics = {
  avgSpeed: number;
  speedVariance: number;
  pasteRatio: number;
  pauseCount: number;
  editDensity: number;
  burstCount: number;
};

export type DetectionResult = {
  score: number;
  flags: string[];
};

export type TextSegmentType = "normal" | "paste" | "flagged";

export type TextSegment = {
  text: string;
  type: TextSegmentType;
  start: number;
  end: number;
};

export type TimelinePoint = {
  t: number;
  textLength: number;
};
