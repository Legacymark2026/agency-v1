import { Router } from "express";
import { AgentTeamController } from "../controllers/agent-team.controller";

export const agentTeamRouter = Router();

agentTeamRouter.get("/agent/teams", AgentTeamController.getTeams);
