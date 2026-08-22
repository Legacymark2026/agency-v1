import { Router } from "express";
import { VideoController } from "../controllers/video.controller.js";
import { validateRequest } from "../middlewares/video.middleware.js";
import { z } from "zod";

const createRenderSchema = z.object({
  templateId: z.string().optional(),
  outputFormat: z.string().optional(),
  resolution: z.string().optional(),
});

export const videoRouter = Router();

videoRouter.get("/video/projects", VideoController.getVideoProjects);
videoRouter.post("/video/render", validateRequest(createRenderSchema), VideoController.createRenderJob);
videoRouter.post("/video/optimize", VideoController.optimizeVideo);
videoRouter.post("/video/watermark", VideoController.applyWatermark);
