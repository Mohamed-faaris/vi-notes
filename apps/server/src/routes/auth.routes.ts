import { auth } from "@vi-notes/auth";
import { toNodeHandler } from "better-auth/node";
import { Router } from "express";

export const authRouter: ReturnType<typeof Router> = Router();

authRouter.all("{/*path}", toNodeHandler(auth));
