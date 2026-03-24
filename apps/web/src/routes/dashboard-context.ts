import type { NoteItem } from "@/lib/notes-client";

export type DashboardOutletContext = {
  notes: NoteItem[];
  refreshNotes: () => Promise<void>;
};
