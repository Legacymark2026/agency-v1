import { Router } from "express";
import { AffiliateController } from "../controllers/affiliate.controller";

export const affiliateRouter = Router();

affiliateRouter.get("/affiliates/profile", AffiliateController.getProfile);
affiliateRouter.get("/r/:code", AffiliateController.trackClick);
