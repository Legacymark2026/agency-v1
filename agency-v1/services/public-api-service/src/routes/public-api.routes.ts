import { Router } from "express";
import { PublicApiController } from "../controllers/public-api.controller";

export const publicApiRouter = Router();

publicApiRouter.get("/v1/status", PublicApiController.getStatus);
