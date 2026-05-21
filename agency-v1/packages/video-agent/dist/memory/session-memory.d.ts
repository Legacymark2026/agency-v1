export interface TimelineState {
    clips: any[];
    audioTracks: any[];
    textOverlays: any[];
    colorGrades: any[];
    speedRamps: any[];
    soundLayers: any[];
    config: any;
}
export interface EditChange {
    id: string;
    action: string;
    description: string;
    beforeState: Partial<TimelineState>;
    afterState: Partial<TimelineState>;
    timestamp: string;
    undone: boolean;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCalls?: any[];
    toolResults?: any;
    timestamp: string;
}
export interface SessionContext {
    sessionId: string;
    projectId: string;
    companyId: string;
    currentPrompt?: string;
    lastAction?: string;
    createdAt: string;
}
export declare class VideoSessionMemory {
    private redis;
    constructor(redisUrl?: string);
    private key;
    saveState(sessionId: string, timeline: TimelineState): Promise<void>;
    getState(sessionId: string): Promise<TimelineState | null>;
    pushHistory(sessionId: string, change: EditChange): Promise<void>;
    getHistory(sessionId: string): Promise<EditChange[]>;
    undo(sessionId: string): Promise<EditChange | null>;
    redo(sessionId: string): Promise<EditChange | null>;
    pushMessage(sessionId: string, message: ChatMessage): Promise<void>;
    getRecentMessages(sessionId: string): Promise<ChatMessage[]>;
    saveContext(sessionId: string, context: SessionContext): Promise<void>;
    getContext(sessionId: string): Promise<SessionContext | null>;
    clearSession(sessionId: string): Promise<void>;
    disconnect(): Promise<void>;
}
