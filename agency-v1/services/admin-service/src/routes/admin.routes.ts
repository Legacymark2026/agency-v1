import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.get("/admin/kanban", AdminController.getKanban);
adminRouter.get("/admin/overview", AdminController.getOverview);
