import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import { validateRequest } from "../middlewares/project.middleware";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export const projectRouter = Router();

projectRouter.get("/projects", ProjectController.getProjects);
projectRouter.post("/projects", validateRequest(createProjectSchema), ProjectController.createProject);
