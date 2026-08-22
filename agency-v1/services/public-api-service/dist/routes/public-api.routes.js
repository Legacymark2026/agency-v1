"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicApiRouter = void 0;
const express_1 = require("express");
const public_api_controller_1 = require("../controllers/public-api.controller");
exports.publicApiRouter = (0, express_1.Router)();
exports.publicApiRouter.get("/v1/status", public_api_controller_1.PublicApiController.getStatus);
//# sourceMappingURL=public-api.routes.js.map