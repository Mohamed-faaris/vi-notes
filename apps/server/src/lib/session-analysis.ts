type SessionEvent = {
  t: number;
  type: "insert" | "delete" | "paste";
  start: number;
  end: number;
  length: number;
  delta: number;
  delay: number;
};

type SessionSnapshot = {
  t: number;
  text: string;
};

export function analyzeSession(events: SessionEvent[], snapshots: SessionSnapshot[]) {
  const finalText = snapshots.at(-1)?.text ?? "";
  const typedChars = events.filter((event) => event.type === "insert").reduce((sum, event) => sum + event.length, 0);
  const pastedChars = events.filter((event) => event.type === "paste").reduce((sum, event) => sum + event.length, 0);
  const deletedChars = events.filter((event) => event.type === "delete").reduce((sum, event) => sum + event.length, 0);

  const totalDurationMs = Math.max(1, (events.at(-1)?.t ?? 0) - (events[0]?.t ?? 0));
  const avgSpeed = (typedChars + pastedChars) / (totalDurationMs / 1000);
  const pasteRatio = pastedChars / Math.max(1, typedChars + pastedChars);
  const pauseCount = events.filter((event) => event.delay > 2000).length;
  const editDensity = deletedChars / Math.max(1, finalText.length);
  const burstCount = events.filter((event) => event.delta >= 20 && event.delay <= 500).length;

  const flags: string[] = [];
  let score = 0;

  if (pasteRatio > 0.5) {
    flags.push("High paste usage");
    score += 0.2;
  }

  if (events.some((event) => event.type === "paste" && event.length >= 60)) {
    flags.push("Bulk pasted content");
    score += 0.25;
  }

  if (avgSpeed > 8) {
    flags.push("Unnatural typing speed");
    score += 0.2;
  }

  if (finalText.length > 500 && editDensity < 0.05) {
    flags.push("Low revision behavior");
    score += 0.2;
  }

  if (burstCount > 0) {
    flags.push("Sudden content injection");
    score += 0.15;
  }

  return {
    metrics: {
      avgSpeed,
      pasteRatio,
      pauseCount,
      editDensity,
      burstCount,
    },
    detection: {
      score: Math.min(1, score),
      flags,
    },
    summary: {
      events: events.length,
      snapshots: snapshots.length,
      finalTextLength: finalText.length,
    },
  };
}
