export type EditAuthor = 'ai' | 'human' | 'merged';
export type EditStatus = 'pending' | 'approved' | 'rejected' | 'applied' | 'conflicted';
export type ConflictResolution = 'ai' | 'human' | 'merged' | 'discarded';
export type ProposalType = 'cut' | 'color' | 'text' | 'audio' | 'transition' | 'crop' | 'broll' | 'speed';
export interface EditProposal {
    id: string;
    sessionId: string;
    projectId: string;
    type: ProposalType;
    title: string;
    description: string;
    confidence: number;
    status: EditStatus;
    beforeState: Record<string, any>;
    afterState: Record<string, any>;
    author: EditAuthor;
    metadata?: Record<string, any>;
    createdAt: number;
    respondedAt?: number;
}
export interface EditConflict {
    id: string;
    sessionId: string;
    projectId: string;
    elementId: string;
    elementType: string;
    aiEdit: EditProposal;
    humanEdit: EditProposal;
    resolved: boolean;
    resolution?: ConflictResolution;
    resolutionNote?: string;
    createdAt: number;
    resolvedAt?: number;
}
export interface MergeStrategy {
    type: 'prefer_ai' | 'prefer_human' | 'smart_merge' | 'three_way_merge';
    rules: MergeRule[];
}
export interface MergeRule {
    field: string;
    strategy: 'ai' | 'human' | 'average' | 'sum' | 'longest' | 'shortest';
    priority?: number;
}
export interface CollaborationSession {
    id: string;
    projectId: string;
    activeAuthors: EditAuthor[];
    proposals: EditProposal[];
    conflicts: EditConflict[];
    currentState: Record<string, any>;
    lockedElements: Map<string, EditAuthor>;
}
export declare class CollaborationEngine {
    private sessions;
    private mergeStrategy;
    constructor(strategy?: MergeStrategy);
    setMergeStrategy(strategy: MergeStrategy): void;
    createSession(projectId: string): CollaborationSession;
    getSession(sessionId: string): CollaborationSession | undefined;
    addAuthor(sessionId: string, author: EditAuthor): void;
    removeAuthor(sessionId: string, author: EditAuthor): void;
    createProposal(sessionId: string, proposal: Omit<EditProposal, 'id' | 'createdAt' | 'status'>): EditProposal;
    approveProposal(sessionId: string, proposalId: string): EditProposal | null;
    rejectProposal(sessionId: string, proposalId: string): EditProposal | null;
    applyProposal(sessionId: string, proposalId: string): EditProposal | null;
    private applyProposalState;
    detectConflicts(session: CollaborationSession, newProposal: EditProposal): EditConflict[];
    private proposalsOverlap;
    resolveConflict(sessionId: string, conflictId: string, resolution: ConflictResolution, note?: string): EditConflict | null;
    mergeStates(aiState: Record<string, any>, humanState: Record<string, any>, resolution: ConflictResolution): Record<string, any>;
    private smartMerge;
    lockElement(sessionId: string, elementId: string, author: EditAuthor): boolean;
    unlockElement(sessionId: string, elementId: string, author: EditAuthor): void;
    getUnresolvedConflicts(sessionId: string): EditConflict[];
    getPendingProposals(sessionId: string): EditProposal[];
    getProposalsByAuthor(sessionId: string, author: EditAuthor): EditProposal[];
    getEditHistory(sessionId: string): EditProposal[];
    getSessionState(sessionId: string): Record<string, any> | null;
    destroySession(sessionId: string): void;
}
export declare function createCollaborationEngine(strategy?: MergeStrategy): CollaborationEngine;
