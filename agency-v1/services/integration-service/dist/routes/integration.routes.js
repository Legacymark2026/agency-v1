"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationRouter = void 0;
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
const integration_middleware_1 = require("../middlewares/integration.middleware");
const zod_1 = require("zod");
const connectIntegrationSchema = zod_1.z.object({
    provider: zod_1.z.string().min(1, "Provider is required"),
    config: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.integrationRouter = (0, express_1.Router)();
exports.integrationRouter.get("/integrations", integration_controller_1.IntegrationController.getIntegrations);
exports.integrationRouter.post("/integrations", (0, integration_middleware_1.validateRequest)(connectIntegrationSchema), integration_controller_1.IntegrationController.connectIntegration);
//# sourceMappingURL=integration.routes.js.map