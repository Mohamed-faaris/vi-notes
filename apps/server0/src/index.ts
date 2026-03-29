import express from "express";
import { client } from "@vi-notes/db";
import { env } from "@vi-notes/env/server";

const app = express();

app.get("/", (_req, res) => {
  res.json({ db: Boolean(client), env: env.NODE_ENV });
});

app.get("/api0", (_req, res) => {
  res.send("hello world");
});

app.listen(3001);
