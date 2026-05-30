"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPayout = processPayout;
const ioredis_1 = __importDefault(require("ioredis"));
const database_1 = require("@agency/database");
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: 3 });
redis.on("error", (err) => console.error("[PayoutController] Redis error:", err));
async function processPayout(req, res) {
    const idempotencyKey = req.headers["x-idempotency-key"];
    if (!idempotencyKey || typeof idempotencyKey !== "string") {
        return res.status(400).json({ error: "X-Idempotency-Key header is required" });
    }
    const { affiliateId, amount, referralIds } = req.body;
    if (!affiliateId || !amount || !Array.isArray(referralIds) || referralIds.length === 0) {
        return res.status(400).json({ error: "Missing required fields: affiliateId, amount, and referralIds" });
    }
    const cacheKey = `idempotency:payout:${idempotencyKey}`;
    try {
        // 1. Verificar si la llave de idempotencia ya fue procesada en Redis
        const cachedResponse = await redis.get(cacheKey);
        if (cachedResponse) {
            console.log(`[PayoutController] Idempotency hit! Returning cached result for key: ${idempotencyKey}`);
            return res.status(200).json(JSON.parse(cachedResponse));
        }
        // 2. Procesar Payout de forma transaccional en PostgreSQL
        // Consistencia ACID: evitamos race conditions bloqueando/actualizando registros asociados
        const payoutResult = await database_1.prisma.$transaction(async (tx) => {
            // Validar que las comisiones/referidos pertenezcan al afiliado y estén en APPROVED
            const referrals = await tx.referral.findMany({
                where: {
                    id: { in: referralIds },
                    affiliateId,
                    status: "APPROVED"
                }
            });
            if (referrals.length !== referralIds.length) {
                throw new Error("One or more referrals are not in APPROVED state or do not belong to the affiliate");
            }
            // Validar la suma de comisiones coincide con el monto solicitado
            const calculatedSum = referrals.reduce((sum, ref) => {
                return sum + Number(ref.commissionAmount);
            }, 0);
            // Admitimos tolerancia de decimales
            if (Math.abs(calculatedSum - Number(amount)) > 0.01) {
                throw new Error(`Calculated commission sum (${calculatedSum}) does not match requested amount (${amount})`);
            }
            // Crear el Payout consolidado
            const payout = await tx.payout.create({
                data: {
                    affiliateId,
                    amount: new database_1.Prisma.Decimal(amount),
                    status: "PAID", // O PROCESSING si se comunica asíncronamente con Stripe/etc.
                    paidAt: new Date()
                }
            });
            // Vincular referidos al payout y cambiar su estado a PAID
            await tx.referral.updateMany({
                where: {
                    id: { in: referralIds }
                },
                data: {
                    status: "PAID",
                    payoutId: payout.id
                }
            });
            return payout;
        });
        const successResponse = {
            success: true,
            payoutId: payoutResult.id,
            amount: payoutResult.amount,
            status: payoutResult.status,
            paidAt: payoutResult.paidAt,
            message: "Payout processed and consolidated successfully"
        };
        // 3. Guardar el resultado en Redis por 24 horas para garantizar la idempotencia
        await redis.set(cacheKey, JSON.stringify(successResponse), "EX", 86400);
        return res.status(201).json(successResponse);
    }
    catch (error) {
        console.error("[PayoutController] Error processing payout:", error);
        return res.status(500).json({ error: error.message || "Failed to process payout" });
    }
}
//# sourceMappingURL=payout.controller.js.map