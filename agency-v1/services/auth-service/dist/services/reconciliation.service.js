"use strict";
/**
 * services/auth-service/src/services/reconciliation.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Data Integrity Reconciliation Engine
 * Automatically aligns and verifies user record hashes between the legacy database
 * and the new decoupled auth database, logging results to OpenTelemetry.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const api_1 = require("@opentelemetry/api");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("@agency/database");
const tracer = api_1.trace.getTracer("auth-reconciliation-engine");
class ReconciliationService {
    /**
     * Compares users in the decoupled Auth DB and the legacy Core DB,
     * reconciling any mismatched fields and reporting integrity metrics.
     */
    static async runUserReconciliation() {
        return await tracer.startActiveSpan("database.reconciliation", async (span) => {
            const stats = { processed: 0, aligned: 0, fixed: 0, errors: 0 };
            try {
                console.log("🔍 [Reconciliation] Starting data integrity audit between decoupled Auth DB and Core DB...");
                // 1. Get database client instances
                const authDb = (0, database_1.getPrismaAuth)();
                const coreDb = (0, database_1.getPrismaCore)();
                // 2. Fetch all users from both databases
                const authUsers = await authDb.user.findMany({
                    select: { id: true, email: true, name: true, role: true },
                });
                const coreUsers = await coreDb.user.findMany({
                    select: { id: true, email: true, name: true, role: true },
                });
                const coreUserMap = new Map(coreUsers.map((u) => [u.id, u]));
                span.setAttribute("reconciliation.total_auth_records", authUsers.length);
                span.setAttribute("reconciliation.total_core_records", coreUsers.length);
                for (const authUser of authUsers) {
                    stats.processed++;
                    const coreUser = coreUserMap.get(authUser.id);
                    if (!coreUser) {
                        // User exists in decoupled Auth DB but not in legacy Core DB. Sincronizar en doble escritura
                        try {
                            await coreDb.user.create({
                                data: {
                                    id: authUser.id,
                                    email: authUser.email,
                                    name: authUser.name,
                                    role: authUser.role,
                                },
                            });
                            stats.fixed++;
                            console.log(`⚡ [Reconciliation] Reconciled: User ${authUser.id} inserted back into legacy Core DB`);
                        }
                        catch (err) {
                            stats.errors++;
                            console.error(`❌ [Reconciliation] Error creating user ${authUser.id} in Core DB:`, err.message);
                        }
                        continue;
                    }
                    // Calculate checksum hash of records
                    const authHash = crypto_1.default
                        .createHash("md5")
                        .update(`${authUser.email}:${authUser.name || ""}:${authUser.role}`)
                        .digest("hex");
                    const coreHash = crypto_1.default
                        .createHash("md5")
                        .update(`${coreUser.email}:${coreUser.name || ""}:${coreUser.role}`)
                        .digest("hex");
                    if (authHash === coreHash) {
                        stats.aligned++;
                    }
                    else {
                        // Mismatch detected! Align Core DB with Auth DB (Auth DB is the new source of truth for user IAM)
                        try {
                            await coreDb.user.update({
                                where: { id: authUser.id },
                                data: {
                                    email: authUser.email,
                                    name: authUser.name,
                                    role: authUser.role,
                                },
                            });
                            stats.fixed++;
                            console.warn(`⚠️ [Reconciliation] Mismatch fixed: User ${authUser.id} aligned with decoupled Auth DB values.`);
                        }
                        catch (err) {
                            stats.errors++;
                            console.error(`❌ [Reconciliation] Error updating user ${authUser.id} in Core DB:`, err.message);
                        }
                    }
                }
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.setAttribute("reconciliation.aligned_records", stats.aligned);
                span.setAttribute("reconciliation.fixed_records", stats.fixed);
                span.setAttribute("reconciliation.errors_count", stats.errors);
                console.log(`📊 [Reconciliation] Audit complete. Processed: ${stats.processed}, Aligned: ${stats.aligned}, Fixed: ${stats.fixed}, Errors: ${stats.errors}`);
            }
            catch (err) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: err.message,
                });
                console.error("❌ [Reconciliation] Reconciliation job failed:", err.message);
            }
            finally {
                span.end();
            }
            return stats;
        });
    }
}
exports.ReconciliationService = ReconciliationService;
//# sourceMappingURL=reconciliation.service.js.map