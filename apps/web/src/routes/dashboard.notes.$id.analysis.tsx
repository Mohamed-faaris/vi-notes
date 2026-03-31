import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { Link, useParams } from "react-router";

import { getNoteAnalysis, type NoteAnalysis, type NoteDetail } from "@/lib/notes-client";

export default function DashboardNoteAnalysisRoute() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [analysis, setAnalysis] = useState<NoteAnalysis | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing note id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    void getNoteAnalysis(id)
      .then(({ note: nextNote, analysis: nextAnalysis }) => {
        setNote(nextNote);
        setAnalysis(nextAnalysis);
      })
      .catch((loadError: Error) => {
        setError(loadError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading analysis...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!note || !analysis) {
    return <div className="p-6 text-sm text-red-600">Analysis unavailable</div>;
  }

  const finalText = note.snapshots.at(-1)?.text ?? "";
  const durationMs = Math.max(0, (note.endTime ?? Date.now()) - note.startTime);
  const durationMinutes = durationMs / 60000;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Note Analysis</h1>
          <p className="text-sm text-muted-foreground">{note.title}</p>
        </div>
        <Link to={`/dashboard/notes/${note.sessionId}`} className="text-sm text-primary underline-offset-4 hover:underline">
          Back to note
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duration</CardDescription>
            <CardTitle>{durationMinutes.toFixed(1)} min</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Final text</CardDescription>
            <CardTitle>{analysis.summary.finalTextLength} chars</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Events</CardDescription>
            <CardTitle>{analysis.summary.events}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Snapshots</CardDescription>
            <CardTitle>{analysis.summary.snapshots}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pastes</CardDescription>
            <CardTitle>{analysis.summary.pasteCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Behavior</CardTitle>
            <CardDescription>Derived from note activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Avg speed</span><span>{analysis.metrics.avgSpeed.toFixed(2)} cps</span></div>
            <div className="flex items-center justify-between"><span>Paste ratio</span><span>{(analysis.metrics.pasteRatio * 100).toFixed(1)}%</span></div>
            <div className="flex items-center justify-between"><span>Pauses</span><span>{analysis.metrics.pauseCount}</span></div>
            <div className="flex items-center justify-between"><span>Edit density</span><span>{(analysis.metrics.editDensity * 100).toFixed(1)}%</span></div>
            <div className="flex items-center justify-between"><span>Burst inserts</span><span>{analysis.metrics.burstCount}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Score</CardTitle>
            <CardDescription>Simple session review signal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-semibold">{analysis.detection.score.toFixed(2)}</div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  analysis.detection.score > 0.5
                    ? "border-red-500/30 bg-red-500/10 text-red-600"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {analysis.detection.score > 0.5 ? "Review" : "Low"}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {analysis.detection.flags.length === 0 ? (
                <p className="text-muted-foreground">No flags detected.</p>
              ) : (
                analysis.detection.flags.map((flag) => (
                  <div key={flag} className="rounded border border-border px-3 py-2">
                    {flag}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Snapshot Text</CardTitle>
            <CardDescription>Latest captured content.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/30 p-3 text-xs">{finalText}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
