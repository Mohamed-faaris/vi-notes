import { Router } from "express";

import {
  addNoteEventController,
  addNoteSnapshotController,
  createNoteController,
  endNoteController,
  getNoteController,
  getNotesController,
  renameNoteController,
} from "../controllers/notes.controller";

export const notesRouter: ReturnType<typeof Router> = Router();

notesRouter.get("/", getNotesController);
notesRouter.post("/", createNoteController);
notesRouter.get("/:id", getNoteController);
notesRouter.patch("/:id/title", renameNoteController);
notesRouter.post("/:id/event", addNoteEventController);
notesRouter.post("/:id/snapshot", addNoteSnapshotController);
notesRouter.post("/:id/end", endNoteController);
