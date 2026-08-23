/**
 * Video Studio Pro — Automated Temporary Media & Render Storage Purger
 * ─────────────────────────────────────────────────────────────────────────────
 * Inspects render directories and purges intermediate FFmpeg chunks,
 * stale audio stems, and exported clips older than 24 hours to prevent disk saturation.
 */

import fs from "fs";
import path from "path";

export interface PurgeResult {
  filesExamined: number;
  filesDeleted: number;
  bytesReclaimed: number;
  mbReclaimed: number;
  purgedPaths: string[];
  durationMs: number;
}

export class TempStorageCleanerService {
  private targetDirectories: string[];
  private maxAgeHours: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(targetDirectories: string[] = ["/app/renders", "./renders", "/tmp/renders"], maxAgeHours: number = 24) {
    this.targetDirectories = targetDirectories;
    this.maxAgeHours = maxAgeHours;
  }

  /**
   * Run a sweep of all target directories and remove files older than maxAgeHours
   */
  async purgeStaleRenders(customMaxAgeHours?: number): Promise<PurgeResult> {
    const startTime = Date.now();
    const ageThresholdHours = customMaxAgeHours ?? this.maxAgeHours;
    const now = Date.now();
    const maxAgeMs = ageThresholdHours * 60 * 60 * 1000;

    let filesExamined = 0;
    let filesDeleted = 0;
    let bytesReclaimed = 0;
    const purgedPaths: string[] = [];

    for (const dir of this.targetDirectories) {
      if (!fs.existsSync(dir)) continue;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          filesExamined++;

          try {
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
              const fileAgeMs = now - stats.mtimeMs;
              if (fileAgeMs > maxAgeMs) {
                bytesReclaimed += stats.size;
                fs.unlinkSync(fullPath);
                filesDeleted++;
                purgedPaths.push(entry.name);
              }
            }
          } catch (fileErr: any) {
            console.warn(`[TempStorageCleaner] Could not inspect ${fullPath}:`, fileErr.message);
          }
        }
      } catch (dirErr: any) {
        console.warn(`[TempStorageCleaner] Error reading dir ${dir}:`, dirErr.message);
      }
    }

    const durationMs = Date.now() - startTime;
    const mbReclaimed = parseFloat((bytesReclaimed / (1024 * 1024)).toFixed(2));

    console.log(
      `[TempStorageCleaner] Purge completed: ${filesDeleted}/${filesExamined} files deleted, ` +
      `${mbReclaimed} MB reclaimed in ${durationMs}ms.`
    );

    return {
      filesExamined,
      filesDeleted,
      bytesReclaimed,
      mbReclaimed,
      purgedPaths,
      durationMs,
    };
  }

  /**
   * Start periodic background cleaner interval (runs every 6 hours by default)
   */
  startScheduler(intervalHours: number = 6): void {
    if (this.timer) return;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Run first sweep
    this.purgeStaleRenders().catch((err) => console.error("[TempStorageCleaner] Sweep error:", err));

    this.timer = setInterval(() => {
      this.purgeStaleRenders().catch((err) => console.error("[TempStorageCleaner] Sweep error:", err));
    }, intervalMs);

    console.log(`[TempStorageCleaner] Auto-purge scheduler started (Interval: ${intervalHours}h, MaxAge: ${this.maxAgeHours}h)`);
  }

  stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const tempStorageCleaner = new TempStorageCleanerService();
