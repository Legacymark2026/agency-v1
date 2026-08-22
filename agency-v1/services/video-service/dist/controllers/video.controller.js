"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    /**
     * POST /api/video/optimize
     */
    static async optimizeVideo(req, res, next) {
        try {
            const { videoPath } = req.body;
            if (!videoPath) {
                return res.status(400).json({ success: false, error: "videoPath is required" });
            }
            const { VideoProcessorService } = await Promise.resolve().then(() => __importStar(require("../services/video-processor.service.js")));
            const result = await VideoProcessorService.optimizeVideoForWeb(String(videoPath));
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/video/watermark
     */
    static async applyWatermark(req, res, next) {
        try {
            const { videoPath, logoPath, position } = req.body;
            if (!videoPath || !logoPath) {
                return res.status(400).json({ success: false, error: "videoPath and logoPath are required" });
            }
            const { VideoProcessorService } = await Promise.resolve().then(() => __importStar(require("../services/video-processor.service.js")));
            const result = await VideoProcessorService.applyWatermark(String(videoPath), String(logoPath), position);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VideoController = VideoController;
//# sourceMappingURL=video.controller.js.map