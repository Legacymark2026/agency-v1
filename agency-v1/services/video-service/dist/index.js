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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
const app = (0, express_1.default)();
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
// ─── Start server ───────────────────────────────────────────────────────────
server.listen(port, () => {
    console.log(`Video Service v3.0 listening at http://localhost:${port}`);
    console.log(`   Routes:`);
    console.log(`   POST /api/video/render        — Start a render job (with queue)`);
    console.log(`   GET  /api/video/render/:jobId — Get job status`);
    console.log(`   POST /api/video/render/:jobId/cancel — Cancel a render job`);
    console.log(`   GET  /api/video/jobs          — Queue stats`);
    console.log(`   GET  /api/video/templates     — List video templates`);
    console.log(`   GET  /api/video/presets       — List render presets`);
    console.log(`   GET  /api/video/luts          — List LUT presets`);
    console.log(`   GET  /api/video/stats         — Full stats`);
    console.log(`   GET  /health                  — Healthcheck`);
    console.log(`   WS   /ws/video               — WebSocket for real-time updates`);
});
// ─── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
    console.log('[shutdown] SIGTERM received, closing queue...');
    await (0, render_queue_1.closeQueue)();
    server.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map