export declare class VideoProcessorService {
    /**
     * Optimiza un video transcodificándolo para web en formato WebM
     */
    static optimizeVideoForWeb(videoPath: string): Promise<{
        success: boolean;
        originalPath: string;
        optimizedPath: string;
        codec: string;
        targetBitrateKbs: number;
    }>;
    /**
     * Aplica una marca de agua (logo) sobre un video
     */
    static applyWatermark(videoPath: string, logoPath: string, position?: "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT"): Promise<{
        success: boolean;
        outputVideoPath: string;
        watermarked: boolean;
        position: string;
    }>;
}
