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
export declare function getVideoDuration(videoPath: string): number;
export declare function detectSceneChanges(videoPath: string, minSceneDuration?: number): SceneDetectionResult[];
export declare function generateThumbnail(videoPath: string, outputDir: string, timestamp: number, options?: ThumbnailOptions): ThumbnailResult;
export declare function extractBestFrames(videoPath: string, outputDir: string, options?: ThumbnailOptions): Promise<BatchThumbnailResult>;
export declare function extractFrameAtTimestamp(videoPath: string, outputPath: string, timestamp: number, width?: number, height?: number): Promise<void>;
export declare function generateThumbnailGrid(thumbnails: ThumbnailResult[], outputPath: string, cols?: number, rows?: number): Promise<void>;
export declare function pickBestThumbnail(thumbnails: ThumbnailResult[]): ThumbnailResult | null;
export declare function deleteThumbnails(thumbnails: ThumbnailResult[]): Promise<void[]>;
export declare function getThumbnailAspectRatio(width: number, height: number): string;
