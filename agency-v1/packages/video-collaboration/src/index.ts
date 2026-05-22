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

const DEFAULT_MERGE_STRATEGY: MergeStrategy = {
  type: 'smart_merge',
  rules: [
    { field: 'clips', strategy: 'ai', priority: 1 },
    { field: 'audioTracks', strategy: 'human', priority: 1 },
    { field: 'textOverlays', strategy: 'human', priority: 2 },
    { field: 'colorGrades', strategy: 'ai', priority: 1 },
    { field: 'speedRamps', strategy: 'ai', priority: 2 },
    { field: 'timeline', strategy: 'human', priority: 1 },
  ],
};

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class CollaborationEngine {
  private sessions: Map<string, CollaborationSession> = new Map();
  private mergeStrategy: MergeStrategy;

  constructor(strategy?: MergeStrategy) {
    this.mergeStrategy = strategy || DEFAULT_MERGE_STRATEGY;
  }

  setMergeStrategy(strategy: MergeStrategy): void {
    this.mergeStrategy = strategy;
  }

  createSession(projectId: string): CollaborationSession {
    const session: CollaborationSession = {
      id: generateId('collab'),
      projectId,
      activeAuthors: [],
      proposals: [],
      conflicts: [],
      currentState: {},
      lockedElements: new Map(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  addAuthor(sessionId: string, author: EditAuthor): void {
    const session = this.sessions.get(sessionId);
    if (session && !session.activeAuthors.includes(author)) {
      session.activeAuthors.push(author);
    }
  }

  removeAuthor(sessionId: string, author: EditAuthor): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.activeAuthors = session.activeAuthors.filter((a) => a !== author);
      for (const [elementId, lockedBy] of session.lockedElements) {
        if (lockedBy === author) {
          session.lockedElements.delete(elementId);
        }
      }
    }
  }

  createProposal(
    sessionId: string,
    proposal: Omit<EditProposal, 'id' | 'createdAt' | 'status'>,
  ): EditProposal {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const newProposal: EditProposal = {
      ...proposal,
      id: generateId('prop'),
      status: 'pending',
      createdAt: Date.now(),
    };

    session.proposals.push(newProposal);

    const conflicts = this.detectConflicts(session, newProposal);
    if (conflicts.length > 0) {
      newProposal.status = 'conflicted';
      session.conflicts.push(...conflicts);
    }

    return newProposal;
  }

  approveProposal(sessionId: string, proposalId: string): EditProposal | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const proposal = session.proposals.find((p) => p.id === proposalId);
    if (!proposal) return null;

    proposal.status = 'approved';
    proposal.respondedAt = Date.now();

    this.applyProposalState(session, proposal);

    return proposal;
  }

  rejectProposal(
    sessionId: string,
    proposalId: string,
  ): EditProposal | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const proposal = session.proposals.find((p) => p.id === proposalId);
    if (!proposal) return null;

    proposal.status = 'rejected';
    proposal.respondedAt = Date.now();

    return proposal;
  }

  applyProposal(sessionId: string, proposalId: string): EditProposal | null {
    const proposal = this.approveProposal(sessionId, proposalId);
    if (proposal) {
      proposal.status = 'applied';
    }
    return proposal;
  }

  private applyProposalState(
    session: CollaborationSession,
    proposal: EditProposal,
  ): void {
    session.currentState = {
      ...session.currentState,
      ...proposal.afterState,
    };
  }

  detectConflicts(
    session: CollaborationSession,
    newProposal: EditProposal,
  ): EditConflict[] {
    const conflicts: EditConflict[] = [];

    const conflictingProposals = session.proposals.filter(
      (p) =>
        p.id !== newProposal.id &&
        p.status === 'approved' &&
        this.proposalsOverlap(p, newProposal),
    );

    for (const existing of conflictingProposals) {
      conflicts.push({
        id: generateId('conflict'),
        sessionId: session.id,
        projectId: session.projectId,
        elementId: newProposal.type,
        elementType: newProposal.type,
        aiEdit:
          newProposal.author === 'ai' ? newProposal : existing,
        humanEdit:
          newProposal.author === 'human' ? newProposal : existing,
        resolved: false,
        createdAt: Date.now(),
      });
    }

    return conflicts;
  }

  private proposalsOverlap(a: EditProposal, b: EditProposal): boolean {
    if (a.type !== b.type) return false;

    const aKeys = Object.keys(a.afterState);
    const bKeys = Object.keys(b.afterState);
    return aKeys.some((key) => bKeys.includes(key));
  }

  resolveConflict(
    sessionId: string,
    conflictId: string,
    resolution: ConflictResolution,
    note?: string,
  ): EditConflict | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const conflict = session.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return null;

    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.resolvedAt = Date.now();
    if (note) conflict.resolutionNote = note;

    const mergedState = this.mergeStates(
      conflict.aiEdit.afterState,
      conflict.humanEdit.afterState,
      resolution,
    );

    session.currentState = { ...session.currentState, ...mergedState };

    return conflict;
  }

  mergeStates(
    aiState: Record<string, any>,
    humanState: Record<string, any>,
    resolution: ConflictResolution,
  ): Record<string, any> {
    switch (resolution) {
      case 'ai':
        return { ...aiState };
      case 'human':
        return { ...humanState };
      case 'discarded':
        return {};
      case 'merged':
        return this.smartMerge(aiState, humanState);
      default:
        return this.smartMerge(aiState, humanState);
    }
  }

  private smartMerge(
    aiState: Record<string, any>,
    humanState: Record<string, any>,
  ): Record<string, any> {
    const merged: Record<string, any> = {};

    const allKeys = new Set([
      ...Object.keys(aiState),
      ...Object.keys(humanState),
    ]);

    for (const key of allKeys) {
      const rule = this.mergeStrategy.rules.find((r) => r.field === key);
      const strategy = rule?.strategy || 'ai';

      switch (strategy) {
        case 'ai':
          merged[key] = aiState[key] ?? humanState[key];
          break;
        case 'human':
          merged[key] = humanState[key] ?? aiState[key];
          break;
        case 'average':
          if (
            typeof aiState[key] === 'number' &&
            typeof humanState[key] === 'number'
          ) {
            merged[key] = (aiState[key] + humanState[key]) / 2;
          } else {
            merged[key] = humanState[key] ?? aiState[key];
          }
          break;
        case 'sum':
          if (
            typeof aiState[key] === 'number' &&
            typeof humanState[key] === 'number'
          ) {
            merged[key] = aiState[key] + humanState[key];
          } else if (Array.isArray(aiState[key]) && Array.isArray(humanState[key])) {
            merged[key] = [...aiState[key], ...humanState[key]];
          } else {
            merged[key] = humanState[key] ?? aiState[key];
          }
          break;
        case 'longest':
          if (typeof aiState[key] === 'string' && typeof humanState[key] === 'string') {
            merged[key] =
              aiState[key].length >= humanState[key].length
                ? aiState[key]
                : humanState[key];
          } else {
            merged[key] = humanState[key] ?? aiState[key];
          }
          break;
        case 'shortest':
          if (typeof aiState[key] === 'string' && typeof humanState[key] === 'string') {
            merged[key] =
              aiState[key].length <= humanState[key].length
                ? aiState[key]
                : humanState[key];
          } else {
            merged[key] = humanState[key] ?? aiState[key];
          }
          break;
        default:
          merged[key] = aiState[key] ?? humanState[key];
      }
    }

    return merged;
  }

  lockElement(
    sessionId: string,
    elementId: string,
    author: EditAuthor,
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.lockedElements.has(elementId)) {
      return session.lockedElements.get(elementId) === author;
    }

    session.lockedElements.set(elementId, author);
    return true;
  }

  unlockElement(sessionId: string, elementId: string, author: EditAuthor): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.lockedElements.get(elementId) === author) {
      session.lockedElements.delete(elementId);
    }
  }

  getUnresolvedConflicts(sessionId: string): EditConflict[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.conflicts.filter((c) => !c.resolved);
  }

  getPendingProposals(sessionId: string): EditProposal[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.proposals
      .filter((p) => p.status === 'pending')
      .sort((a, b) => b.confidence - a.confidence);
  }

  getProposalsByAuthor(
    sessionId: string,
    author: EditAuthor,
  ): EditProposal[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.proposals.filter((p) => p.author === author);
  }

  getEditHistory(sessionId: string): EditProposal[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.proposals
      .filter((p) => p.status !== 'pending')
      .sort((a, b) => (b.respondedAt || 0) - (a.respondedAt || 0));
  }

  getSessionState(sessionId: string): Record<string, any> | null {
    const session = this.sessions.get(sessionId);
    return session ? session.currentState : null;
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export function createCollaborationEngine(
  strategy?: MergeStrategy,
): CollaborationEngine {
  return new CollaborationEngine(strategy);
}
