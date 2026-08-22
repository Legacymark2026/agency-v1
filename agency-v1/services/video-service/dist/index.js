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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Observability registration — must be first
try {
    require("@agency/observability/register");
}
catch { /* observability optional */ }
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("@agency/database");
const service_auth_1 = require("@agency/service-auth");
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const path_1 = require("path");
const zod_1 = require("zod");
const ioredis_1 = __importDefault(require("ioredis"));
const websocket_1 = require("./websocket");
const render_queue_1 = require("./queue/render-queue");
const templates_1 = require("./templates");
const lut_1 = require("./lut");
const presets_1 = require("./presets");
const rate_limit_1 = require("./middleware/rate-limit");
const captioning_1 = require("./captioning");
const beat_detection_1 = require("./beat-detection");
const transitions_1 = require("./transitions");
const color_match_1 = require("./color-match");
const thumbnails_1 = require("./thumbnails");
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("video-service"));
app.get("/metrics", observability_1.metricsEndpoint);
const server = (0, http_1.createServer)(app);
const port = process.env.PORT || 4007;
// ─── Redis connection ────────────────────────────────────────────────────────
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
});
let redisAvailable = false;
redis.on('error', (err) => {
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND') || err.message.includes('NOAUTH')) {
        redisAvailable = false;
    }
});
redis.on('ready', () => {
    redisAvailable = true;
    console.log('[redis] Connected and ready');
});
// ─── Middleware ──────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
const video_routes_1 = require("./routes/video.routes");
const video_middleware_1 = require("./middlewares/video.middleware");
app.use("/api/v1", video_routes_1.videoRouter);
app.use(video_middleware_1.errorHandler);
// ─── Auth middleware ─────────────────────────────────────────────────────────
function requireInternalSecret(req, res, next) {
    const secret = req.headers['x-internal-secret'];
    const expected = process.env.INTERNAL_SECRET ?? 'video-service-secret-change-in-production';
    if (secret !== expected) {
        return res.status(403).json({ error: 'Forbidden: invalid or missing internal secret' });
    }
    next();
}
// ─── Zod schemas ─────────────────────────────────────────────────────────────
const RenderJobSchema = zod_1.z.object({
    jobId: zod_1.z.string().min(1),
    companyId: zod_1.z.string().min(1),
    projectId: zod_1.z.string().min(1),
    templateId: zod_1.z.string().optional(),
    presetId: zod_1.z.string().optional(),
    config: zod_1.z.object({
        format: zod_1.z.enum(['16:9', '9:16', '1:1', '4:5']).optional().default('16:9'),
        style: zod_1.z.string().optional().default('cinematic'),
        platform: zod_1.z.string().optional().default('reels'),
        duration: zod_1.z.number().optional().default(20),
    }).optional().default({}),
    timeline: zod_1.z.object({
        totalDuration: zod_1.z.number().optional(),
    }).optional().default({}),
    audioTracks: zod_1.z.array(zod_1.z.any()).optional().default([]),
});
// ─── Initialize WebSocket ────────────────────────────────────────────────────
(0, websocket_1.initWebSocket)(server);
// ─── Initialize BullMQ Worker ────────────────────────────────────────────────
const outputDir = process.env.RENDER_OUTPUT_DIR || (0, path_1.join)(process.cwd(), 'renders');
(0, render_queue_1.createWorker)(outputDir);
// ─── Healthcheck ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
    let redisStatus = 'disconnected';
    let ffmpegStatus = false;
    let wsClients = 0;
    try {
        await redis.ping();
        redisStatus = 'connected';
        redisAvailable = true;
    }
    catch {
        redisStatus = redisAvailable ? 'connected' : 'disconnected (using in-memory fallback)';
    }
    try {
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        await execAsync('ffmpeg -version', { timeout: 3000 });
        ffmpegStatus = true;
    }
    catch {
        ffmpegStatus = false;
    }
    try {
        wsClients = (0, websocket_1.getConnectedClients)();
    }
    catch {
        wsClients = 0;
    }
    res.status(200).json({
        status: 'ok',
        service: 'video-service',
        version: '3.0.0',
        redis: redisStatus,
        ffmpeg: ffmpegStatus,
        websocketClients: wsClients,
    });
});
// ─── POST /api/video/render — Start render job ───────────────────────────────
app.post('/api/video/render', requireInternalSecret, rate_limit_1.rateLimitMiddleware, async (req, res) => {
    try {
        const parsed = RenderJobSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid payload',
                details: parsed.error.flatten(),
            });
        }
        const { jobId, companyId, projectId, config, timeline, audioTracks, templateId, presetId } = parsed.data;
        let finalConfig = config;
        let finalTimeline = timeline;
        if (templateId) {
            const template = (0, templates_1.applyTemplate)(templateId);
            if (template) {
                finalConfig = { ...finalConfig, format: template.config.format, style: template.config.style, platform: template.config.platform };
                finalTimeline = { ...finalTimeline, totalDuration: template.timeline.hookDuration + template.timeline.bodyDuration + template.timeline.climaxDuration + template.timeline.outroDuration };
            }
        }
        if (presetId) {
            const preset = (0, presets_1.getPresetById)(presetId);
            if (preset) {
                finalConfig = {
                    ...finalConfig,
                    format: preset.aspectRatio,
                    platform: preset.platform,
                };
            }
        }
        const job = await (0, render_queue_1.addRenderJob)({
            jobId,
            companyId,
            projectId,
            config: finalConfig,
            timeline: finalTimeline,
            audioTracks,
        });
        res.status(202).json({
            jobId,
            status: 'QUEUED',
            message: 'Render job queued',
        });
    }
    catch (error) {
        console.error('[render] Error starting job:', error);
        res.status(500).json({ error: error.message });
    }
});
// ─── GET /api/video/render/:jobId — Job status ──────────────────────────────
app.get('/api/video/render/:jobId', async (req, res) => {
    const jobId = req.params.jobId;
    const status = await (0, render_queue_1.getJobStatus)(jobId);
    if (!status) {
        return res.status(404).json({ error: 'Job not found or expired' });
    }
    res.json({
        jobId,
        status: status.state,
        progress: status.progress,
        outputUrl: status.result?.outputUrl ?? null,
        errorMessage: status.failedReason ?? null,
        createdAt: new Date().toISOString(),
    });
});
// ─── POST /api/video/render/:jobId/cancel — Cancel job ──────────────────────
app.post('/api/video/render/:jobId/cancel', requireInternalSecret, async (req, res) => {
    const jobId = req.params.jobId;
    const success = await (0, render_queue_1.cancelJob)(jobId);
    if (!success) {
        return res.status(404).json({ error: 'Job not found or already processing' });
    }
    res.json({ success: true });
});
// ─── GET /api/video/jobs — List all jobs ────────────────────────────────────
app.get('/api/video/jobs', async (_req, res) => {
    const stats = await (0, render_queue_1.getQueueStats)();
    res.json({
        queue: stats,
        total: stats.waiting + stats.active + stats.completed + stats.failed,
    });
});
// ─── GET /api/video/templates — List templates ──────────────────────────────
app.get('/api/video/templates', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    if (category) {
        res.json({ templates: (0, templates_1.getTemplatesByCategory)(category) });
    }
    else {
        res.json({ templates: (0, templates_1.getAllTemplates)() });
    }
});
// ─── GET /api/video/templates/:id — Get template ────────────────────────────
app.get('/api/video/templates/:id', (req, res) => {
    const template = (0, templates_1.getTemplateById)(req.params.id);
    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
});
// ─── GET /api/video/presets — List render presets ───────────────────────────
app.get('/api/video/presets', (req, res) => {
    const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
    if (platform) {
        res.json({ presets: (0, presets_1.getPresetsByPlatform)(platform) });
    }
    else {
        res.json({ presets: (0, presets_1.getAllPresets)() });
    }
});
// ─── GET /api/video/presets/:id — Get preset ────────────────────────────────
app.get('/api/video/presets/:id', (req, res) => {
    const preset = (0, presets_1.getPresetById)(req.params.id);
    if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
    }
    res.json({ preset, ffmpegArgs: (0, presets_1.generateFFmpegArgs)(preset, 'input.mp4', 'output.mp4') });
});
// ─── GET /api/video/luts — List LUT presets ─────────────────────────────────
app.get('/api/video/luts', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    if (category) {
        res.json({ luts: (0, lut_1.getLUTPresetsByCategory)(category) });
    }
    else {
        res.json({ luts: (0, lut_1.getLUTPresets)() });
    }
});
// ─── GET /api/video/rate-limit/:companyId — Rate limit status ───────────────
app.get('/api/video/rate-limit/:companyId', async (req, res) => {
    const status = await (0, rate_limit_1.getRateLimitStatus)(req.params.companyId);
    res.json(status);
});
// ─── GET /api/video/stats — Queue stats ─────────────────────────────────────
app.get('/api/video/stats', async (_req, res) => {
    const stats = await (0, render_queue_1.getQueueStats)();
    res.json({
        ...stats,
        websocketClients: (0, websocket_1.getConnectedClients)(),
    });
});
// ─── POST /api/video/render/:jobId/webhook — Webhook callback ───────────────
app.post('/api/video/render/:jobId/webhook', async (req, res) => {
    const jobId = req.params.jobId;
    const { url, secret } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Missing webhook URL' });
    }
    res.json({ success: true, message: 'Webhook registered (not yet implemented)' });
});
// ─── POST /api/video/caption/transcribe — Transcribe audio ────────────────────
app.post('/api/video/caption/transcribe', requireInternalSecret, async (req, res) => {
    try {
        const { audioPath, language } = req.body;
        const result = await (0, captioning_1.transcribeAudio)(audioPath, { language });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/caption/export — Export captions ─────────────────────────
app.post('/api/video/caption/export', async (req, res) => {
    try {
        const { segments, format } = req.body;
        let output;
        switch (format) {
            case 'srt':
                output = (0, captioning_1.exportSRT)(segments);
                break;
            case 'vtt':
                output = (0, captioning_1.exportVTT)(segments);
                break;
            case 'ass':
                output = (0, captioning_1.exportASS)(segments);
                break;
            default: return res.status(400).json({ error: 'Unsupported format' });
        }
        res.json({ format, content: output });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/caption/extract-audio — Extract audio from video ─────────
app.post('/api/video/caption/extract-audio', requireInternalSecret, async (req, res) => {
    try {
        const { videoPath, outputPath } = req.body;
        await (0, captioning_1.extractAudioFromVideo)(videoPath, outputPath);
        res.json({ success: true, outputPath });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/beat/detect — Detect beats ──────────────────────────────
app.post('/api/video/beat/detect', requireInternalSecret, async (req, res) => {
    try {
        const { audioPath, options } = req.body;
        const result = await (0, beat_detection_1.detectBeats)(audioPath, options);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/beat/snap — Snap to nearest beat ────────────────────────
app.post('/api/video/beat/snap', async (req, res) => {
    try {
        const { time, beats } = req.body;
        const snapped = (0, beat_detection_1.snapToNearestBeat)(time, beats);
        res.json({ original: time, snapped });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/beat/cut-points — Generate cut points ───────────────────
app.post('/api/video/beat/cut-points', async (req, res) => {
    try {
        const { beats, intervalBeats } = req.body;
        const cuts = (0, beat_detection_1.generateCutPoints)(beats, intervalBeats || 4);
        res.json({ cuts });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── GET /api/video/transitions/presets — List transition presets ────────────
app.get('/api/video/transitions/presets', (_req, res) => {
    res.json({ presets: (0, transitions_1.getAllTransitionPresets)() });
});
// ─── GET /api/video/transitions/presets/:id — Get transition preset ──────────
app.get('/api/video/transitions/presets/:id', (req, res) => {
    const preset = (0, transitions_1.getTransitionPresetById)(req.params.id);
    if (!preset)
        return res.status(404).json({ error: 'Preset not found' });
    res.json({ preset });
});
// ─── POST /api/video/transitions/suggest — Suggest transitions ──────────────
app.post('/api/video/transitions/suggest', (req, res) => {
    try {
        const { fromClip, toClip, options } = req.body;
        const suggestions = (0, transitions_1.suggestTransition)(fromClip, toClip, options);
        res.json({ suggestions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/transitions/auto-suggest — Auto-suggest all transitions ─
app.post('/api/video/transitions/auto-suggest', (req, res) => {
    try {
        const { clips, options } = req.body;
        const suggestions = (0, transitions_1.autoSuggestAllTransitions)(clips, options);
        res.json({ suggestions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/color/match — Match colors between clips ───────────────
app.post('/api/video/color/match', requireInternalSecret, (req, res) => {
    try {
        const { sourceImg, targetImg, sourceId, targetId, options } = req.body;
        const suggestion = (0, color_match_1.suggestColorMatch)(sourceImg, targetImg, sourceId, targetId, options);
        res.json(suggestion);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/color/batch-match — Batch color match ──────────────────
app.post('/api/video/color/batch-match', requireInternalSecret, (req, res) => {
    try {
        const { clips, referenceId, options } = req.body;
        const suggestions = (0, color_match_1.batchColorMatch)(clips, referenceId, options);
        res.json({ suggestions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/color/analyze — Analyze image histogram ────────────────
app.post('/api/video/color/analyze', (req, res) => {
    try {
        const { imagePath } = req.body;
        const histogram = (0, color_match_1.extractHistogram)(imagePath);
        res.json(histogram);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── GET /api/video/color/luts — Get default LUTs ───────────────────────────
app.get('/api/video/color/luts', (_req, res) => {
    res.json({ luts: (0, color_match_1.getDefaultLUTs)() });
});
// ─── POST /api/video/color/ffmpeg-filter — Generate FFmpeg color filter ────
app.post('/api/video/color/ffmpeg-filter', (req, res) => {
    try {
        const { adjustments } = req.body;
        const filter = (0, color_match_1.generateColorMatchFFmpegFilter)(adjustments);
        res.json({ filter });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/thumbnails/generate — Generate thumbnails ──────────────
app.post('/api/video/thumbnails/generate', requireInternalSecret, async (req, res) => {
    try {
        const { videoPath, outputDir, options } = req.body;
        const result = await (0, thumbnails_1.extractBestFrames)(videoPath, outputDir, options);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/thumbnails/extract-frame — Extract single frame ────────
app.post('/api/video/thumbnails/extract-frame', requireInternalSecret, async (req, res) => {
    try {
        const { videoPath, outputPath, timestamp, width, height } = req.body;
        await (0, thumbnails_1.extractFrameAtTimestamp)(videoPath, outputPath, timestamp, width, height);
        res.json({ success: true, outputPath });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/video/thumbnails/grid — Generate thumbnail grid ───────────────
app.post('/api/video/thumbnails/grid', requireInternalSecret, async (req, res) => {
    try {
        const { thumbnails, outputPath, cols, rows } = req.body;
        await (0, thumbnails_1.generateThumbnailGrid)(thumbnails, outputPath, cols, rows);
        res.json({ success: true, outputPath });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── POST /api/media/upload-vps ─────────────────────────────────────────────
app.post('/api/media/upload-vps', async (req, res) => {
    res.status(200).json({ message: 'Use /api/media/upload from the Next.js app' });
});
// ─── Callback to Next.js ────────────────────────────────────────────────────
async function updateJobInNextApp(jobId, data) {
    const nextUrl = process.env.NEXT_APP_URL ?? 'http://localhost:3000';
    try {
        await fetch(`${nextUrl}/api/video/render-callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': process.env.INTERNAL_SECRET ?? 'video-service-secret-change-in-production',
            },
            body: JSON.stringify({ jobId, ...data }),
        });
    }
    catch (err) {
        console.warn('[render] Could not notify Next.js:', err);
    }
}
// ─── VideoEditorProject CRUD ──────────────────────────────────────────────────
app.get('/api/video/projects', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const projects = await database_1.prisma.videoEditorProject.findMany({
            where: { companyId: String(companyId) },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ projects });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/projects/:id', async (req, res) => {
    try {
        const { companyId } = req.query;
        const project = await database_1.prisma.videoEditorProject.findFirst({
            where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) }
        });
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/projects', async (req, res) => {
    try {
        const { companyId, name, config, clips, audioTracks, textOverlays, colorGrades, speedRamps, soundLayers } = req.body;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const project = await database_1.prisma.videoEditorProject.create({
            data: { companyId, name: name || 'Untitled', config: config || {}, clips: clips || [], audioTracks: audioTracks || [], textOverlays: textOverlays || [], colorGrades: colorGrades || [], speedRamps: speedRamps || [], soundLayers: soundLayers || [] }
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/video/projects/:id', async (req, res) => {
    try {
        const { companyId, ...data } = req.body;
        const project = await database_1.prisma.videoEditorProject.update({
            where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) },
            data: { ...data, updatedAt: new Date() }
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/video/projects/:id', async (req, res) => {
    try {
        const { companyId } = req.query;
        await database_1.prisma.videoEditorProject.delete({
            where: { id: req.params.id, ...(companyId ? { companyId: String(companyId) } : {}) }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Collaborative Sessions ───────────────────────────────────────────────────
app.get('/api/video/sessions', async (req, res) => {
    try {
        const { projectId, companyId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = String(projectId);
        if (companyId)
            where.companyId = String(companyId);
        const sessions = await database_1.prisma.videoAISession.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json({ sessions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/sessions/:id', async (req, res) => {
    try {
        const session = await database_1.prisma.videoAISession.findUnique({
            where: { id: req.params.id },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!session)
            return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/sessions', async (req, res) => {
    try {
        const session = await database_1.prisma.videoAISession.create({ data: req.body });
        res.status(201).json(session);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/video/sessions/:id', async (req, res) => {
    try {
        const session = await database_1.prisma.videoAISession.update({ where: { id: req.params.id }, data: req.body });
        res.json(session);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/video/sessions/:id', async (req, res) => {
    try {
        await database_1.prisma.videoAISession.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Session Messages ─────────────────────────────────────────────────────────
app.post('/api/video/sessions/:id/messages', async (req, res) => {
    try {
        const { role, content, toolCalls, toolResults } = req.body;
        const message = await database_1.prisma.videoAIMessage.create({
            data: {
                sessionId: req.params.id,
                role,
                content,
                toolCalls,
                toolResults
            }
        });
        res.status(201).json({ messageId: message.id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/sessions/:id/messages', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
        const messages = await database_1.prisma.videoAIMessage.findMany({
            where: { sessionId: req.params.id },
            orderBy: { createdAt: 'asc' },
            take: limit,
            select: {
                id: true,
                role: true,
                content: true,
                toolCalls: true,
                toolResults: true,
                createdAt: true
            }
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Undo / Redo / History ────────────────────────────────────────────────────
app.post('/api/video/sessions/:id/undo', async (req, res) => {
    try {
        const lastEdit = await database_1.prisma.videoEditHistory.findFirst({
            where: { sessionId: req.params.id, undone: false },
            orderBy: { createdAt: 'desc' }
        });
        if (!lastEdit)
            return res.json(null);
        await database_1.prisma.videoEditHistory.update({
            where: { id: lastEdit.id },
            data: { undone: true }
        });
        res.json(lastEdit.beforeState);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/sessions/:id/redo', async (req, res) => {
    try {
        const lastUndone = await database_1.prisma.videoEditHistory.findFirst({
            where: { sessionId: req.params.id, undone: true },
            orderBy: { createdAt: 'desc' }
        });
        if (!lastUndone)
            return res.json(null);
        await database_1.prisma.videoEditHistory.update({
            where: { id: lastUndone.id },
            data: { undone: false }
        });
        res.json(lastUndone.afterState);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/sessions/:id/history', async (req, res) => {
    try {
        const { action, description, beforeState, afterState } = req.body;
        const history = await database_1.prisma.videoEditHistory.create({
            data: {
                sessionId: req.params.id,
                action,
                description,
                beforeState,
                afterState
            }
        });
        res.status(201).json({ historyId: history.id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Version Snapshots ────────────────────────────────────────────────────────
app.get('/api/video/projects/:id/versions', async (req, res) => {
    try {
        const versions = await database_1.prisma.versionSnapshot.findMany({ where: { projectId: req.params.id }, orderBy: { createdAt: 'desc' }, take: 20 });
        res.json({ versions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/projects/:id/versions', async (req, res) => {
    try {
        const version = await database_1.prisma.versionSnapshot.create({ data: { projectId: req.params.id, ...req.body } });
        res.status(201).json(version);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/projects/:id/versions/:vId/restore', async (req, res) => {
    try {
        const version = await database_1.prisma.versionSnapshot.findUnique({ where: { id: req.params.vId } });
        if (!version)
            return res.status(404).json({ error: 'Version not found' });
        const state = version.state;
        await database_1.prisma.videoEditorProject.update({ where: { id: req.params.id }, data: { clips: state.clips, audioTracks: state.audioTracks, textOverlays: state.textOverlays, colorGrades: state.colorGrades, speedRamps: state.speedRamps, soundLayers: state.soundLayers, timeline: state.timeline, config: state.config } });
        res.json({ success: true, version });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/video/projects/:id/versions/:vId', async (req, res) => {
    try {
        await database_1.prisma.versionSnapshot.deleteMany({ where: { id: req.params.vId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/versions/:vId', async (req, res) => {
    try {
        const version = await database_1.prisma.versionSnapshot.findUnique({ where: { id: req.params.vId } });
        if (!version)
            return res.status(404).json({ error: 'Version not found' });
        res.json(version);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/sessions/:id/edit-history', async (req, res) => {
    try {
        const { author } = req.query;
        const where = { sessionId: req.params.id };
        if (author)
            where.author = String(author);
        const history = await database_1.prisma.videoEditHistory.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
        res.json({ history });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Edit Proposals ───────────────────────────────────────────────────────────
app.post('/api/video/proposals', async (req, res) => {
    try {
        const proposal = await database_1.prisma.editProposal.create({ data: req.body });
        res.status(201).json(proposal);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/sessions/:id/proposals', async (req, res) => {
    try {
        const proposals = await database_1.prisma.editProposal.findMany({ where: { sessionId: req.params.id, status: 'pending' }, orderBy: { confidence: 'desc' } });
        res.json({ proposals });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/video/proposals/:id', async (req, res) => {
    try {
        const { action, reason } = req.body;
        const proposal = await database_1.prisma.editProposal.findFirst({ where: { id: req.params.id }, include: { session: { select: { projectId: true } } } });
        if (!proposal)
            return res.status(404).json({ error: 'Proposal not found' });
        const updated = await database_1.prisma.editProposal.update({ where: { id: req.params.id }, data: { status: action === 'approve' ? 'approved' : 'rejected', respondedAt: new Date(), ...(action === 'reject' && reason ? { metadata: { rejectionReason: reason } } : {}) } });
        if (action === 'approve') {
            await database_1.prisma.videoEditHistory.create({ data: { sessionId: proposal.sessionId, action: proposal.type, author: 'merged', confidence: proposal.confidence, description: `AI proposal approved: ${proposal.title}`, beforeState: proposal.beforeState, afterState: proposal.afterState } });
        }
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Edit Conflicts ────────────────────────────────────────────────────────────
app.post('/api/video/conflicts', async (req, res) => {
    try {
        const conflict = await database_1.prisma.editConflict.create({ data: { ...req.body, resolved: false } });
        res.status(201).json({ conflictId: conflict.id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/sessions/:id/conflicts', async (req, res) => {
    try {
        const conflicts = await database_1.prisma.editConflict.findMany({ where: { sessionId: req.params.id, resolved: false }, orderBy: { createdAt: 'desc' } });
        res.json({ conflicts });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/video/conflicts/:id', async (req, res) => {
    try {
        const { resolution, note } = req.body;
        const updated = await database_1.prisma.editConflict.update({ where: { id: req.params.id }, data: { resolved: true, resolution, resolutionNote: note, resolvedAt: new Date() } });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Comments ─────────────────────────────────────────────────────────────────
app.get('/api/video/projects/:id/comments', async (req, res) => {
    try {
        const comments = await database_1.prisma.videoComment.findMany({ where: { projectId: req.params.id }, orderBy: { createdAt: 'asc' } });
        res.json({ comments });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/projects/:id/comments', async (req, res) => {
    try {
        const comment = await database_1.prisma.videoComment.create({ data: { projectId: req.params.id, ...req.body } });
        res.status(201).json({ commentId: comment.id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/video/comments/:id/resolve', async (req, res) => {
    try {
        await database_1.prisma.videoComment.update({ where: { id: req.params.id }, data: { resolved: true } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── AI Corrections ───────────────────────────────────────────────────────────
app.post('/api/video/corrections', async (req, res) => {
    try {
        const { companyId, ...data } = req.body;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        await database_1.prisma.aICorrection.create({ data: { companyId, ...data } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/corrections', async (req, res) => {
    try {
        const { companyId, actionType } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const patterns = await database_1.prisma.aICorrection.groupBy({ by: ['actionType', 'category', 'pattern'], where: { companyId: String(companyId), ...(actionType ? { actionType: String(actionType) } : {}) }, _count: true, orderBy: { _count: { pattern: 'desc' } }, take: 20 });
        res.json({ patterns });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Brand Kit ────────────────────────────────────────────────────────────────
app.get('/api/video/brand', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const brand = await database_1.prisma.brandStyle.findFirst({ where: { companyId: String(companyId) } });
        res.json(brand || null);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/brand', async (req, res) => {
    try {
        const brand = await database_1.prisma.brandStyle.create({ data: req.body });
        res.status(201).json(brand);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/video/brand/:id', async (req, res) => {
    try {
        const brand = await database_1.prisma.brandStyle.update({ where: { id: req.params.id }, data: req.body });
        res.json(brand);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/brand/similar', async (req, res) => {
    try {
        const { companyId, targetEmbedding, limit = 5 } = req.body;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const embeddingStr = JSON.stringify(targetEmbedding);
        const results = await database_1.prisma.$queryRawUnsafe(`
      SELECT id, client_name as "clientName", primary_color as "primaryColor", secondary_color as "secondaryColor", font_family as "fontFamily",
             subtitle_preset as "subtitlePreset", preferences,
             style_embedding <=> $1::vector AS similarity
      FROM tbl_brand_styles
      WHERE style_embedding IS NOT NULL
        AND company_id != $2
      ORDER BY similarity ASC
      LIMIT $3
    `, embeddingStr, String(companyId), limit);
        res.json({ results });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Render Job DB ────────────────────────────────────────────────────────────
app.get('/api/video/render/history', async (req, res) => {
    try {
        const { companyId, projectId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const where = { companyId: String(companyId) };
        if (projectId)
            where.projectId = String(projectId);
        const jobs = await database_1.prisma.videoRenderJob.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
        res.json({ jobs });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/video/render/db-job', async (req, res) => {
    try {
        const job = await database_1.prisma.videoRenderJob.create({ data: req.body });
        res.status(201).json(job);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/video/render/db-job/:jobId', async (req, res) => {
    try {
        const job = await database_1.prisma.videoRenderJob.update({ where: { id: req.params.jobId }, data: req.body });
        res.json(job);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/video/render/db-job/:jobId', async (req, res) => {
    try {
        const job = await database_1.prisma.videoRenderJob.findUnique({ where: { id: req.params.jobId } });
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
server.listen(port, () => {
    console.log(`Video Service v3.0 listening at http://localhost:${port}`);
    console.log(`   Routes:`);
    console.log(`   POST /api/video/render                    — Start a render job (with queue)`);
    console.log(`   GET  /api/video/render/:jobId             — Get job status`);
    console.log(`   POST /api/video/render/:jobId/cancel      — Cancel a render job`);
    console.log(`   GET  /api/video/jobs                      — Queue stats`);
    console.log(`   GET  /api/video/templates                 — List video templates`);
    console.log(`   GET  /api/video/presets                   — List render presets`);
    console.log(`   GET  /api/video/luts                      — List LUT presets`);
    console.log(`   POST /api/video/caption/transcribe        — Transcribe audio with Whisper`);
    console.log(`   POST /api/video/caption/export            — Export captions (SRT/VTT/ASS)`);
    console.log(`   POST /api/video/caption/extract-audio     — Extract audio from video`);
    console.log(`   POST /api/video/beat/detect               — Detect audio beats/BPM`);
    console.log(`   POST /api/video/beat/snap                 — Snap time to nearest beat`);
    console.log(`   POST /api/video/beat/cut-points           — Generate beat-synced cut points`);
    console.log(`   GET  /api/video/transitions/presets       — List transition presets`);
    console.log(`   POST /api/video/transitions/suggest       — Suggest transition between clips`);
    console.log(`   POST /api/video/transitions/auto-suggest  — Auto-suggest all transitions`);
    console.log(`   POST /api/video/color/match               — Match colors between clips`);
    console.log(`   POST /api/video/color/batch-match         — Batch color match`);
    console.log(`   POST /api/video/color/analyze             — Analyze image histogram`);
    console.log(`   GET  /api/video/color/luts                — Get default LUT presets`);
    console.log(`   POST /api/video/color/ffmpeg-filter       — Generate FFmpeg color filter`);
    console.log(`   POST /api/video/thumbnails/generate       — Generate best thumbnails`);
    console.log(`   POST /api/video/thumbnails/extract-frame  — Extract frame at timestamp`);
    console.log(`   POST /api/video/thumbnails/grid           — Generate thumbnail grid`);
    console.log(`   GET  /api/video/stats                     — Full stats`);
    console.log(`   GET  /health                              — Healthcheck`);
    console.log(`   WS   /ws/video                           — WebSocket for real-time updates`);
});
// ─── Graceful shutdown ──────────────────────────────────────────────────────
(0, service_auth_1.setupGracefulShutdown)(server, async () => {
    console.log('[shutdown] Closing queue...');
    await (0, render_queue_1.closeQueue)();
});
//# sourceMappingURL=index.js.map