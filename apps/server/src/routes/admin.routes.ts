import { Router } from "express";

import { getSessionAnalysisController, getSessionController, listSessionsController } from "../controllers/admin.controller";

export const adminRouter: ReturnType<typeof Router> = Router();

adminRouter.get("/sessions", listSessionsController);
adminRouter.get("/sessions/:id", getSessionController);
adminRouter.get("/sessions/:id/analysis", getSessionAnalysisController);
