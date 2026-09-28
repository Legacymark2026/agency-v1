/**
 * Immutable Event Sourcing Ledger & Cryptographic Audit Chain
 * ─────────────────────────────────────────────────────────────────────────────
 * Cryptographically chained append-only ledger that records all critical
 * events (invoicing, payments, auth, compliance) with SHA-256 block linking,
 * tamper detection, and point-in-time state replay.
 */
export interface LedgerBlock {
    blockIndex: number;
    timestamp: string;
    eventType: string;
    tenantId: string;
    payload: Record<string, any>;
    previousBlockHash: string;
    blockHash: string;
}
export declare class ImmutableLedgerService {
    private chain;
    constructor();
    private createGenesisBlock;
    private calculateBlockHash;
    /**
     * Appends an immutable event to the cryptographic ledger.
     */
    appendEvent(tenantId: string, eventType: string, payload: Record<string, any>): LedgerBlock;
    /**
     * Validates the integrity of the entire cryptographic chain to detect tampering.
     */
    verifyLedgerIntegrity(): {
        isValid: boolean;
        corruptedBlockIndex?: number;
        totalBlocks: number;
    };
    /**
     * Replays historical events to reconstruct the exact state of an entity at a given timestamp.
     */
    replayEntityState(tenantId: string, entityId: string): Record<string, any>;
}
export declare const immutableLedgerService: ImmutableLedgerService;
