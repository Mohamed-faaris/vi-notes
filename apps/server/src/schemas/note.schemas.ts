import { z } from "zod";

export const editorEventSchema = z.object({
  t: z.number().int().positive(),
  type: z.enum(["insert", "delete", "paste"]),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  length: z.number().int().min(0),
  delta: z.number().int(),
  delay: z.number().int().min(0),
});

export const snapshotSchema = z.object({
  t: z.number().int().positive(),
  text: z.string(),
});

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const renameNoteSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const noteEventSchema = z.object({
  event: editorEventSchema,
});

export const noteSnapshotSchema = z.object({
  snapshot: snapshotSchema,
});

export const endNoteSchema = z.object({
  endTime: z.number().int().positive(),
});
