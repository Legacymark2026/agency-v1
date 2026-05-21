import { VideoSessionMemory } from '../memory/session-memory';
export interface InjectBRollArgs {
    keywords: string[];
    insertTime: number;
    sessionId: string;
    maxDuration?: number;
    source?: 'pexels' | 'pixabay' | 'internal';
}
export interface BRollAsset {
    id: string;
    url: string;
    thumbnail: string;
    duration: number;
    width: number;
    height: number;
    tags: string[];
    source: string;
}
export interface InjectBRollResult {
    success: boolean;
    asset: BRollAsset;
    insertTime: number;
    duration: number;
}
export declare function injectBRoll(args: InjectBRollArgs, memory: VideoSessionMemory): Promise<InjectBRollResult>;
