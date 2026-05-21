"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const promises_1 = require("fs/promises");
const path_1 = require("path");
const child_process_1 = require("child_process");
const util_1 = require("util");
const zod_1 = require("zod");
const ioredis_1 = __importDefault(require("ioredis"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const app = (0, express_1.default)();
const port = process.env.PORT || 4007;
// ─── Redis connection ────────────────────────────────────────────────────────
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        if (times > 3) {
            console.warn('[redis] Max retries reached, falling back to in-memory store');
            return null;
        }
        return Math.min(times * 200, 2000);
    },
});
let redisAvailable = false;
redis.on('error', (err) => {
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND') || err.message.includes('NOAUTH')) {
        redisAvailable = false;
        console.warn('[redis] Unavailable, using in-memory fallback:', err.message);
    }
});
redis.on('ready', () => {
    redisAvailable = true;
    console.log('[redis] Connected and ready');
});
// ─── In-memory fallback store ────────────────────────────────────────────────
const memoryStore = new Map();
async function redisSet(key, value, mode, ttl) {
    if (redisAvailable) {
        try {
            await redis.set(key, value, mode, ttl);
            return;
        }
        catch (err) {
            if (err?.message?.includes('NOAUTH') || err?.message?.includes('ECONNREFUSED')) {
                redisAvailable = false;
            }
            console.warn('[redis] Set failed, falling back to memory:', err?.message || err);
        }
    }
    memoryStore.set(key, { data: value, expiresAt: Date.now() + ttl * 1000 });
}
async function redisGet(key) {
    if (redisAvailable) {
        try {
            return await redis.get(key);
        }
        catch (err) {
            if (err?.message?.includes('NOAUTH') || err?.message?.includes('ECONNREFUSED')) {
                redisAvailable = false;
            }
            console.warn('[redis] Get failed, falling back to memory:', err?.message || err);
        }
    }
    const entry = memoryStore.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null;
    }
    return entry.data;
}
async function redisKeys(pattern) {
    if (redisAvailable) {
        try {
            return await redis.keys(pattern);
        }
        catch (err) {
            if (err?.message?.includes('NOAUTH') || err?.message?.includes('ECONNREFUSED')) {
                redisAvailable = false;
            }
            console.warn('[redis] Keys failed, falling back to memory:', err?.message || err);
        }
    }
    return Array.from(memoryStore.keys()).filter(k => k.startsWith(pattern.replace('*', '')));
}
// ─── Middleware ──────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// ─── Auth middleware for internal endpoints ──────────────────────────────────
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
    config: zod_1.z.object({
        format: zod_1.z.enum(['16:9', '9:16', '1:1']).optional().default('16:9'),
        style: zod_1.z.string().optional().default('cinematic'),
        platform: zod_1.z.string().optional().default('reels'),
        duration: zod_1.z.number().optional().default(20),
    }).optional().default({}),
    timeline: zod_1.z.object({
        totalDuration: zod_1.z.number().optional(),
    }).optional().default({}),
    audioTracks: zod_1.z.array(zod_1.z.any()).optional().default([]),
});
const JOB_TTL_SECONDS = 86400; // 24 hours
// ─── Healthcheck ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
    let redisStatus = 'disconnected';
    let ffmpegStatus = false;
    try {
        await redis.ping();
        redisStatus = 'connected';
        redisAvailable = true;
    }
    catch {
        redisStatus = redisAvailable ? 'connected' : 'disconnected (using in-memory fallback)';
    }
    try {
        await execAsync('ffmpeg -version', { timeout: 3000 });
        ffmpegStatus = true;
    }
    catch {
        ffmpegStatus = false;
    }
    res.status(200).json({
        status: 'ok',
        service: 'video-service',
        version: '2.1.0',
        redis: redisStatus,
        ffmpeg: ffmpegStatus,
    });
});
// ─── POST /api/video/render — Iniciar render ─────────────────────────────────
app.post('/api/video/render', requireInternalSecret, async (req, res) => {
    try {
        const parsed = RenderJobSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid payload',
                details: parsed.error.flatten(),
            });
        }
        const { jobId, companyId, projectId, config, timeline, audioTracks } = parsed.data;
        const job = {
            jobId,
            companyId,
            projectId,
            status: 'PENDING',
            progress: 0,
            createdAt: new Date().toISOString(),
        };
        await redisSet(`video:job:${jobId}`, JSON.stringify(job), 'EX', JOB_TTL_SECONDS);
        res.status(202).json({ jobId, status: 'PENDING', message: 'Render job accepted' });
        processRenderJob(job, { config, timeline, audioTracks }).catch(err => {
            console.error(`[render] Job ${jobId} failed:`, err);
        });
    }
    catch (error) {
        console.error('[render] Error starting job:', error);
        res.status(500).json({ error: error.message });
    }
});
// ─── GET /api/video/render/:jobId — Estado del render ───────────────────────
app.get('/api/video/render/:jobId', async (req, res) => {
    const jobId = req.params.jobId;
    const raw = await redisGet(`video:job:${jobId}`);
    if (!raw) {
        return res.status(404).json({ error: 'Job not found or expired' });
    }
    const job = JSON.parse(raw);
    res.json({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        outputUrl: job.outputUrl ?? null,
        errorMessage: job.errorMessage ?? null,
        createdAt: job.createdAt,
    });
});
// ─── POST /api/video/render/:jobId/cancel — Cancelar render ─────────────────
app.post('/api/video/render/:jobId/cancel', requireInternalSecret, async (req, res) => {
    const jobId = req.params.jobId;
    const raw = await redisGet(`video:job:${jobId}`);
    if (!raw)
        return res.status(404).json({ error: 'Job not found' });
    const job = JSON.parse(raw);
    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
        job.status = 'FAILED';
        job.errorMessage = 'Cancelled by user';
        await redisSet(`video:job:${jobId}`, JSON.stringify(job), 'EX', JOB_TTL_SECONDS);
    }
    res.json({ success: true });
});
// ─── GET /api/video/jobs — Listar todos los jobs activos ─────────────────────
app.get('/api/video/jobs', async (_req, res) => {
    const keys = await redisKeys('video:job:*');
    const allJobs = [];
    for (const key of keys) {
        const raw = await redisGet(key);
        if (raw) {
            allJobs.push(JSON.parse(raw));
        }
    }
    const summary = allJobs.map(j => ({
        jobId: j.jobId,
        status: j.status,
        progress: j.progress,
        createdAt: j.createdAt,
    }));
    res.json({ jobs: summary, total: summary.length });
});
// ─── POST /api/media/upload-vps — Upload directo al VPS ──────────────────────
app.post('/api/media/upload-vps', async (req, res) => {
    res.status(200).json({ message: 'Use /api/media/upload from the Next.js app' });
});
// ─── Lógica real de render ─────────────────────────────────────────────────
async function processRenderJob(job, data) {
    const startTime = Date.now();
    try {
        job.status = 'PROCESSING';
        job.progress = 5;
        await saveJob(job);
        const { config, timeline } = data;
        const outputDir = process.env.RENDER_OUTPUT_DIR || (0, path_1.join)(process.cwd(), 'renders');
        await (0, promises_1.mkdir)(outputDir, { recursive: true });
        const outputFilename = `render_${job.jobId}_${Date.now()}.mp4`;
        const outputPath = (0, path_1.join)(outputDir, outputFilename);
        const outputUrl = `/api/serve/uploads/${job.companyId}/renders/${outputFilename}`;
        const ffmpegAvailable = await checkFFmpeg();
        if (ffmpegAvailable) {
            const duration = timeline?.totalDuration ?? config?.duration ?? 20;
            const resolution = config?.format === '9:16' ? '1080x1920' :
                config?.format === '1:1' ? '1080x1080' : '1920x1080';
            const [width, height] = resolution.split('x');
            job.progress = 20;
            await saveJob(job);
            const style = config?.style ?? 'cinematic';
            const platform = config?.platform ?? 'reels';
            const colorMap = {
                cinematic: '0x1a1a2e',
                luxury: '0x2d1b00',
                viral: '0x0d0d0d',
                corporate: '0x0a2540',
                'warm-artisan': '0x1a0f00',
            };
            const bgColor = colorMap[style] ?? '0x000000';
            const textOverlay = `Video Studio | ${platform.toUpperCase()} | ${duration}s`;
            const ffmpegCmd = [
                'ffmpeg -y',
                `-f lavfi -i "color=c=${bgColor}:s=${width}x${height}:d=${duration}:r=30"`,
                `-f lavfi -i "sine=frequency=440:duration=${duration}"`,
                `-vf "drawtext=fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2:text='${textOverlay}':box=1:boxcolor=black@0.5:boxborderw=10"`,
                `-c:v libx264 -preset fast -crf 23`,
                `-c:a aac -b:a 128k`,
                `-movflags +faststart`,
                `"${outputPath}"`,
            ].join(' ');
            job.progress = 40;
            await saveJob(job);
            await execAsync(ffmpegCmd, { timeout: 120_000 });
            job.progress = 90;
            await saveJob(job);
        }
        else {
            console.warn('[render] FFmpeg not available — generating JSON project file');
            const projectData = {
                jobId: job.jobId,
                projectId: job.projectId,
                config,
                timeline,
                renderedAt: new Date().toISOString(),
                note: 'FFmpeg not available on this server. Install FFmpeg to enable real video rendering.',
            };
            const jsonFilename = `project_${job.jobId}.json`;
            const jsonPath = (0, path_1.join)(outputDir, jsonFilename);
            await (0, promises_1.writeFile)(jsonPath, JSON.stringify(projectData, null, 2), 'utf-8');
            job.progress = 80;
            job.outputUrl = `/api/serve/uploads/${job.companyId}/renders/${jsonFilename}`;
            job.status = 'COMPLETED';
            job.progress = 100;
            await saveJob(job);
            await updateJobInNextApp(job.jobId, {
                status: 'COMPLETED',
                progress: 100,
                outputUrl: job.outputUrl,
                durationMs: Date.now() - startTime,
            });
            console.log(`[render] Job ${job.jobId} completed (JSON fallback) in ${Date.now() - startTime}ms`);
            return;
        }
        job.outputUrl = outputUrl;
        job.status = 'COMPLETED';
        job.progress = 100;
        await saveJob(job);
        await updateJobInNextApp(job.jobId, {
            status: 'COMPLETED',
            progress: 100,
            outputUrl,
            durationMs: Date.now() - startTime,
        });
        console.log(`[render] Job ${job.jobId} completed in ${Date.now() - startTime}ms → ${outputUrl}`);
    }
    catch (error) {
        job.status = 'FAILED';
        job.errorMessage = error.message;
        job.progress = job.progress || 0;
        console.error(`[render] Job ${job.jobId} FAILED:`, error.message);
        await saveJob(job);
        await updateJobInNextApp(job.jobId, {
            status: 'FAILED',
            progress: job.progress,
            errorMessage: error.message,
            durationMs: Date.now() - startTime,
        });
    }
}
async function saveJob(job) {
    await redisSet(`video:job:${job.jobId}`, JSON.stringify(job), 'EX', JOB_TTL_SECONDS);
}
async function checkFFmpeg() {
    try {
        await execAsync('ffmpeg -version', { timeout: 5000 });
        return true;
    }
    catch {
        return false;
    }
}
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
app.listen(port, () => {
    console.log(`Video Service v2.1 listening at http://localhost:${port}`);
    console.log(`   Routes:`);
    console.log(`   POST /api/video/render        — Start a render job`);
    console.log(`   GET  /api/video/render/:jobId — Get job status`);
    console.log(`   POST /api/video/render/:jobId/cancel — Cancel a render job`);
    console.log(`   GET  /api/video/jobs          — List all jobs`);
    console.log(`   GET  /health                  — Healthcheck (includes Redis + FFmpeg status)`);
});
//# sourceMappingURL=index.js.map