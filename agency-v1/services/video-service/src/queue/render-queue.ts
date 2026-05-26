import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { broadcastProgress, broadcastComplete, broadcastFailed } from '../websocket';

const execAsync = promisify(exec);

export interface RenderJobData {
  jobId: string;
  companyId: string;
  projectId: string;
  config: {
    format: string;
    style: string;
    platform: string;
    duration: number;
  };
  timeline: any;
  audioTracks: any[];
}

export interface RenderJobResult {
  outputUrl: string;
  durationMs: number;
  outputPath: string;
}

let queue: Queue | null = null;
let worker: Worker | null = null;

export function getQueue(): Queue {
  if (!queue) {
    queue = new Queue('video-renders', {
      connection: new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
      }),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
      },
    });
  }
  return queue;
}

export async function addRenderJob(data: RenderJobData): Promise<Job> {
  const q = getQueue();
  return q.add('render', data, {
    jobId: data.jobId,
    priority: 1,
  });
}

export function createWorker(outputDir: string): Worker {
  if (worker) return worker;

  worker = new Worker(
    'video-renders',
    async (job: Job<RenderJobData>) => {
      const { jobId, companyId, config, timeline } = job.data;
      const startTime = Date.now();

      await job.updateProgress(5);
      broadcastProgress(jobId, 5, 'PROCESSING');

      const dir = outputDir || join(process.cwd(), 'renders');
      await mkdir(dir, { recursive: true });

      const outputFilename = `render_${jobId}_${Date.now()}.mp4`;
      const outputPath = join(dir, outputFilename);

      const ffmpegAvailable = await checkFFmpeg();

      if (ffmpegAvailable) {
        const duration = timeline?.totalDuration ?? config?.duration ?? 20;
        const resolution = config?.format === '9:16' ? '1080x1920' :
                           config?.format === '1:1' ? '1080x1080' : '1920x1080';
        const [width, height] = resolution.split('x');

        await job.updateProgress(20);
        broadcastProgress(jobId, 20, 'PROCESSING');

        const colorMap: Record<string, string> = {
          cinematic: '0x1a1a2e',
          luxury: '0x2d1b00',
          viral: '0x0d0d0d',
          corporate: '0x0a2540',
          'warm-artisan': '0x1a0f00',
        };
        const bgColor = colorMap[config?.style] ?? '0x000000';
        const platform = config?.platform ?? 'reels';
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

        await job.updateProgress(50);
        broadcastProgress(jobId, 50, 'PROCESSING');

        await execAsync(ffmpegCmd, { timeout: 300000 });

        await job.updateProgress(90);
        broadcastProgress(jobId, 90, 'PROCESSING');

      } else {
        const projectData = {
          jobId,
          projectId: job.data.projectId,
          config,
          timeline,
          renderedAt: new Date().toISOString(),
          note: 'FFmpeg not available',
        };

        const jsonFilename = `project_${jobId}.json`;
        const jsonPath = join(dir, jsonFilename);
        await writeFile(jsonPath, JSON.stringify(projectData, null, 2), 'utf-8');

        await job.updateProgress(100);
        broadcastProgress(jobId, 100, 'PROCESSING');

        return {
          outputUrl: `/api/serve/uploads/${companyId}/renders/${jsonFilename}`,
          durationMs: Date.now() - startTime,
          outputPath: jsonPath,
        };
      }

      const outputUrl = `/api/serve/uploads/${companyId}/renders/${outputFilename}`;

      await job.updateProgress(100);
      broadcastProgress(jobId, 100, 'PROCESSING');

      const result: RenderJobResult = {
        outputUrl,
        durationMs: Date.now() - startTime,
        outputPath,
      };

      broadcastComplete(jobId, result);

      return result;
    },
    {
      connection: new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
      }),
      concurrency: parseInt(process.env.RENDER_CONCURRENCY || '2'),
    },
  );

  worker.on('failed', (job, err) => {
    if (job) {
      broadcastFailed(job.id || 'unknown', err?.message || String(err) || 'Unknown error');
    }
  });

  worker.on('error', (err) => {
    console.error('[worker] Error:', err);
  });

  return worker;
}

async function checkFFmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function getJobStatus(jobId: string): Promise<{
  progress: number;
  state: string;
  data: RenderJobData;
  result?: RenderJobResult;
  failedReason?: string;
} | null> {
  const q = getQueue();
  const job = await q.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    progress: typeof job.progress === 'function' ? await job.progress() : job.progress,
    state,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
  };
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const q = getQueue();
  const job = await q.getJob(jobId);
  if (!job) return false;

  const state = await job.getState();
  if (state === 'waiting' || state === 'delayed') {
    await job.remove();
    return true;
  }

  try {
    await job.moveToFailed({ message: 'Cancelled by user' } as any, 'Cancelled by user');
    return true;
  } catch {
    return false;
  }
}

export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  const q = getQueue();
  const [waiting, active, completed, failed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

export async function closeQueue(): Promise<void> {
  if (queue) await queue.close();
  if (worker) await worker.close();
}
