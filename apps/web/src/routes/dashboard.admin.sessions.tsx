import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { Link, Outlet } from "react-router";

import { listAdminSessions, type AdminSessionItem } from "@/lib/notes-client";

export default function AdminSessionsRoute() {
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[admin-sessions] loading list");
    void listAdminSessions()
      .then((data) => {
        console.log("[admin-sessions] loaded", data.length, "sessions");
        setSessions(data);
      })
      .catch((loadError: Error) => {
        console.error("[admin-sessions] failed to load", loadError);
        setError(loadError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  console.log("[admin-sessions] render", { loading, error, count: sessions.length });

  if (loading) {
    return <div className="p-6">Loading admin sessions...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="grid gap-4 p-4 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Admin: All Sessions</CardTitle>
          <CardDescription>Stats are admin-only.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link
                key={session.sessionId}
                to={`/dashboard/admin/sessions/${session.sessionId}`}
                className="block rounded border border-border p-3 text-sm hover:bg-muted/40"
              >
                <p className="font-medium">{session.title}</p>
                <p className="text-xs text-muted-foreground">{session.userId}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Outlet />
    </div>
  );
}
