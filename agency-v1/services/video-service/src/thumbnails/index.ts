import { execSync } from 'child_process';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

export interface ThumbnailOptions {
  count?: number;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'png' | 'webp';
  method?: 'interval' | 'scene' | 'combined';
  interval?: number;
  minSceneDuration?: number;
  maxThumbnails?: number;
}

export interface ThumbnailResult {
  path: string;
  timestamp: number;
  score: number;
  reason: string;
  width: number;
  height: number;
  format: string;
  fileSize: number;
  dominantColors?: string[];
  hasFace?: boolean;
  sharpness?: number;
}

export interface BatchThumbnailResult {
  thumbnails: ThumbnailResult[];
  bestThumbnail: ThumbnailResult | null;
  videoDuration: number;
  method: string;
}

export interface SceneDetectionResult {
  timestamp: number;
  score: number;
  type: 'cut' | 'fade' | 'dissolve';
}

const DEFAULT_OPTIONS: ThumbnailOptions = {
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

function generateThumbnailId(): string {
  return `thumb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getFormatExtension(format: string): string {
  return format === 'jpg' ? '.jpg' : format === 'png' ? '.png' : '.webp';
}

export function getVideoDuration(videoPath: string): number {
  try {
    const output = execSync(
      `ffprobe -i "${videoPath}" -show_entries format=duration -v quiet -of csv="p=0"`,
      { timeout: 10000 },
    );
    return parseFloat(output.toString().trim()) || 0;
  } catch {
    return 0;
  }
}

export function detectSceneChanges(
  videoPath: string,
  minSceneDuration: number = 2,
): SceneDetectionResult[] {
  try {
    const result = execSync(
      `ffmpeg -i "${videoPath}" -filter:v "select='gt(scene,0.3)',showinfo" -f null - 2>&1`,
      { timeout: 60000 },
    );
    const output = result.toString();
    const scenes: SceneDetectionResult[] = [];
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
  } catch {
    return [];
  }
}

export function generateThumbnail(
  videoPath: string,
  outputDir: string,
  timestamp: number,
  options: ThumbnailOptions = {},
): ThumbnailResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const ext = getFormatExtension(opts.format || 'jpg');
  const filename = `thumbnail_${generateThumbnailId()}${ext}`;
  const outputPath = join(outputDir, filename);

  try {
    execSync(
      `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -s ${opts.width}x${opts.height} -q:v ${opts.quality} -f image2 "${outputPath}" -y 2>/dev/null`,
      { timeout: 30000 },
    );

    const stats = execSync(`stat -c%s "${outputPath}"`, { timeout: 5000 });
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
  } catch {
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

function calculateThumbnailScore(
  imagePath: string,
  _timestamp: number,
): number {
  try {
    const result = execSync(
      `ffmpeg -i "${imagePath}" -vf "signalstats,histogram" -f null - 2>&1`,
      { timeout: 10000 },
    );
    const output = result.toString();

    let score = 50;
    const brightnessMatch = output.match(/YMIN:\s*(\d+)/);
    const contrastMatch = output.match(/YMAX:\s*(\d+)/);

    if (brightnessMatch && contrastMatch) {
      const min = parseInt(brightnessMatch[1]);
      const max = parseInt(contrastMatch[1]);
      const contrast = max - min;

      if (contrast > 100) score += 20;
      else if (contrast > 60) score += 10;
      else score -= 10;

      if (min > 20 && max < 235) score += 10;
    }

    const satMatch = output.match(/SATAVG:\s*([\d.]+)/);
    if (satMatch) {
      const sat = parseFloat(satMatch[1]);
      if (sat > 0.3 && sat < 0.8) score += 10;
      else if (sat < 0.1) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  } catch {
    return 50;
  }
}

export async function extractBestFrames(
  videoPath: string,
  outputDir: string,
  options: ThumbnailOptions = {},
): Promise<BatchThumbnailResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  await mkdir(outputDir, { recursive: true });

  const duration = getVideoDuration(videoPath);
  const thumbnails: ThumbnailResult[] = [];

  if (opts.method === 'scene' || opts.method === 'combined') {
    const scenes = detectSceneChanges(videoPath, opts.minSceneDuration);

    if (scenes.length > 0) {
      const sceneTimestamps = scenes
        .map((s) => s.timestamp)
        .filter((t) => t > 0.5 && t < duration - 0.5);

      const selectedTimestamps = sceneTimestamps.slice(
        0,
        opts.maxThumbnails || 20,
      );

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

export function extractFrameAtTimestamp(
  videoPath: string,
  outputPath: string,
  timestamp: number,
  width?: number,
  height?: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const size = width && height ? `-s ${width}x${height}` : '';
      execSync(
        `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 ${size} -q:v 2 "${outputPath}" -y 2>/dev/null`,
        { timeout: 30000 },
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateThumbnailGrid(
  thumbnails: ThumbnailResult[],
  outputPath: string,
  cols: number = 4,
  rows: number = 3,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const maxThumbs = cols * rows;
      const selected = thumbnails.slice(0, maxThumbs);
      const inputs = selected.map((t) => `-i "${t.path}"`).join(' ');
      const filterComplex = selected
        .map(
          (_, i) =>
            `[${i}:v]scale=320:180,setsar=1[img${i}]`,
        )
        .join(';');
      const concat = selected
        .map((_, i) => `[img${i}]`)
        .join('');
      const layout = `x=${cols}_tile=${cols}x${rows}`;

      execSync(
        `ffmpeg ${inputs} -filter_complex "${filterComplex};${concat}xstack=grid=${cols}x${rows}:${layout}" "${outputPath}" -y 2>/dev/null`,
        { timeout: 60000 },
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function pickBestThumbnail(
  thumbnails: ThumbnailResult[],
): ThumbnailResult | null {
  if (thumbnails.length === 0) return null;
  return thumbnails.reduce((best, current) =>
    current.score > best.score ? current : best,
  );
}

export function deleteThumbnails(thumbnails: ThumbnailResult[]): Promise<void[]> {
  return Promise.all(
    thumbnails.map(async (thumb) => {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(thumb.path);
      } catch {}
    }),
  );
}

export function getThumbnailAspectRatio(
  width: number,
  height: number,
): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}
