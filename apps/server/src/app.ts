import cors from "cors";
import express from "express";
import os from "node:os";
import process from "node:process";

import { env } from "@vi-notes/env/server";
import { client } from "@vi-notes/db";

import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { notesRouter } from "./routes/notes.routes";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

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

  app.all("/api/health", async (_req, res) => {
    const dbStats = await client.stats();
    const memUsage = process.memoryUsage();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime()),
      },
      memory: {
        used: formatBytes(memUsage.heapUsed),
        total: formatBytes(memUsage.heapTotal),
        rss: formatBytes(memUsage.rss),
        external: formatBytes(memUsage.external || 0),
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        loadAvg: os.loadavg(),
        freeMemory: formatBytes(os.freemem()),
        totalMemory: formatBytes(os.totalmem()),
      },
      database: {
        connected: true,
        collections: Object.keys(dbStats.collections || {}),
        dataSize: formatBytes(dbStats.dataSize || 0),
        indexSize: formatBytes(dbStats.indexSize || 0),
      },
      environment: env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
    });
  });

  app.get("/", (_req, res) => {
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vi Notes API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 1.5rem;
    }
    .container { max-width: 800px; width: 100%; }
    h1 { font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #888; font-size: 1.1rem; margin-bottom: 3rem; }
    .links { display: flex; flex-direction: column; gap: 1rem; }
    .link-card {
      background: #141414;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .link-card:hover { border-color: #667eea; background: #1a1a1a; }
    .link-icon { font-size: 1.5rem; }
    .link-text { flex: 1; }
    .link-title { font-weight: 600; color: #fff; margin-bottom: 0.25rem; }
    .link-desc { font-size: 0.875rem; color: #666; }
    .link-arrow { color: #667eea; }
    .badge {
      display: inline-block;
      background: #222;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      color: #888;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Vi Notes API server</h1>
    <p class="subtitle">Note-taking with writing session analysis</p>
    
    <div class="links">
      <a href="/api/health" class="link-card">
        <span class="link-icon">H</span>
        <div class="link-text">
          <div class="link-title">Health Check</div>
          <div class="link-desc">System status and metrics</div>
        </div>
        <span class="link-arrow">→</span>
      </a>
    </div>

    <span class="badge">${env.NODE_ENV || "development"} • v${process.env.npm_package_version || "1.0.0"}</span>
</body>
</html>
    `);
  });

  return app;
}
