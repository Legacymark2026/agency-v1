"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoRouter = void 0;
const express_1 = require("express");
const video_controller_js_1 = require("../controllers/video.controller.js");
const video_middleware_js_1 = require("../middlewares/video.middleware.js");
const zod_1 = require("zod");
const createRenderSchema = zod_1.z.object({
    templateId: zod_1.z.string().optional(),
    outputFormat: zod_1.z.string().optional(),
    resolution: zod_1.z.string().optional(),
});
exports.videoRouter = (0, express_1.Router)();
// Core Video Endpoints
exports.videoRouter.get("/video/projects", video_controller_js_1.VideoController.getVideoProjects);
exports.videoRouter.post("/video/render", (0, video_middleware_js_1.validateRequest)(createRenderSchema), video_controller_js_1.VideoController.createRenderJob);
exports.videoRouter.post("/video/optimize", video_controller_js_1.VideoController.optimizeVideo);
exports.videoRouter.post("/video/watermark", video_controller_js_1.VideoController.applyWatermark);
// ── 7 Tier-1 Enterprise Video AI Endpoints ────────────────────────────────────
exports.videoRouter.post("/video/auto-clip", video_controller_js_1.VideoController.autoClip);
exports.videoRouter.post("/video/kinetic-subtitles", video_controller_js_1.VideoController.kineticSubtitles);
exports.videoRouter.post("/video/remove-silence", video_controller_js_1.VideoController.removeSilence);
exports.videoRouter.post("/video/auto-duck", video_controller_js_1.VideoController.autoDuck);
exports.videoRouter.post("/video/smart-reframe", video_controller_js_1.VideoController.smartReframe);
exports.videoRouter.post("/video/match-broll", video_controller_js_1.VideoController.matchBroll);
exports.videoRouter.post("/video/generate-thumbnail", video_controller_js_1.VideoController.generateThumbnail);
// ── Ultra-Professional Suite Endpoints (Speech & Storyboard) ────────────────
exports.videoRouter.post("/video/enhance-audio", video_controller_js_1.VideoController.enhanceAudio);
exports.videoRouter.post("/video/voiceover", video_controller_js_1.VideoController.voiceover);
exports.videoRouter.post("/video/script-to-video", video_controller_js_1.VideoController.generateScript);
//# sourceMappingURL=video.routes.js.map