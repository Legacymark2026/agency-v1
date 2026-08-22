"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goldneezRouter = void 0;
const express_1 = require("express");
const goldneez_controller_1 = require("../controllers/goldneez.controller");
exports.goldneezRouter = (0, express_1.Router)();
exports.goldneezRouter.get("/rewards/points", goldneez_controller_1.GoldneezController.getPoints);
exports.goldneezRouter.post("/rewards/redeem", goldneez_controller_1.GoldneezController.redeemReward);
//# sourceMappingURL=goldneez.routes.js.map