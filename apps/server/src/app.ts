import cors from "cors";
import express from "express";

import { env } from "@vi-notes/env/server";

import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { notesRouter } from "./routes/notes.routes";
import { time, timeStamp } from "node:console";
import { client } from "@vi-notes/db";

export function createApp(): express.Application {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/notes", notesRouter);
  app.use("/api/admin", adminRouter);

  app.all("/api/health", (_req, res) => {
    res.status(200).json({
       status: "ok",
       db:client.stats(),
       timeStamp: timeStamp(),
       });
  });

  app.get("/", (_req, res) => {
    res.status(200).send("Welcome to the Vi Notes API!, visit <a href=\"/api/health\">/api/health</a> for health check");
  });

  return app;
}
