/**
 * Video Studio Pro — Automated Temporary Media & Render Storage Purger
 * ─────────────────────────────────────────────────────────────────────────────
 * Inspects render directories and purges intermediate FFmpeg chunks,
 * stale audio stems, and exported clips older than 24 hours to prevent disk saturation.
 */
export interface PurgeResult {
    filesExamined: number;
    filesDeleted: number;
    bytesReclaimed: number;
    mbReclaimed: number;
    purgedPaths: string[];
    durationMs: number;
}
export declare class TempStorageCleanerService {
    private targetDirectories;
    private maxAgeHours;
    private timer;
    constructor(targetDirectories?: string[], maxAgeHours?: number);
    /**
     * Run a sweep of all target directories and remove files older than maxAgeHours
     */
    purgeStaleRenders(customMaxAgeHours?: number): Promise<PurgeResult>;
    /**
     * Start periodic background cleaner interval (runs every 6 hours by default)
     */
    startScheduler(intervalHours?: number): void;
    stopScheduler(): void;
}
export declare const tempStorageCleaner: TempStorageCleanerService;
