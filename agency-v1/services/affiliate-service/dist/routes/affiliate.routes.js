"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateRouter = void 0;
const express_1 = require("express");
const affiliate_controller_1 = require("../controllers/affiliate.controller");
exports.affiliateRouter = (0, express_1.Router)();
exports.affiliateRouter.get("/affiliates/profile", affiliate_controller_1.AffiliateController.getProfile);
exports.affiliateRouter.get("/r/:code", affiliate_controller_1.AffiliateController.trackClick);
//# sourceMappingURL=affiliate.routes.js.map