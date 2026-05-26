"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueue = getQueue;
exports.addRenderJob = addRenderJob;
exports.createWorker = createWorker;
exports.getJobStatus = getJobStatus;
exports.cancelJob = cancelJob;
exports.getQueueStats = getQueueStats;
exports.closeQueue = closeQueue;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const child_process_1 = require("child_process");
const util_1 = require("util");
const websocket_1 = require("../websocket");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let queue = null;
let worker = null;
function getQueue() {
    if (!queue) {
        queue = new bullmq_1.Queue('video-renders', {
            connection: new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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
async function addRenderJob(data) {
    const q = getQueue();
    return q.add('render', data, {
        jobId: data.jobId,
        priority: 1,
    });
}
function createWorker(outputDir) {
    if (worker)
        return worker;
    worker = new bullmq_1.Worker('video-renders', async (job) => {
        const { jobId, companyId, config, timeline } = job.data;
        const startTime = Date.now();
        await job.updateProgress(5);
        (0, websocket_1.broadcastProgress)(jobId, 5, 'PROCESSING');
        const dir = outputDir || (0, path_1.join)(process.cwd(), 'renders');
        await (0, promises_1.mkdir)(dir, { recursive: true });
        const outputFilename = `render_${jobId}_${Date.now()}.mp4`;
        const outputPath = (0, path_1.join)(dir, outputFilename);
        const ffmpegAvailable = await checkFFmpeg();
        if (ffmpegAvailable) {
            const duration = timeline?.totalDuration ?? config?.duration ?? 20;
            const resolution = config?.format === '9:16' ? '1080x1920' :
                config?.format === '1:1' ? '1080x1080' : '1920x1080';
            const [width, height] = resolution.split('x');
            await job.updateProgress(20);
            (0, websocket_1.broadcastProgress)(jobId, 20, 'PROCESSING');
            const colorMap = {
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
            (0, websocket_1.broadcastProgress)(jobId, 50, 'PROCESSING');
            await execAsync(ffmpegCmd, { timeout: 300000 });
            await job.updateProgress(90);
            (0, websocket_1.broadcastProgress)(jobId, 90, 'PROCESSING');
        }
        else {
            const projectData = {
                jobId,
                projectId: job.data.projectId,
                config,
                timeline,
                renderedAt: new Date().toISOString(),
                note: 'FFmpeg not available',
            };
            const jsonFilename = `project_${jobId}.json`;
            const jsonPath = (0, path_1.join)(dir, jsonFilename);
            await (0, promises_1.writeFile)(jsonPath, JSON.stringify(projectData, null, 2), 'utf-8');
            await job.updateProgress(100);
            (0, websocket_1.broadcastProgress)(jobId, 100, 'PROCESSING');
            return {
                outputUrl: `/api/serve/uploads/${companyId}/renders/${jsonFilename}`,
                durationMs: Date.now() - startTime,
                outputPath: jsonPath,
            };
        }
        const outputUrl = `/api/serve/uploads/${companyId}/renders/${outputFilename}`;
        await job.updateProgress(100);
        (0, websocket_1.broadcastProgress)(jobId, 100, 'PROCESSING');
        const result = {
            outputUrl,
            durationMs: Date.now() - startTime,
            outputPath,
        };
        (0, websocket_1.broadcastComplete)(jobId, result);
        return result;
    }, {
        connection: new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
        }),
        concurrency: parseInt(process.env.RENDER_CONCURRENCY || '2'),
    });
    worker.on('failed', (job, err) => {
        if (job) {
            (0, websocket_1.broadcastFailed)(job.id || 'unknown', err?.message || String(err) || 'Unknown error');
        }
    });
    worker.on('error', (err) => {
        console.error('[worker] Error:', err);
    });
    return worker;
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
async function getJobStatus(jobId) {
    const q = getQueue();
    const job = await q.getJob(jobId);
    if (!job)
        return null;
    const state = await job.getState();
    return {
        progress: typeof job.progress === 'function' ? await job.progress() : job.progress,
        state,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
    };
}
async function cancelJob(jobId) {
    const q = getQueue();
    const job = await q.getJob(jobId);
    if (!job)
        return false;
    const state = await job.getState();
    if (state === 'waiting' || state === 'delayed') {
        await job.remove();
        return true;
    }
    try {
        await job.moveToFailed({ message: 'Cancelled by user' }, 'Cancelled by user');
        return true;
    }
    catch {
        return false;
    }
}
async function getQueueStats() {
    const q = getQueue();
    const [waiting, active, completed, failed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getCompletedCount(),
        q.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
}
async function closeQueue() {
    if (queue)
        await queue.close();
    if (worker)
        await worker.close();
}
//# sourceMappingURL=render-queue.js.map