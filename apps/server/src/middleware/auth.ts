import { auth } from "@vi-notes/auth";
import type express from "express";

export async function getServerSession(request: express.Request) {
  const headers = new Headers();
  const cookie = request.headers.cookie;
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return auth.api.getSession({ headers });
}

export async function requireUser(request: express.Request, response: express.Response) {
  const session = await getServerSession(request);
  if (!session) {
    response.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return session;
}

export async function requireAdmin(request: express.Request, response: express.Response) {
  const session = await requireUser(request, response);
  if (!session) {
    return null;
  }

  const role = ((session.user as Record<string, unknown>).role ?? "user") as string;
  if (role !== "admin") {
    response.status(403).json({ error: "Forbidden" });
    return null;
  }

  return session;
}
