import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";

import {
  buildHighlightedSegments,
  buildTimeline,
  computeMetrics,
  detectSuspiciousPatterns,
  reconstructFromSnapshots,
} from "@/lib/writing-analysis";

import type { EditorEvent, Snapshot } from "./types";

type TeacherDashboardProps = {
  text: string;
  events: EditorEvent[];
  snapshots: Snapshot[];
};

export function TeacherDashboard({ text, events, snapshots }: TeacherDashboardProps) {
  const metrics = useMemo(() => computeMetrics(events, text.length), [events, text.length]);
  const detection = useMemo(() => detectSuspiciousPatterns(metrics, text.length), [metrics, text.length]);
  const highlighted = useMemo(() => buildHighlightedSegments(text, events, detection), [text, events, detection]);
  const timeline = useMemo(() => buildTimeline(snapshots, events, text), [snapshots, events, text]);
  const reconstruction = useMemo(() => reconstructFromSnapshots(snapshots), [snapshots]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Telemetry</CardTitle>
          <CardDescription>Quick suspicion snapshot for this session.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Suspicion score</p>
            <p className="text-2xl font-semibold">{detection.score.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Flags</p>
            <p className="text-2xl font-semibold">{detection.flags.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-2xl font-semibold">{detection.flags.length === 0 ? "Clean" : "Review"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flags</CardTitle>
          <CardDescription>Rule-based indicators for suspicious writing behavior.</CardDescription>
        </CardHeader>
        <CardContent>
          {detection.flags.length === 0 ? (
            <p className="text-xs text-muted-foreground">No flags yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {detection.flags.map((flag) => (
                <li key={flag}>⚠️ {flag}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Suspicion score: {detection.score.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
          <CardDescription>Behavioral metrics derived from event stream.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt>Speed</dt>
            <dd>{metrics.avgSpeed.toFixed(2)} cps</dd>
            <dt>Paste ratio</dt>
            <dd>{(metrics.pasteRatio * 100).toFixed(1)}%</dd>
            <dt>Pauses (&gt;2s)</dt>
            <dd>{metrics.pauseCount}</dd>
            <dt>Edit density</dt>
            <dd>{(metrics.editDensity * 100).toFixed(1)}%</dd>
            <dt>Burst inserts</dt>
            <dd>{metrics.burstCount}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>X: time, Y: text length.</CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineChart points={timeline} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Reconstruction (Snapshot Diff)</CardTitle>
          <CardDescription>Segments reconstructed by comparing snapshot deltas.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-48 overflow-auto border border-input bg-muted/30 p-3 text-xs">
            {JSON.stringify(reconstruction, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineChart({ points }: { points: Array<{ t: number; textLength: number }> }) {
  if (points.length < 2) {
    return <p className="text-xs text-muted-foreground">Need more data points to draw timeline.</p>;
  }

  const width = 840;
  const height = 180;
  const padding = 20;

  const minT = points[0]?.t ?? 0;
  const maxT = points.at(-1)?.t ?? minT + 1;
  const maxY = Math.max(1, ...points.map((point) => point.textLength));

  const line = points
    .map((point, index) => {
      const x =
        padding + ((point.t - minT) / Math.max(1, maxT - minT)) * Math.max(1, width - padding * 2);
      const y =
        height - padding - (point.textLength / Math.max(1, maxY)) * Math.max(1, height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full rounded border border-input bg-background">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
