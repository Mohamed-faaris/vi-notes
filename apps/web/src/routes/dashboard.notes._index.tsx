import { Button } from "@vi-notes/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vi-notes/ui/components/card";
import { useNavigate, useOutletContext } from "react-router";

import { createNote } from "@/lib/notes-client";

import type { DashboardOutletContext } from "./dashboard-context";

export default function DashboardNotesIndexRoute() {
  const navigate = useNavigate();
  const { refreshNotes } = useOutletContext<DashboardOutletContext>();

  async function handleCreate() {
    const created = await createNote("New Note");
    await refreshNotes();
    navigate(`/dashboard/notes/${created.sessionId}`);
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your first note</CardTitle>
          <CardDescription>Use the sidebar or create a note now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void handleCreate()}>Create Note</Button>
        </CardContent>
      </Card>
    </div>
  );
}
