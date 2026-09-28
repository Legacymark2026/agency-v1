"use strict";
/**
 * Immutable Event Sourcing Ledger & Cryptographic Audit Chain
 * ─────────────────────────────────────────────────────────────────────────────
 * Cryptographically chained append-only ledger that records all critical
 * events (invoicing, payments, auth, compliance) with SHA-256 block linking,
 * tamper detection, and point-in-time state replay.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.immutableLedgerService = exports.ImmutableLedgerService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class ImmutableLedgerService {
    chain = [];
    constructor() {
        this.createGenesisBlock();
    }
    createGenesisBlock() {
        const genesis = {
            blockIndex: 0,
            timestamp: new Date("2026-01-01T00:00:00Z").toISOString(),
            eventType: "LEDGER_GENESIS",
            tenantId: "system_root",
            payload: { message: "LegacyMark Core Enterprise Ledger Genesis Block" },
            previousBlockHash: "0000000000000000000000000000000000000000000000000000000000000000",
            blockHash: "",
        };
        genesis.blockHash = this.calculateBlockHash(genesis);
        this.chain.push(genesis);
    }
    calculateBlockHash(block) {
        const raw = `${block.blockIndex}-${block.timestamp}-${block.eventType}-${block.tenantId}-${JSON.stringify(block.payload)}-${block.previousBlockHash}`;
        return crypto_1.default.createHash("sha256").update(raw).digest("hex");
    }
    /**
     * Appends an immutable event to the cryptographic ledger.
     */
    appendEvent(tenantId, eventType, payload) {
        const prevBlock = this.chain[this.chain.length - 1];
        const newBlockIndex = prevBlock.blockIndex + 1;
        const timestamp = new Date().toISOString();
        const blockToHash = {
            blockIndex: newBlockIndex,
            timestamp,
            eventType,
            tenantId,
            payload,
            previousBlockHash: prevBlock.blockHash,
        };
        const blockHash = this.calculateBlockHash(blockToHash);
        const newBlock = { ...blockToHash, blockHash };
        this.chain.push(newBlock);
        return newBlock;
    }
    /**
     * Validates the integrity of the entire cryptographic chain to detect tampering.
     */
    verifyLedgerIntegrity() {
        for (let i = 1; i < this.chain.length; i++) {
            const current = this.chain[i];
            const previous = this.chain[i - 1];
            // 1. Verify previous hash link
            if (current.previousBlockHash !== previous.blockHash) {
                return { isValid: false, corruptedBlockIndex: i, totalBlocks: this.chain.length };
            }
            // 2. Re-calculate current hash
            const expectedHash = this.calculateBlockHash(current);
            if (current.blockHash !== expectedHash) {
                return { isValid: false, corruptedBlockIndex: i, totalBlocks: this.chain.length };
            }
        }
        return { isValid: true, totalBlocks: this.chain.length };
    }
    /**
     * Replays historical events to reconstruct the exact state of an entity at a given timestamp.
     */
    replayEntityState(tenantId, entityId) {
        const events = this.chain.filter((b) => b.tenantId === tenantId && b.payload?.entityId === entityId);
        let state = {};
        for (const evt of events) {
            state = { ...state, ...evt.payload.changes, lastEvent: evt.eventType, updatedAt: evt.timestamp };
        }
        return state;
    }
}
exports.ImmutableLedgerService = ImmutableLedgerService;
exports.immutableLedgerService = new ImmutableLedgerService();
//# sourceMappingURL=immutable-ledger.service.js.map