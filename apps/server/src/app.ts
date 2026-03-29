import cors from "cors";
import express from "express";

import { env } from "@vi-notes/env/server";
import { connectDB } from "@vi-notes/db";

import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { notesRouter } from "./routes/notes.routes";

export function createApp(): express.Application {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/notes", notesRouter);
  app.use("/api/admin", adminRouter);

  app.get("/", (_req, res) => {
    res.status(200).send("OK");
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const db = await connectDB();
      const dbState = await db!.command({ ping: 1 });
      res.status(200).json({ status: "ok", db: "connected", ping: dbState });
    } catch (error) {
      res.status(503).json({ status: "error", db: "disconnected", error: String(error) });
    }
  });

  return app;
}
