import { Router } from "express";

import {
  createNoteController,
  getNoteController,
  getNoteAnalysisController,
  getNotesController,
  ingestNoteController,
  renameNoteController,
} from "../controllers/notes.controller";

export const notesRouter: ReturnType<typeof Router> = Router();

notesRouter.get("/", getNotesController);
notesRouter.post("/", createNoteController);
notesRouter.get("/:id", getNoteController);
notesRouter.get("/:id/analysis", getNoteAnalysisController);
notesRouter.post("/:id/ingest", ingestNoteController);
notesRouter.patch("/:id/title", renameNoteController);
