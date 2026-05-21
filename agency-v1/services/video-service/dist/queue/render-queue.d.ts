import { Queue, Worker, Job } from 'bullmq';
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
export declare function getQueue(): Queue;
export declare function addRenderJob(data: RenderJobData): Promise<Job>;
export declare function createWorker(outputDir: string): Worker;
export declare function getJobStatus(jobId: string): Promise<{
    progress: number;
    state: string;
    data: RenderJobData;
    result?: RenderJobResult;
    failedReason?: string;
} | null>;
export declare function cancelJob(jobId: string): Promise<boolean>;
export declare function getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
}>;
export declare function closeQueue(): Promise<void>;
