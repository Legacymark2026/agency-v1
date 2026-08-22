"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentTeamRouter = void 0;
const express_1 = require("express");
const agent_team_controller_1 = require("../controllers/agent-team.controller");
const preset_gallery_service_1 = require("../services/preset-gallery.service");
exports.agentTeamRouter = (0, express_1.Router)();
exports.agentTeamRouter.get("/agent/teams", agent_team_controller_1.AgentTeamController.getTeams);
exports.agentTeamRouter.post("/agent/teams/:teamId/run", agent_team_controller_1.AgentTeamController.runTeam);
exports.agentTeamRouter.get("/agent/presets", (_req, res) => {
    res.json({
        success: true,
        presets: preset_gallery_service_1.PresetGalleryService.getPresets(),
        categories: preset_gallery_service_1.PresetGalleryService.getCategories()
    });
});
//# sourceMappingURL=agent-team.routes.js.map