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
import { transcribeAudio, exportSRT, exportVTT, exportASS, extractAudioFromVideo, type CaptionSegment, type CaptionOptions } from './captioning';
import { detectBeats, snapToNearestBeat, generateCutPoints, type BeatDetectionResult } from './beat-detection';
import { getAllTransitionPresets, getTransitionPresetById, suggestTransition, autoSuggestAllTransitions, type TransitionSuggestion, type ClipMetadata } from './transitions';
import { suggestColorMatch, batchColorMatch, generateColorMatchFFmpegFilter, extractHistogram, getDefaultLUTs, type ColorMatchSuggestion, type ColorAdjustments, type ColorHistogram } from './color-match';
import { extractBestFrames, extractFrameAtTimestamp, generateThumbnailGrid, pickBestThumbnail, type BatchThumbnailResult, type ThumbnailResult } from './thumbnails';

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

// ─── POST /api/video/caption/transcribe — Transcribe audio ────────────────────
app.post('/api/video/caption/transcribe', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { audioPath, language } = req.body;
    const result = await transcribeAudio(audioPath, { language });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/caption/export — Export captions ─────────────────────────
app.post('/api/video/caption/export', async (req: Request, res: Response) => {
  try {
    const { segments, format } = req.body;
    let output: string;
    switch (format) {
      case 'srt': output = exportSRT(segments); break;
      case 'vtt': output = exportVTT(segments); break;
      case 'ass': output = exportASS(segments); break;
      default: return res.status(400).json({ error: 'Unsupported format' });
    }
    res.json({ format, content: output });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/caption/extract-audio — Extract audio from video ─────────
app.post('/api/video/caption/extract-audio', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { videoPath, outputPath } = req.body;
    await extractAudioFromVideo(videoPath, outputPath);
    res.json({ success: true, outputPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/beat/detect — Detect beats ──────────────────────────────
app.post('/api/video/beat/detect', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { audioPath, options } = req.body;
    const result = await detectBeats(audioPath, options);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/beat/snap — Snap to nearest beat ────────────────────────
app.post('/api/video/beat/snap', async (req: Request, res: Response) => {
  try {
    const { time, beats } = req.body;
    const snapped = snapToNearestBeat(time, beats);
    res.json({ original: time, snapped });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/beat/cut-points — Generate cut points ───────────────────
app.post('/api/video/beat/cut-points', async (req: Request, res: Response) => {
  try {
    const { beats, intervalBeats } = req.body;
    const cuts = generateCutPoints(beats, intervalBeats || 4);
    res.json({ cuts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/video/transitions/presets — List transition presets ────────────
app.get('/api/video/transitions/presets', (_req: Request, res: Response) => {
  res.json({ presets: getAllTransitionPresets() });
});

// ─── GET /api/video/transitions/presets/:id — Get transition preset ──────────
app.get('/api/video/transitions/presets/:id', (req: Request, res: Response) => {
  const preset = getTransitionPresetById(req.params.id as string);
  if (!preset) return res.status(404).json({ error: 'Preset not found' });
  res.json({ preset });
});

// ─── POST /api/video/transitions/suggest — Suggest transitions ──────────────
app.post('/api/video/transitions/suggest', (req: Request, res: Response) => {
  try {
    const { fromClip, toClip, options } = req.body;
    const suggestions = suggestTransition(fromClip as ClipMetadata, toClip as ClipMetadata, options);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/transitions/auto-suggest — Auto-suggest all transitions ─
app.post('/api/video/transitions/auto-suggest', (req: Request, res: Response) => {
  try {
    const { clips, options } = req.body;
    const suggestions = autoSuggestAllTransitions(clips as ClipMetadata[], options);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/color/match — Match colors between clips ───────────────
app.post('/api/video/color/match', requireInternalSecret, (req: Request, res: Response) => {
  try {
    const { sourceImg, targetImg, sourceId, targetId, options } = req.body;
    const suggestion = suggestColorMatch(sourceImg, targetImg, sourceId, targetId, options);
    res.json(suggestion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/color/batch-match — Batch color match ──────────────────
app.post('/api/video/color/batch-match', requireInternalSecret, (req: Request, res: Response) => {
  try {
    const { clips, referenceId, options } = req.body;
    const suggestions = batchColorMatch(clips, referenceId, options);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/color/analyze — Analyze image histogram ────────────────
app.post('/api/video/color/analyze', (req: Request, res: Response) => {
  try {
    const { imagePath } = req.body;
    const histogram = extractHistogram(imagePath);
    res.json(histogram);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/video/color/luts — Get default LUTs ───────────────────────────
app.get('/api/video/color/luts', (_req: Request, res: Response) => {
  res.json({ luts: getDefaultLUTs() });
});

// ─── POST /api/video/color/ffmpeg-filter — Generate FFmpeg color filter ────
app.post('/api/video/color/ffmpeg-filter', (req: Request, res: Response) => {
  try {
    const { adjustments } = req.body;
    const filter = generateColorMatchFFmpegFilter(adjustments as ColorAdjustments);
    res.json({ filter });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/thumbnails/generate — Generate thumbnails ──────────────
app.post('/api/video/thumbnails/generate', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { videoPath, outputDir, options } = req.body;
    const result = await extractBestFrames(videoPath, outputDir, options);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/thumbnails/extract-frame — Extract single frame ────────
app.post('/api/video/thumbnails/extract-frame', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { videoPath, outputPath, timestamp, width, height } = req.body;
    await extractFrameAtTimestamp(videoPath, outputPath, timestamp, width, height);
    res.json({ success: true, outputPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/video/thumbnails/grid — Generate thumbnail grid ───────────────
app.post('/api/video/thumbnails/grid', requireInternalSecret, async (req: Request, res: Response) => {
  try {
    const { thumbnails, outputPath, cols, rows } = req.body;
    await generateThumbnailGrid(thumbnails, outputPath, cols, rows);
    res.json({ success: true, outputPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
process.on('SIGTERM', async () => {
  console.log('[shutdown] SIGTERM received, closing queue...');
  await closeQueue();
  server.close();
  process.exit(0);
});
