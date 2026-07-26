import { Router } from "express";
import { GoldneezController } from "../controllers/goldneez.controller";

export const goldneezRouter = Router();

goldneezRouter.get("/rewards/points", GoldneezController.getPoints);
goldneezRouter.post("/rewards/redeem", GoldneezController.redeemReward);
