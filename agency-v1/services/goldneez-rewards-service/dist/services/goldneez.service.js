"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldneezService = void 0;
const pg_1 = require("pg");
const crypto_1 = __importDefault(require("crypto"));
const GOLDNEEZ_DB_URL = process.env.GOLDNEEZ_DB_URL || "postgresql://legacyuser:legacypass@localhost:5432/legacymark?schema=goldneez&search_path=goldneez,public";
const pool = new pg_1.Pool({
    connectionString: GOLDNEEZ_DB_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
pool.on("connect", (client) => {
    client.query("SET search_path TO goldneez, public;").catch(err => console.error("[PG] search_path set error:", err));
});
pool.on("error", (err) => {
    console.error("[PG] Unexpected error on idle client:", err);
});
class GoldneezService {
    /**
     * Obtener puntos de recompensas de un cliente
     */
    static async getPoints(customerId) {
        const client = await pool.connect();
        try {
            await client.query("SET search_path TO goldneez, public;");
            const { rows } = await client.query("SELECT COALESCE(SUM(points), 0)::int AS total FROM goldneez.points WHERE customer_id = $1", [customerId]);
            return rows[0]?.total ?? 0;
        }
        finally {
            client.release();
        }
    }
    /**
     * Canjear recompensa y registrar en base de datos
     */
    static async redeemReward(customerId, rewardId, pointsCost) {
        const txId = crypto_1.default.randomUUID();
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query("SET search_path TO goldneez, public;");
            await client.query("INSERT INTO goldneez.redemptions (id, customer_id, reward_id, points_cost, created_at) VALUES ($1,$2,$3,$4,NOW())", [txId, customerId, rewardId, pointsCost]);
            await client.query("INSERT INTO goldneez.points (customer_id, points, reason, created_at) VALUES ($1,$2,$3,NOW())", [customerId, -pointsCost, `Redemption: ${rewardId}`]);
            await client.query("COMMIT");
            console.log(`[goldneez-rewards] Redemption registered: txId=${txId} customerId=${customerId} rewardId=${rewardId}`);
            return { success: true, txId };
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
}
exports.GoldneezService = GoldneezService;
//# sourceMappingURL=goldneez.service.js.map