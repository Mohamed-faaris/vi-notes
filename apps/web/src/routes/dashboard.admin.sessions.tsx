import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { Link } from "react-router";

import { listAdminSessions, type AdminSessionItem } from "@/lib/notes-client";

export default function AdminSessionsRoute() {
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listAdminSessions()
      .then((data) => {
        setSessions(data);
      })
      .catch((loadError: Error) => {
        setError(loadError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6">Loading admin sessions...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="p-4">
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
    </div>
  );
}
