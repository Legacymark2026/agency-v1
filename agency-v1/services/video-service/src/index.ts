import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import Redis from 'ioredis';
import { initWebSocket, broadcastProgress, broadcastComplete, broadcastFailed, getConnectedClients } from './websocket';
import { addRenderJob, getJobStatus, cancelJob, getQueueStats, closeQueue, createWorker, getQueue } from './queue/render-queue';
import { getAllTemplates, getTemplateById, getTemplatesByCategory, applyTemplate } from './templates';
import { getLUTPresets, getLUTPresetsByCategory } from './lut';
import { getAllPresets, getPresetById, getPresetsByPlatform, generateFFmpegArgs } from './presets';
import { rateLimitMiddleware, getRateLimitStatus } from './middleware/rate-limit';

const app = express();
const server = createServer(app);
const port = process.env.PORT || 4007;

// ─── Redis connection ────────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
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
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── Auth middleware ─────────────────────────────────────────────────────────
function requireInternalSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-internal-secret'] as string;
  const expected = process.env.INTERNAL_SECRET ?? 'video-service-secret-change-in-production';
  if (secret !== expected) {
    return res.status(403).json({ error: 'Forbidden: invalid or missing internal secret' });
  }
  next();
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────
const RenderJobSchema = z.object({
  jobId: z.string().min(1),
  companyId: z.string().min(1),
  projectId: z.string().min(1),
  templateId: z.string().optional(),
  presetId: z.string().optional(),
  config: z.object({
    format: z.enum(['16:9', '9:16', '1:1', '4:5']).optional().default('16:9'),
    style: z.string().optional().default('cinematic'),
    platform: z.string().optional().default('reels'),
    duration: z.number().optional().default(20),
  }).optional().default({}),
  timeline: z.object({
    totalDuration: z.number().optional(),
  }).optional().default({}),
  audioTracks: z.array(z.any()).optional().default([]),
});

// ─── Initialize WebSocket ────────────────────────────────────────────────────
initWebSocket(server);

// ─── Initialize BullMQ Worker ────────────────────────────────────────────────
const outputDir = process.env.RENDER_OUTPUT_DIR || join(process.cwd(), 'renders');
createWorker(outputDir);

// ─── Healthcheck ─────────────────────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  let redisStatus = 'disconnected';
  let ffmpegStatus = false;
  let wsClients = 0;

  try {
    await redis.ping();
    redisStatus = 'connected';
    redisAvailable = true;
  } catch {
    redisStatus = redisAvailable ? 'connected' : 'disconnected (using in-memory fallback)';
  }

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    await execAsync('ffmpeg -version', { timeout: 3000 });
    ffmpegStatus = true;
  } catch {
    ffmpegStatus = false;
  }

  try {
    wsClients = getConnectedClients();
  } catch {
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
app.post('/api/video/render', requireInternalSecret, rateLimitMiddleware, async (req: Request, res: Response) => {
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
      const template = applyTemplate(templateId);
      if (template) {
        finalConfig = { ...finalConfig, format: template.config.format as any, style: template.config.style, platform: template.config.platform };
        finalTimeline = { ...finalTimeline, totalDuration: template.timeline.hookDuration + template.timeline.bodyDuration + template.timeline.climaxDuration + template.timeline.outroDuration };
      }
    }

    if (presetId) {
      const preset = getPresetById(presetId as string);
      if (preset) {
        finalConfig = {
          ...finalConfig,
          format: preset.aspectRatio as any,
          platform: preset.platform,
        };
      }
    }

    const job = await addRenderJob({
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

  } catch (error: any) {
    console.error('[render] Error starting job:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/video/render/:jobId — Job status ──────────────────────────────
app.get('/api/video/render/:jobId', async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const status = await getJobStatus(jobId);

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
app.post('/api/video/render/:jobId/cancel', requireInternalSecret, async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const success = await cancelJob(jobId);

  if (!success) {
    return res.status(404).json({ error: 'Job not found or already processing' });
  }

  res.json({ success: true });
});

// ─── GET /api/video/jobs — List all jobs ────────────────────────────────────
app.get('/api/video/jobs', async (_req: Request, res: Response) => {
  const stats = await getQueueStats();
  res.json({
    queue: stats,
    total: stats.waiting + stats.active + stats.completed + stats.failed,
  });
});

// ─── GET /api/video/templates — List templates ──────────────────────────────
app.get('/api/video/templates', (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  if (category) {
    res.json({ templates: getTemplatesByCategory(category) });
  } else {
    res.json({ templates: getAllTemplates() });
  }
});

// ─── GET /api/video/templates/:id — Get template ────────────────────────────
app.get('/api/video/templates/:id', (req: Request, res: Response) => {
  const template = getTemplateById(req.params.id as string);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ template });
});

// ─── GET /api/video/presets — List render presets ───────────────────────────
app.get('/api/video/presets', (req: Request, res: Response) => {
  const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
  if (platform) {
    res.json({ presets: getPresetsByPlatform(platform) });
  } else {
    res.json({ presets: getAllPresets() });
  }
});

// ─── GET /api/video/presets/:id — Get preset ────────────────────────────────
app.get('/api/video/presets/:id', (req: Request, res: Response) => {
  const preset = getPresetById(req.params.id as string);
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  res.json({ preset, ffmpegArgs: generateFFmpegArgs(preset, 'input.mp4', 'output.mp4') });
});

// ─── GET /api/video/luts — List LUT presets ─────────────────────────────────
app.get('/api/video/luts', (req: Request, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  if (category) {
    res.json({ luts: getLUTPresetsByCategory(category) });
  } else {
    res.json({ luts: getLUTPresets() });
  }
});

// ─── GET /api/video/rate-limit/:companyId — Rate limit status ───────────────
app.get('/api/video/rate-limit/:companyId', async (req: Request, res: Response) => {
  const status = await getRateLimitStatus(req.params.companyId as string);
  res.json(status);
});

// ─── GET /api/video/stats — Queue stats ─────────────────────────────────────
app.get('/api/video/stats', async (_req: Request, res: Response) => {
  const stats = await getQueueStats();
  res.json({
    ...stats,
    websocketClients: getConnectedClients(),
  });
});

// ─── POST /api/video/render/:jobId/webhook — Webhook callback ───────────────
app.post('/api/video/render/:jobId/webhook', async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const { url, secret } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing webhook URL' });
  }

  res.json({ success: true, message: 'Webhook registered (not yet implemented)' });
});

// ─── POST /api/media/upload-vps ─────────────────────────────────────────────
app.post('/api/media/upload-vps', async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Use /api/media/upload from the Next.js app' });
});

// ─── Callback to Next.js ────────────────────────────────────────────────────
async function updateJobInNextApp(jobId: string, data: object) {
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
  } catch (err) {
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
  await closeQueue();
  server.close();
  process.exit(0);
});
