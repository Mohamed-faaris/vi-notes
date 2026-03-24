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
      return;
    }

    void getAdminSession(id)
      .then((session) => {
        const latestText = session.snapshots.at(-1)?.text ?? "";
        setText(latestText);
        setEvents(session.events ?? []);
        setSnapshots(session.snapshots ?? []);
      })
      .catch((loadError: Error) => {
        setError(loadError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading session...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <Link to="/dashboard/admin/sessions" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to all sessions
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Final Content</CardTitle>
          <CardDescription>Rendered markdown from latest snapshot.</CardDescription>
        </CardHeader>
        <CardContent>
          <Preview markdown={text} />
        </CardContent>
      </Card>

      <TeacherDashboard text={text} events={events} snapshots={snapshots} />
    </div>
  );
}
