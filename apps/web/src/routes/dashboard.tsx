import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@vi-notes/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vi-notes/ui/components/dropdown-menu";
import { Input } from "@vi-notes/ui/components/input";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { MoreVertical, PencilLine, PanelLeftOpen } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { createNote, listNotes, renameNote, type NoteItem } from "@/lib/notes-client";

import type { DashboardOutletContext } from "./dashboard-context";

export default function DashboardLayout() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const loadedSessionIdRef = useRef<string | null>(null);

  const isAdmin = (session?.user as Record<string, unknown> | undefined)?.role === "admin";

  const activeId = useMemo(() => {
    const match = location.pathname.match(/^\/dashboard\/notes\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  const refreshNotes = useCallback(async () => {
    try {
      const data = await listNotes();
      setNotes(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load notes";
      toast.error(message);
    }
  }, [session?.user?.id]);

  const sessionId = session?.user?.id ?? null;

  useEffect(() => {
    if (!session && !isPending) {
      navigate("/login");
      return;
    }

    if (sessionId && loadedSessionIdRef.current !== sessionId) {
      loadedSessionIdRef.current = sessionId;
      void refreshNotes();
    }
  }, [session, sessionId, isPending, navigate, refreshNotes]);

  useEffect(() => {
    if (!sessionId) {
      loadedSessionIdRef.current = null;
    }
  }, [sessionId]);

  useEffect(() => {
    const isDashboardRoot = location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    if (isDashboardRoot && !activeId && notes.length > 0) {
      navigate(`/dashboard/notes/${notes[0]?.sessionId}`);
    }
  }, [activeId, notes, navigate, location.pathname]);

  async function handleCreateNote() {
    setIsCreating(true);
    try {
      const created = await createNote("New Note");
      await refreshNotes();
      navigate(`/dashboard/notes/${created.sessionId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create note";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function submitRename(sessionId: string) {
    const title = renameValue.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }

    try {
      await renameNote(sessionId, title);
      await refreshNotes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to rename note";
      toast.error(message);
    }

    setRenamingId(null);
    setRenameValue("");
  }

  if (isPending) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const outletContext: DashboardOutletContext = {
    notes,
    refreshNotes,
  };

  return (
    <div className="grid h-svh grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-border bg-card">
        <div className="p-3">
          <Button className="w-full" onClick={handleCreateNote} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create New"}
          </Button>
          {isAdmin ? (
            <Link to="/dashboard/admin/sessions" className="mt-2 block text-xs text-primary underline-offset-4 hover:underline">
              Admin: All Sessions
            </Link>
          ) : null}
        </div>

        <div className="h-[calc(100svh-84px)] overflow-auto p-3">
          <div className="space-y-2">
            {notes.map((note) => {
              const isActive = activeId === note.sessionId;
              return (
                <div
                  key={note.sessionId}
                  className={`rounded border p-2 text-sm ${isActive ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  {renamingId === note.sessionId ? (
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={() => void submitRename(note.sessionId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void submitRename(note.sessionId);
                        }
                        if (event.key === "Escape") {
                          setRenamingId(null);
                          setRenameValue("");
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => navigate(`/dashboard/notes/${note.sessionId}`)}
                      onDoubleClick={() => {
                        setRenamingId(note.sessionId);
                        setRenameValue(note.title);
                      }}
                    >
                      <p className="truncate font-medium">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(note.startTime).toLocaleDateString()}</p>
                    </button>
                  )}
                  {renamingId !== note.sessionId ? (
                    <div className="mt-2 flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-none"
                        onClick={() => navigate(`/dashboard/notes/${note.sessionId}`)}
                        aria-label={`Open ${note.title}`}
                      >
                        <PanelLeftOpen className="size-3.5" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-none border border-transparent bg-transparent text-xs text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted focus:outline-none" aria-label="Note actions">
                          <MoreVertical className="size-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6}>
                          <DropdownMenuItem
                            onSelect={() => {
                              setRenamingId(note.sessionId);
                              setRenameValue(note.title);
                            }}
                          >
                            <PencilLine />
                            Rename title
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => navigate(`/dashboard/notes/${note.sessionId}`)}
                          >
                            Open note
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="min-h-0">
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}
