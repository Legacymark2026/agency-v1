"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoRouter = void 0;
const express_1 = require("express");
const video_controller_1 = require("../controllers/video.controller");
const video_middleware_1 = require("../middlewares/video.middleware");
const zod_1 = require("zod");
const createRenderSchema = zod_1.z.object({
    templateId: zod_1.z.string().optional(),
    outputFormat: zod_1.z.string().optional(),
    resolution: zod_1.z.string().optional(),
});
exports.videoRouter = (0, express_1.Router)();
exports.videoRouter.get("/video/projects", video_controller_1.VideoController.getVideoProjects);
exports.videoRouter.post("/video/render", (0, video_middleware_1.validateRequest)(createRenderSchema), video_controller_1.VideoController.createRenderJob);
//# sourceMappingURL=video.routes.js.map