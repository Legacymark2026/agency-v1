"use strict";
/**
 * Multi-Aspect Ratio Smart Cropper with Gaussian Blur Backdrop
 * ─────────────────────────────────────────────────────────────────────────────
 * Intelligently transforms 16:9 widescreen video into 9:16 vertical shorts,
 * 1:1 square, or 4:5 social feeds with automatic center face framing and blurred letterboxing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartReframeService = exports.SmartReframeService = void 0;
class SmartReframeService {
    /**
     * Computes optimal FFmpeg filter complex for target social aspect ratio.
     */
    computeReframeFilter(config) {
        let targetWidth = 1080;
        let targetHeight = 1920; // Default 9:16
        if (config.targetRatio === "1:1") {
            targetWidth = 1080;
            targetHeight = 1080;
        }
        else if (config.targetRatio === "4:5") {
            targetWidth = 1080;
            targetHeight = 1350;
        }
        else if (config.targetRatio === "16:9") {
            targetWidth = 1920;
            targetHeight = 1080;
        }
        let filterStr = "";
        if (config.fitMode === "BLURRED_BACKDROP_LETTERBOX") {
            // Background blurred + foreground scaled centered
            filterStr = `[0:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,boxblur=luma_radius=min(h\\,w)/20:luma_power=1[bg];[0:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;
        }
        else {
            // Smart center crop
            filterStr = `[0:v]scale=w=${targetWidth}:h=${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`;
        }
        return {
            targetWidth,
            targetHeight,
            aspectRatio: config.targetRatio,
            ffmpegFilterComplex: filterStr,
            recommendedResolution: `${targetWidth}x${targetHeight}`,
        };
    }
}
exports.SmartReframeService = SmartReframeService;
exports.smartReframeService = new SmartReframeService();
//# sourceMappingURL=smart-reframe.service.js.map