import { Router } from "express";
import { AgentTeamController } from "../controllers/agent-team.controller";
import { PresetGalleryService } from "../services/preset-gallery.service";

export const agentTeamRouter = Router();

agentTeamRouter.get("/agent/teams", AgentTeamController.getTeams);

agentTeamRouter.get("/agent/presets", (_req, res) => {
  res.json({
    success: true,
    presets: PresetGalleryService.getPresets(),
    categories: PresetGalleryService.getCategories()
  });
});
