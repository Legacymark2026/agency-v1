import { VideoSessionMemory } from '../memory/session-memory';
export interface SmartCropArgs {
    trackId: string;
    targetAspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
    sessionId: string;
}
export interface FaceDetection {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    timestamp: number;
}
export interface SmartCropResult {
    success: boolean;
    trackId: string;
    originalResolution: string;
    newResolution: string;
    cropPath: {
        x: number;
        y: number;
        scale: number;
    }[];
    facesDetected: number;
}
export declare function applySmartCrop(args: SmartCropArgs, memory: VideoSessionMemory): Promise<SmartCropResult>;
