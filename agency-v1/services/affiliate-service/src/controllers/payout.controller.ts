import { Request, Response } from "express";
import Redis from "ioredis";
import { prisma, Prisma } from "@agency/database";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });

redis.on("error", (err) => console.error("[PayoutController] Redis error:", err));

export async function processPayout(req: Request, res: Response) {
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
    const payoutResult = await prisma.$transaction(async (tx) => {
      // Validar que las comisiones/referidos pertenezcan al afiliado y estén en APPROVED
      const referrals = await (tx as any).referral.findMany({
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
      const calculatedSum = referrals.reduce((sum: number, ref: any) => {
        return sum + Number(ref.commissionAmount);
      }, 0);

      // Admitimos tolerancia de decimales
      if (Math.abs(calculatedSum - Number(amount)) > 0.01) {
        throw new Error(`Calculated commission sum (${calculatedSum}) does not match requested amount (${amount})`);
      }

      // Crear el Payout consolidado
      const payout = await (tx as any).payout.create({
        data: {
          affiliateId,
          amount: new Prisma.Decimal(amount),
          status: "PAID", // O PROCESSING si se comunica asíncronamente con Stripe/etc.
          paidAt: new Date()
        }
      });

      // Vincular referidos al payout y cambiar su estado a PAID
      await (tx as any).referral.updateMany({
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

  } catch (error: any) {
    console.error("[PayoutController] Error processing payout:", error);
    return res.status(500).json({ error: error.message || "Failed to process payout" });
  }
}
