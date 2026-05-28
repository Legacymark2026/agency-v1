const DEFAULT_MERGE_STRATEGY = {
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
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
export class CollaborationEngine {
    constructor(strategy) {
        this.sessions = new Map();
        this.mergeStrategy = strategy || DEFAULT_MERGE_STRATEGY;
    }
    setMergeStrategy(strategy) {
        this.mergeStrategy = strategy;
    }
    createSession(projectId) {
        const session = {
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
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    addAuthor(sessionId, author) {
        const session = this.sessions.get(sessionId);
        if (session && !session.activeAuthors.includes(author)) {
            session.activeAuthors.push(author);
        }
    }
    removeAuthor(sessionId, author) {
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
    createProposal(sessionId, proposal) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session ${sessionId} not found`);
        const newProposal = Object.assign(Object.assign({}, proposal), { id: generateId('prop'), status: 'pending', createdAt: Date.now() });
        session.proposals.push(newProposal);
        const conflicts = this.detectConflicts(session, newProposal);
        if (conflicts.length > 0) {
            newProposal.status = 'conflicted';
            session.conflicts.push(...conflicts);
        }
        return newProposal;
    }
    approveProposal(sessionId, proposalId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        const proposal = session.proposals.find((p) => p.id === proposalId);
        if (!proposal)
            return null;
        proposal.status = 'approved';
        proposal.respondedAt = Date.now();
        this.applyProposalState(session, proposal);
        return proposal;
    }
    rejectProposal(sessionId, proposalId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        const proposal = session.proposals.find((p) => p.id === proposalId);
        if (!proposal)
            return null;
        proposal.status = 'rejected';
        proposal.respondedAt = Date.now();
        return proposal;
    }
    applyProposal(sessionId, proposalId) {
        const proposal = this.approveProposal(sessionId, proposalId);
        if (proposal) {
            proposal.status = 'applied';
        }
        return proposal;
    }
    applyProposalState(session, proposal) {
        session.currentState = Object.assign(Object.assign({}, session.currentState), proposal.afterState);
    }
    detectConflicts(session, newProposal) {
        const conflicts = [];
        const conflictingProposals = session.proposals.filter((p) => p.id !== newProposal.id &&
            p.status === 'approved' &&
            this.proposalsOverlap(p, newProposal));
        for (const existing of conflictingProposals) {
            conflicts.push({
                id: generateId('conflict'),
                sessionId: session.id,
                projectId: session.projectId,
                elementId: newProposal.type,
                elementType: newProposal.type,
                aiEdit: newProposal.author === 'ai' ? newProposal : existing,
                humanEdit: newProposal.author === 'human' ? newProposal : existing,
                resolved: false,
                createdAt: Date.now(),
            });
        }
        return conflicts;
    }
    proposalsOverlap(a, b) {
        if (a.type !== b.type)
            return false;
        const aKeys = Object.keys(a.afterState);
        const bKeys = Object.keys(b.afterState);
        return aKeys.some((key) => bKeys.includes(key));
    }
    resolveConflict(sessionId, conflictId, resolution, note) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        const conflict = session.conflicts.find((c) => c.id === conflictId);
        if (!conflict)
            return null;
        conflict.resolved = true;
        conflict.resolution = resolution;
        conflict.resolvedAt = Date.now();
        if (note)
            conflict.resolutionNote = note;
        const mergedState = this.mergeStates(conflict.aiEdit.afterState, conflict.humanEdit.afterState, resolution);
        session.currentState = Object.assign(Object.assign({}, session.currentState), mergedState);
        return conflict;
    }
    mergeStates(aiState, humanState, resolution) {
        switch (resolution) {
            case 'ai':
                return Object.assign({}, aiState);
            case 'human':
                return Object.assign({}, humanState);
            case 'discarded':
                return {};
            case 'merged':
                return this.smartMerge(aiState, humanState);
            default:
                return this.smartMerge(aiState, humanState);
        }
    }
    smartMerge(aiState, humanState) {
        var _a, _b, _c, _d, _e, _f, _g;
        const merged = {};
        const allKeys = new Set([
            ...Object.keys(aiState),
            ...Object.keys(humanState),
        ]);
        for (const key of allKeys) {
            const rule = this.mergeStrategy.rules.find((r) => r.field === key);
            const strategy = (rule === null || rule === void 0 ? void 0 : rule.strategy) || 'ai';
            switch (strategy) {
                case 'ai':
                    merged[key] = (_a = aiState[key]) !== null && _a !== void 0 ? _a : humanState[key];
                    break;
                case 'human':
                    merged[key] = (_b = humanState[key]) !== null && _b !== void 0 ? _b : aiState[key];
                    break;
                case 'average':
                    if (typeof aiState[key] === 'number' &&
                        typeof humanState[key] === 'number') {
                        merged[key] = (aiState[key] + humanState[key]) / 2;
                    }
                    else {
                        merged[key] = (_c = humanState[key]) !== null && _c !== void 0 ? _c : aiState[key];
                    }
                    break;
                case 'sum':
                    if (typeof aiState[key] === 'number' &&
                        typeof humanState[key] === 'number') {
                        merged[key] = aiState[key] + humanState[key];
                    }
                    else if (Array.isArray(aiState[key]) && Array.isArray(humanState[key])) {
                        merged[key] = [...aiState[key], ...humanState[key]];
                    }
                    else {
                        merged[key] = (_d = humanState[key]) !== null && _d !== void 0 ? _d : aiState[key];
                    }
                    break;
                case 'longest':
                    if (typeof aiState[key] === 'string' && typeof humanState[key] === 'string') {
                        merged[key] =
                            aiState[key].length >= humanState[key].length
                                ? aiState[key]
                                : humanState[key];
                    }
                    else {
                        merged[key] = (_e = humanState[key]) !== null && _e !== void 0 ? _e : aiState[key];
                    }
                    break;
                case 'shortest':
                    if (typeof aiState[key] === 'string' && typeof humanState[key] === 'string') {
                        merged[key] =
                            aiState[key].length <= humanState[key].length
                                ? aiState[key]
                                : humanState[key];
                    }
                    else {
                        merged[key] = (_f = humanState[key]) !== null && _f !== void 0 ? _f : aiState[key];
                    }
                    break;
                default:
                    merged[key] = (_g = aiState[key]) !== null && _g !== void 0 ? _g : humanState[key];
            }
        }
        return merged;
    }
    lockElement(sessionId, elementId, author) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        if (session.lockedElements.has(elementId)) {
            return session.lockedElements.get(elementId) === author;
        }
        session.lockedElements.set(elementId, author);
        return true;
    }
    unlockElement(sessionId, elementId, author) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        if (session.lockedElements.get(elementId) === author) {
            session.lockedElements.delete(elementId);
        }
    }
    getUnresolvedConflicts(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return [];
        return session.conflicts.filter((c) => !c.resolved);
    }
    getPendingProposals(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return [];
        return session.proposals
            .filter((p) => p.status === 'pending')
            .sort((a, b) => b.confidence - a.confidence);
    }
    getProposalsByAuthor(sessionId, author) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return [];
        return session.proposals.filter((p) => p.author === author);
    }
    getEditHistory(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return [];
        return session.proposals
            .filter((p) => p.status !== 'pending')
            .sort((a, b) => (b.respondedAt || 0) - (a.respondedAt || 0));
    }
    getSessionState(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.currentState : null;
    }
    destroySession(sessionId) {
        this.sessions.delete(sessionId);
    }
}
export function createCollaborationEngine(strategy) {
    return new CollaborationEngine(strategy);
}
