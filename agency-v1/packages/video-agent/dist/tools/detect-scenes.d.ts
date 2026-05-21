export interface SceneChange {
    timestamp: number;
    confidence: number;
    type: 'hard_cut' | 'fade' | 'dissolve' | 'wipe';
}
export interface VisualAnalysis {
    scenes: SceneChange[];
    dominantColors: string[];
    brightness: number;
    motionScore: number;
    faceDetected: boolean;
    textDetected: boolean;
}
export declare function detectVisualScenes(videoUrl: string, options?: {
    threshold?: number;
    minSceneLength?: number;
}): Promise<VisualAnalysis>;
