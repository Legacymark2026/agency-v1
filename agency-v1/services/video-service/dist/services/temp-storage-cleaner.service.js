"use strict";
/**
 * Video Studio Pro — Automated Temporary Media & Render Storage Purger
 * ─────────────────────────────────────────────────────────────────────────────
 * Inspects render directories and purges intermediate FFmpeg chunks,
 * stale audio stems, and exported clips older than 24 hours to prevent disk saturation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tempStorageCleaner = exports.TempStorageCleanerService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class TempStorageCleanerService {
    targetDirectories;
    maxAgeHours;
    timer = null;
    constructor(targetDirectories = ["/app/renders", "./renders", "/tmp/renders"], maxAgeHours = 24) {
        this.targetDirectories = targetDirectories;
        this.maxAgeHours = maxAgeHours;
    }
    /**
     * Run a sweep of all target directories and remove files older than maxAgeHours
     */
    async purgeStaleRenders(customMaxAgeHours) {
        const startTime = Date.now();
        const ageThresholdHours = customMaxAgeHours ?? this.maxAgeHours;
        const now = Date.now();
        const maxAgeMs = ageThresholdHours * 60 * 60 * 1000;
        let filesExamined = 0;
        let filesDeleted = 0;
        let bytesReclaimed = 0;
        const purgedPaths = [];
        for (const dir of this.targetDirectories) {
            if (!fs_1.default.existsSync(dir))
                continue;
            try {
                const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path_1.default.join(dir, entry.name);
                    filesExamined++;
                    try {
                        const stats = fs_1.default.statSync(fullPath);
                        if (stats.isFile()) {
                            const fileAgeMs = now - stats.mtimeMs;
                            if (fileAgeMs > maxAgeMs) {
                                bytesReclaimed += stats.size;
                                fs_1.default.unlinkSync(fullPath);
                                filesDeleted++;
                                purgedPaths.push(entry.name);
                            }
                        }
                    }
                    catch (fileErr) {
                        console.warn(`[TempStorageCleaner] Could not inspect ${fullPath}:`, fileErr.message);
                    }
                }
            }
            catch (dirErr) {
                console.warn(`[TempStorageCleaner] Error reading dir ${dir}:`, dirErr.message);
            }
        }
        const durationMs = Date.now() - startTime;
        const mbReclaimed = parseFloat((bytesReclaimed / (1024 * 1024)).toFixed(2));
        console.log(`[TempStorageCleaner] Purge completed: ${filesDeleted}/${filesExamined} files deleted, ` +
            `${mbReclaimed} MB reclaimed in ${durationMs}ms.`);
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
    startScheduler(intervalHours = 6) {
        if (this.timer)
            return;
        const intervalMs = intervalHours * 60 * 60 * 1000;
        // Run first sweep
        this.purgeStaleRenders().catch((err) => console.error("[TempStorageCleaner] Sweep error:", err));
        this.timer = setInterval(() => {
            this.purgeStaleRenders().catch((err) => console.error("[TempStorageCleaner] Sweep error:", err));
        }, intervalMs);
        console.log(`[TempStorageCleaner] Auto-purge scheduler started (Interval: ${intervalHours}h, MaxAge: ${this.maxAgeHours}h)`);
    }
    stopScheduler() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
exports.TempStorageCleanerService = TempStorageCleanerService;
exports.tempStorageCleaner = new TempStorageCleanerService();
//# sourceMappingURL=temp-storage-cleaner.service.js.map