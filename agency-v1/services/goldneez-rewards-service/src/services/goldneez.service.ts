import { Pool } from "pg";
import crypto from "crypto";
import { EventBus } from "@agency/events";

const GOLDNEEZ_DB_URL = process.env.GOLDNEEZ_DB_URL || "postgresql://legacyuser:legacypass@localhost:5432/legacymark?schema=goldneez&search_path=goldneez,public";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "goldneez-rewards-service");

const pool = new Pool({
  connectionString: GOLDNEEZ_DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("connect", (client) => {
  client.query("SET search_path TO goldneez, public;").catch(err =>
    console.error("[PG] search_path set error:", err)
  );
});
pool.on("error", (err) => {
  console.error("[PG] Unexpected error on idle client:", err);
});

export class GoldneezService {
  /**
   * Obtener puntos de recompensas de un cliente
   */
  static async getPoints(customerId: string): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query("SET search_path TO goldneez, public;");
      const { rows } = await client.query(
        "SELECT COALESCE(SUM(points), 0)::int AS total FROM goldneez.points WHERE customer_id = $1",
        [customerId]
      );
      return rows[0]?.total ?? 0;
    } finally {
      client.release();
    }
  }

  /**
   * Canjear recompensa y emitir evento
   */
  static async redeemReward(customerId: string, rewardId: string, pointsCost: number) {
    const txId = crypto.randomUUID();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET search_path TO goldneez, public;");
      await client.query(
        "INSERT INTO goldneez.redemptions (id, customer_id, reward_id, points_cost, created_at) VALUES ($1,$2,$3,$4,NOW())",
        [txId, customerId, rewardId, pointsCost]
      );
      await client.query(
        "INSERT INTO goldneez.points (customer_id, points, reason, created_at) VALUES ($1,$2,$3,NOW())",
        [customerId, -pointsCost, `Redemption: ${rewardId}`]
      );
      await client.query("COMMIT");

      await eventBus.publish("rewards.redeemed", {
        txId,
        customerId,
        rewardId,
        pointsCost,
        timestamp: new Date().toISOString()
      });

      return { success: true, txId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
