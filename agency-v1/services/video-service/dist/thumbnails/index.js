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
exports.getVideoDuration = getVideoDuration;
exports.detectSceneChanges = detectSceneChanges;
exports.generateThumbnail = generateThumbnail;
exports.extractBestFrames = extractBestFrames;
exports.extractFrameAtTimestamp = extractFrameAtTimestamp;
exports.generateThumbnailGrid = generateThumbnailGrid;
exports.pickBestThumbnail = pickBestThumbnail;
exports.deleteThumbnails = deleteThumbnails;
exports.getThumbnailAspectRatio = getThumbnailAspectRatio;
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const DEFAULT_OPTIONS = {
    count: 10,
    width: 1920,
    height: 1080,
    quality: 90,
    format: 'jpg',
    method: 'scene',
    interval: 5,
    minSceneDuration: 2,
    maxThumbnails: 20,
};
function generateThumbnailId() {
    return `thumb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function getFormatExtension(format) {
    return format === 'jpg' ? '.jpg' : format === 'png' ? '.png' : '.webp';
}
function getVideoDuration(videoPath) {
    try {
        const output = (0, child_process_1.execSync)(`ffprobe -i "${videoPath}" -show_entries format=duration -v quiet -of csv="p=0"`, { timeout: 10000 });
        return parseFloat(output.toString().trim()) || 0;
    }
    catch {
        return 0;
    }
}
function detectSceneChanges(videoPath, minSceneDuration = 2) {
    try {
        const result = (0, child_process_1.execSync)(`ffmpeg -i "${videoPath}" -filter:v "select='gt(scene,0.3)',showinfo" -f null - 2>&1`, { timeout: 60000 });
        const output = result.toString();
        const scenes = [];
        const sceneRegex = /pts_time:([\d.]+)/g;
        let match;
        while ((match = sceneRegex.exec(output)) !== null) {
            const timestamp = parseFloat(match[1]);
            if (scenes.length === 0 || timestamp - scenes[scenes.length - 1].timestamp >= minSceneDuration) {
                scenes.push({
                    timestamp,
                    score: Math.random() * 0.5 + 0.5,
                    type: 'cut',
                });
            }
        }
        return scenes;
    }
    catch {
        return [];
    }
}
function generateThumbnail(videoPath, outputDir, timestamp, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const ext = getFormatExtension(opts.format || 'jpg');
    const filename = `thumbnail_${generateThumbnailId()}${ext}`;
    const outputPath = (0, path_1.join)(outputDir, filename);
    try {
        (0, child_process_1.execSync)(`ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -s ${opts.width}x${opts.height} -q:v ${opts.quality} -f image2 "${outputPath}" -y 2>/dev/null`, { timeout: 30000 });
        const stats = (0, child_process_1.execSync)(`stat -c%s "${outputPath}"`, { timeout: 5000 });
        const fileSize = parseInt(stats.toString().trim());
        return {
            path: outputPath,
            timestamp,
            score: calculateThumbnailScore(outputPath, timestamp),
            reason: 'Extracted at timestamp',
            width: opts.width || 1920,
            height: opts.height || 1080,
            format: opts.format || 'jpg',
            fileSize,
        };
    }
    catch {
        return {
            path: outputPath,
            timestamp,
            score: 30,
            reason: 'Fallback thumbnail',
            width: opts.width || 1920,
            height: opts.height || 1080,
            format: opts.format || 'jpg',
            fileSize: 0,
        };
    }
}
function calculateThumbnailScore(imagePath, _timestamp) {
    try {
        const result = (0, child_process_1.execSync)(`ffmpeg -i "${imagePath}" -vf "signalstats,histogram" -f null - 2>&1`, { timeout: 10000 });
        const output = result.toString();
        let score = 50;
        const brightnessMatch = output.match(/YMIN:\s*(\d+)/);
        const contrastMatch = output.match(/YMAX:\s*(\d+)/);
        if (brightnessMatch && contrastMatch) {
            const min = parseInt(brightnessMatch[1]);
            const max = parseInt(contrastMatch[1]);
            const contrast = max - min;
            if (contrast > 100)
                score += 20;
            else if (contrast > 60)
                score += 10;
            else
                score -= 10;
            if (min > 20 && max < 235)
                score += 10;
        }
        const satMatch = output.match(/SATAVG:\s*([\d.]+)/);
        if (satMatch) {
            const sat = parseFloat(satMatch[1]);
            if (sat > 0.3 && sat < 0.8)
                score += 10;
            else if (sat < 0.1)
                score -= 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    catch {
        return 50;
    }
}
async function extractBestFrames(videoPath, outputDir, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    await (0, promises_1.mkdir)(outputDir, { recursive: true });
    const duration = getVideoDuration(videoPath);
    const thumbnails = [];
    if (opts.method === 'scene' || opts.method === 'combined') {
        const scenes = detectSceneChanges(videoPath, opts.minSceneDuration);
        if (scenes.length > 0) {
            const sceneTimestamps = scenes
                .map((s) => s.timestamp)
                .filter((t) => t > 0.5 && t < duration - 0.5);
            const selectedTimestamps = sceneTimestamps.slice(0, opts.maxThumbnails || 20);
            for (const timestamp of selectedTimestamps) {
                const thumb = generateThumbnail(videoPath, outputDir, timestamp, opts);
                thumbnails.push(thumb);
            }
        }
    }
    if (opts.method === 'interval' && thumbnails.length < (opts.count || 10)) {
        const interval = opts.interval || Math.max(1, duration / (opts.count || 10));
        for (let t = interval; t < duration && thumbnails.length < (opts.count || 10); t += interval) {
            if (!thumbnails.some((th) => Math.abs(th.timestamp - t) < 1)) {
                const thumb = generateThumbnail(videoPath, outputDir, t, opts);
                thumbnails.push(thumb);
            }
        }
    }
    if (thumbnails.length === 0) {
        const mid = duration / 2;
        const thumb = generateThumbnail(videoPath, outputDir, mid, opts);
        thumbnails.push(thumb);
    }
    thumbnails.sort((a, b) => b.score - a.score);
    const bestThumbnail = thumbnails.length > 0 ? thumbnails[0] : null;
    return {
        thumbnails,
        bestThumbnail,
        videoDuration: duration,
        method: opts.method || 'scene',
    };
}
function extractFrameAtTimestamp(videoPath, outputPath, timestamp, width, height) {
    return new Promise((resolve, reject) => {
        try {
            const size = width && height ? `-s ${width}x${height}` : '';
            (0, child_process_1.execSync)(`ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 ${size} -q:v 2 "${outputPath}" -y 2>/dev/null`, { timeout: 30000 });
            resolve();
        }
        catch (error) {
            reject(error);
        }
    });
}
function generateThumbnailGrid(thumbnails, outputPath, cols = 4, rows = 3) {
    return new Promise((resolve, reject) => {
        try {
            const maxThumbs = cols * rows;
            const selected = thumbnails.slice(0, maxThumbs);
            const inputs = selected.map((t) => `-i "${t.path}"`).join(' ');
            const filterComplex = selected
                .map((_, i) => `[${i}:v]scale=320:180,setsar=1[img${i}]`)
                .join(';');
            const concat = selected
                .map((_, i) => `[img${i}]`)
                .join('');
            const layout = `x=${cols}_tile=${cols}x${rows}`;
            (0, child_process_1.execSync)(`ffmpeg ${inputs} -filter_complex "${filterComplex};${concat}xstack=grid=${cols}x${rows}:${layout}" "${outputPath}" -y 2>/dev/null`, { timeout: 60000 });
            resolve();
        }
        catch (error) {
            reject(error);
        }
    });
}
function pickBestThumbnail(thumbnails) {
    if (thumbnails.length === 0)
        return null;
    return thumbnails.reduce((best, current) => current.score > best.score ? current : best);
}
function deleteThumbnails(thumbnails) {
    return Promise.all(thumbnails.map(async (thumb) => {
        try {
            const { unlink } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await unlink(thumb.path);
        }
        catch { }
    }));
}
function getThumbnailAspectRatio(width, height) {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}
//# sourceMappingURL=index.js.map