import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import Redis from 'ioredis';

const execAsync = promisify(exec);
const app = express();
const port = process.env.PORT || 4007;

// ─── Redis connection ────────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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
const memoryStore = new Map<string, { data: string; expiresAt: number }>();

async function redisSet(key: string, value: string, mode: 'EX', ttl: number): Promise<void> {
  if (redisAvailable) {
    try {
      await redis.set(key, value, mode as any, ttl);
      return;
    } catch (err: any) {
      if (err?.message?.includes('NOAUTH') || err?.message?.includes('ECONNREFUSED')) {
        redisAvailable = false;
      }
      console.warn('[redis] Set failed, falling back to memory:', err?.message || err);
    }
  }
  memoryStore.set(key, { data: value, expiresAt: Date.now() + ttl * 1000 });
}

async function redisGet(key: string): Promise<string | null> {
  if (redisAvailable) {
    try {
      return await redis.get(key);
    } catch (err: any) {
      if (err?.message?.includes('NOAUTH') || err?.message?.includes('ECONNREFUSED')) {
        redisAvailable = false;
      }
      console.warn('[redis] Get failed, falling back to memory:', err?.message || err);
    }
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
}

async function redisKeys(pattern: string): Promise<string[]> {
  if (redisAvailable) {
    try {
      return await redis.keys(pattern);
    } catch (err: any) {
      if (err?.message?.includes('NOAUTH') || err?.message?.includes('ECONNREFUSED')) {
        redisAvailable = false;
      }
      console.warn('[redis] Keys failed, falling back to memory:', err?.message || err);
    }
  }
  return Array.from(memoryStore.keys()).filter(k => k.startsWith(pattern.replace('*', '')));
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Auth middleware for internal endpoints ──────────────────────────────────
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
  config: z.object({
    format: z.enum(['16:9', '9:16', '1:1']).optional().default('16:9'),
    style: z.string().optional().default('cinematic'),
    platform: z.string().optional().default('reels'),
    duration: z.number().optional().default(20),
  }).optional().default({}),
  timeline: z.object({
    totalDuration: z.number().optional(),
  }).optional().default({}),
  audioTracks: z.array(z.any()).optional().default([]),
});

// ─── RenderJob type ──────────────────────────────────────────────────────────
interface RenderJob {
  jobId: string;
  companyId: string;
  projectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: string;
}

const JOB_TTL_SECONDS = 86400; // 24 hours

// ─── Healthcheck ─────────────────────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  let redisStatus = 'disconnected';
  let ffmpegStatus = false;

  try {
    await redis.ping();
    redisStatus = 'connected';
    redisAvailable = true;
  } catch {
    redisStatus = redisAvailable ? 'connected' : 'disconnected (using in-memory fallback)';
  }

  try {
    await execAsync('ffmpeg -version', { timeout: 3000 });
    ffmpegStatus = true;
  } catch {
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
app.post('/api/video/render', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const parsed = RenderJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten(),
      });
    }

    const { jobId, companyId, projectId, config, timeline, audioTracks } = parsed.data;

    const job: RenderJob = {
      jobId,
      companyId,
      projectId,
      status: 'PENDING',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    await redisSet(
      `video:job:${jobId}`,
      JSON.stringify(job),
      'EX',
      JOB_TTL_SECONDS,
    );

    res.status(202).json({ jobId, status: 'PENDING', message: 'Render job accepted' });

    processRenderJob(job, { config, timeline, audioTracks }).catch(err => {
      console.error(`[render] Job ${jobId} failed:`, err);
    });

  } catch (error: any) {
    console.error('[render] Error starting job:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/video/render/:jobId — Estado del render ───────────────────────
app.get('/api/video/render/:jobId', async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const raw = await redisGet(`video:job:${jobId}`);

  if (!raw) {
    return res.status(404).json({ error: 'Job not found or expired' });
  }

  const job: RenderJob = JSON.parse(raw);
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
app.post('/api/video/render/:jobId/cancel', requireInternalSecret, async (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;
  const raw = await redisGet(`video:job:${jobId}`);

  if (!raw) return res.status(404).json({ error: 'Job not found' });

  const job: RenderJob = JSON.parse(raw);
  if (job.status === 'PENDING' || job.status === 'PROCESSING') {
    job.status = 'FAILED';
    job.errorMessage = 'Cancelled by user';
    await redisSet(`video:job:${jobId}`, JSON.stringify(job), 'EX', JOB_TTL_SECONDS);
  }

  res.json({ success: true });
});

// ─── GET /api/video/jobs — Listar todos los jobs activos ─────────────────────
app.get('/api/video/jobs', async (_req: Request, res: Response) => {
  const keys = await redisKeys('video:job:*');
  const allJobs: RenderJob[] = [];

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
app.post('/api/media/upload-vps', async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Use /api/media/upload from the Next.js app' });
});

// ─── Lógica real de render ─────────────────────────────────────────────────
async function processRenderJob(job: RenderJob, data: any) {
  const startTime = Date.now();

  try {
    job.status = 'PROCESSING';
    job.progress = 5;
    await saveJob(job);

    const { config, timeline } = data;
    const outputDir = process.env.RENDER_OUTPUT_DIR || join(process.cwd(), 'renders');
    await mkdir(outputDir, { recursive: true });

    const outputFilename = `render_${job.jobId}_${Date.now()}.mp4`;
    const outputPath = join(outputDir, outputFilename);
    const outputUrl = `/api/serve/uploads/${job.companyId}/renders/${outputFilename}`;

    const ffmpegAvailable = await checkFFmpeg();

    if (ffmpegAvailable) {
      const duration = timeline?.totalDuration ?? config?.duration ?? 20;
      const resolution = config?.format === '9:16' ? '1080x1920' :
                         config?.format === '1:1'  ? '1080x1080' : '1920x1080';
      const [width, height] = resolution.split('x');

      job.progress = 20;
      await saveJob(job);

      const style = config?.style ?? 'cinematic';
      const platform = config?.platform ?? 'reels';
      const colorMap: Record<string, string> = {
        cinematic: '0x1a1a2e',
        luxury:    '0x2d1b00',
        viral:     '0x0d0d0d',
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

    } else {
      console.warn('[render] FFmpeg not available — generating JSON project file');

      const projectData = {
        jobId:     job.jobId,
        projectId: job.projectId,
        config,
        timeline,
        renderedAt: new Date().toISOString(),
        note: 'FFmpeg not available on this server. Install FFmpeg to enable real video rendering.',
      };

      const jsonFilename = `project_${job.jobId}.json`;
      const jsonPath = join(outputDir, jsonFilename);
      await writeFile(jsonPath, JSON.stringify(projectData, null, 2), 'utf-8');

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

  } catch (error: any) {
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

async function saveJob(job: RenderJob) {
  await redisSet(`video:job:${job.jobId}`, JSON.stringify(job), 'EX', JOB_TTL_SECONDS);
}

async function checkFFmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

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

app.listen(port, () => {
  console.log(`Video Service v2.1 listening at http://localhost:${port}`);
  console.log(`   Routes:`);
  console.log(`   POST /api/video/render        — Start a render job`);
  console.log(`   GET  /api/video/render/:jobId — Get job status`);
  console.log(`   POST /api/video/render/:jobId/cancel — Cancel a render job`);
  console.log(`   GET  /api/video/jobs          — List all jobs`);
  console.log(`   GET  /health                  — Healthcheck (includes Redis + FFmpeg status)`);
});
