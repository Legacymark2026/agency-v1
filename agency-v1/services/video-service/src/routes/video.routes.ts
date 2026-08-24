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

// Core Video Endpoints
videoRouter.get("/video/projects", VideoController.getVideoProjects);
videoRouter.post("/video/render", validateRequest(createRenderSchema), VideoController.createRenderJob);
videoRouter.post("/video/optimize", VideoController.optimizeVideo);
videoRouter.post("/video/watermark", VideoController.applyWatermark);

// ── 7 Tier-1 Enterprise Video AI Endpoints ────────────────────────────────────
videoRouter.post("/video/auto-clip", VideoController.autoClip);
videoRouter.post("/video/kinetic-subtitles", VideoController.kineticSubtitles);
videoRouter.post("/video/remove-silence", VideoController.removeSilence);
videoRouter.post("/video/auto-duck", VideoController.autoDuck);
videoRouter.post("/video/smart-reframe", VideoController.smartReframe);
videoRouter.post("/video/match-broll", VideoController.matchBroll);
videoRouter.post("/video/generate-thumbnail", VideoController.generateThumbnail);
