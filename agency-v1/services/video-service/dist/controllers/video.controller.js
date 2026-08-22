"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoController = void 0;
const video_service_1 = require("../services/video.service");
class VideoController {
    /**
     * GET /api/video/projects
     */
    static async getVideoProjects(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const projects = await video_service_1.VideoService.getVideoProjects(companyId);
            res.json({ success: true, projects });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/video/render
     */
    static async createRenderJob(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const job = await video_service_1.VideoService.createRenderJob({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, job });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VideoController = VideoController;
//# sourceMappingURL=video.controller.js.map