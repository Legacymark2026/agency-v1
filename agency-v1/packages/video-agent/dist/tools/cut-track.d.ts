import { VideoSessionMemory, TimelineState } from '../memory/session-memory';
export interface CutTrackArgs {
    trackId: string;
    startTime: number;
    endTime: number;
    sessionId: string;
}
export interface CutTrackResult {
    success: boolean;
    trackId: string;
    originalDuration: number;
    newDuration: number;
    removedDuration: number;
    timeline: TimelineState;
}
export declare function cutTrack(args: CutTrackArgs, memory: VideoSessionMemory): Promise<CutTrackResult>;
export declare function removeSilenceSegments(sessionId: string, silenceSegments: {
    start: number;
    end: number;
}[], memory: VideoSessionMemory): Promise<{
    cutsApplied: number;
    totalRemoved: number;
}>;
