import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { Link, useParams } from "react-router";

import { Preview } from "@/components/editor/preview";
import { TeacherDashboard } from "@/components/editor/teacher-dashboard";
import type { EditorEvent, Snapshot } from "@/components/editor/types";
import { getAdminSession } from "@/lib/notes-client";

export default function AdminSessionDetailRoute() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [events, setEvents] = useState<EditorEvent[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    if (!id) {
      console.warn("[admin-session-detail] missing route id");
      return;
    }

    console.log("[admin-session-detail] loading session", id);
    void getAdminSession(id)
      .then((session) => {
        console.log("[admin-session-detail] loaded session", {
          id: session.sessionId,
          events: session.events?.length ?? 0,
          snapshots: session.snapshots?.length ?? 0,
        });
        const latestText = session.snapshots.at(-1)?.text ?? "";
        setText(latestText);
        setEvents(session.events ?? []);
        setSnapshots(session.snapshots ?? []);
      })
      .catch((loadError: Error) => {
        console.error("[admin-session-detail] failed to load", loadError);
        setError(loadError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  console.log("[admin-session-detail] render", { id, loading, error, events: events.length, snapshots: snapshots.length });

  if (loading) {
    return <div className="p-6">Loading session...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Session Stats</h2>
          <p className="text-xs text-muted-foreground">{id}</p>
        </div>
        <Link to="/dashboard/admin/sessions" className="text-sm text-primary underline-offset-4 hover:underline">
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Final Content</CardTitle>
          <CardDescription>Rendered markdown from latest snapshot.</CardDescription>
        </CardHeader>
        <CardContent>
          <Preview markdown={text} />
        </CardContent>
        <CardContent>
          <p>
            {text}
          </p>
        </CardContent>
      </Card>

      <TeacherDashboard text={text} events={events} snapshots={snapshots} />
    </div>
  );
}
