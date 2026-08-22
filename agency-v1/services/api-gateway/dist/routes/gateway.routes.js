"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatewayRouter = void 0;
const express_1 = require("express");
const gateway_controller_1 = require("../controllers/gateway.controller");
exports.gatewayRouter = (0, express_1.Router)();
exports.gatewayRouter.post("/gateway/verify-token", gateway_controller_1.GatewayController.verifyToken);
exports.gatewayRouter.get("/gateway/services", gateway_controller_1.GatewayController.listServices);
//# sourceMappingURL=gateway.routes.js.map