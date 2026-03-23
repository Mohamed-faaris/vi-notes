import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@vi-notes/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";

import { Preview } from "@/components/editor/preview";
import { TeacherDashboard } from "@/components/editor/teacher-dashboard";
import type { EditorEvent, Snapshot } from "@/components/editor/types";
import { authClient } from "@/lib/auth-client";
import { getSessionById, type SessionItem } from "@/lib/writing-session-client";

export default function AnalyzeSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [targetSession, setTargetSession] = useState<SessionItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session && !isPending) {
      navigate("/login");
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (!sessionId) {
      setError("Session id is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    void getSessionById(sessionId)
      .then((result) => {
        if (!result) {
          setError("Session not found.");
          setTargetSession(null);
          return;
        }

        setTargetSession(result);
      })
      .catch((loadError: Error) => {
        setError(loadError.message || "Failed to load session.");
        setTargetSession(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId]);

  const sessionText = useMemo(() => {
    return targetSession?.snapshots.at(-1)?.text ?? "";
  }, [targetSession]);

  if (isPending || isLoading) {
    return <div className="container mx-auto max-w-7xl p-6">Loading session analysis...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Error</CardTitle>
            <CardDescription>Could not load this session.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Session Analysis</h1>
          <p className="text-xs text-muted-foreground">Session ID: {targetSession?.sessionId}</p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Final Markdown</CardTitle>
          <CardDescription>Latest snapshot content for this session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Preview markdown={sessionText} />
        </CardContent>
      </Card>

      <TeacherDashboard
        text={sessionText}
        events={(targetSession?.events ?? []) as EditorEvent[]}
        snapshots={(targetSession?.snapshots ?? []) as Snapshot[]}
      />
    </div>
  );
}
