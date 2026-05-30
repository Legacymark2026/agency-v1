import Redis from "ioredis";
import { prisma, Prisma } from "@agency/database";
import { EventBus, EventPayload } from "@agency/events";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(redisUrl, "@agency/affiliate-service");

export function startEventConsumers() {
  console.log("📡 Starting affiliate event consumers...");

  // 1. Consumidor: Registro asíncrono de clics
  eventBus.subscribe("affiliate.click_registered", async (payload: EventPayload) => {
    const { code, ip, userAgent, referer } = payload.data as {
      code: string;
      ip: string;
      userAgent: string;
      referer?: string;
    };

    console.log(`[EventConsumer] Registering click for code: ${code}, IP: ${ip}`);

    try {
      await (prisma as any).click.create({
        data: {
          affiliateCode: code,
          ip,
          userAgent,
          referer: referer || null
        }
      });
      console.log(`[EventConsumer] Click successfully recorded in DB for code: ${code}`);
    } catch (err) {
      console.error(`[EventConsumer] Failed to write click to DB:`, err);
      // Lanzamos el error para que el EventBus reintente o mande a DLQ
      throw err;
    }
  }).catch(err => console.error("[EventConsumer] Click registration subscription failed:", err));

  // 2. Consumidor: order.completed (Atribución e Idempotencia de Comisión)
  eventBus.subscribe("order.completed", async (payload: EventPayload) => {
    const { orderId, id, userId, amount, orderAmount, affiliateCode } = payload.data as {
      orderId?: string;
      id?: string;
      userId: string;
      amount?: number;
      orderAmount?: number;
      affiliateCode?: string;
    };

    const actualOrderId = orderId || id;
    const actualAmount = orderAmount || amount;

    if (!actualOrderId || !userId || actualAmount === undefined) {
      console.error("[EventConsumer] Missing fields in order.completed payload:", payload.data);
      return;
    }

    if (!affiliateCode) {
      console.log(`[EventConsumer] Order ${actualOrderId} completed without affiliate tracking code. Skipping.`);
      return;
    }

    try {
      // A. Idempotencia: Verificar si esta orden ya generó una comisión
      const existingReferral = await (prisma as any).referral.findUnique({
        where: { orderId: actualOrderId }
      });

      if (existingReferral) {
        console.warn(`[EventConsumer] Duplicate processing skipped. Order ${actualOrderId} already has a referral record.`);
        return; // Idempotencia exitosa, se ignora el evento duplicado
      }

      // B. Buscar perfil del afiliado y su plan de comisión
      const affiliate = await (prisma as any).affiliateProfile.findUnique({
        where: { code: affiliateCode },
        include: { commissionPlan: true }
      });

      if (!affiliate || affiliate.status !== "ACTIVE") {
        console.warn(`[EventConsumer] Affiliate code ${affiliateCode} is invalid or inactive. Commission skipped.`);
        return;
      }

      // C. Prevención de Auto-Afiliación (Self-Referral Check)
      // Si el comprador es el dueño del enlace, bloqueamos la comisión cambiándola a REJECTED
      const isSelfReferral = affiliate.userId === userId;
      const status = isSelfReferral ? "REJECTED" : "PENDING";
      const notes = isSelfReferral ? "Auto-afiliación bloqueada por seguridad" : undefined;

      // D. Cálculo preciso usando decimales para evitar floating point errors
      const plan = affiliate.commissionPlan;
      const orderAmountDecimal = new Prisma.Decimal(actualAmount);
      const planValueDecimal = new Prisma.Decimal(plan.value);
      
      let commissionAmountDecimal = new Prisma.Decimal(0);

      if (!isSelfReferral) {
        if (plan.type === "FIXED") {
          commissionAmountDecimal = planValueDecimal;
        } else if (plan.type === "PERCENTAGE") {
          // formula: orderAmount * (planValue / 100)
          commissionAmountDecimal = orderAmountDecimal.mul(planValueDecimal).div(new Prisma.Decimal(100));
        }
      }

      console.log(`[EventConsumer] Processing referral for affiliate ${affiliate.id}: status=${status}, orderAmount=${orderAmountDecimal}, commissionAmount=${commissionAmountDecimal}`);

      // E. Guardar en Base de Datos
      await (prisma as any).referral.create({
        data: {
          affiliateId: affiliate.id,
          referredUserId: userId,
          orderId: actualOrderId,
          orderAmount: orderAmountDecimal,
          commissionAmount: commissionAmountDecimal,
          status: status
          // Si guardamos notas, podríamos mapearlo a una columna de notas si existiera,
          // por ahora solo limitamos a los campos de base de datos definidos
        }
      });

      console.log(`[EventConsumer] Referral created successfully for order ${actualOrderId}`);
    } catch (err) {
      console.error(`[EventConsumer] Error attributing commission for order ${actualOrderId}:`, err);
      throw err; // El EventBus se encargará de reintentar
    }
  }).catch(err => console.error("[EventConsumer] order.completed subscription failed:", err));

  // 3. Consumidor: order.refunded (Reversión de Comisión)
  eventBus.subscribe("order.refunded", async (payload: EventPayload) => {
    const { orderId, id } = payload.data as { orderId?: string; id?: string };
    const actualOrderId = orderId || id;

    if (!actualOrderId) {
      console.error("[EventConsumer] Missing orderId in order.refunded payload:", payload.data);
      return;
    }

    try {
      const referral = await (prisma as any).referral.findUnique({
        where: { orderId: actualOrderId }
      });

      if (!referral) {
        console.log(`[EventConsumer] No referral found for refunded order: ${actualOrderId}. Skipping.`);
        return;
      }

      if (referral.status !== "PENDING") {
        console.warn(`[EventConsumer] Referral status is ${referral.status} for order ${actualOrderId}. Cannot refund commission.`);
        return;
      }

      // Revertir la comisión pasándola a REJECTED
      await (prisma as any).referral.update({
        where: { orderId: actualOrderId },
        data: { status: "REJECTED" }
      });

      console.log(`[EventConsumer] Commission for order ${actualOrderId} has been REJECTED due to refund.`);
    } catch (err) {
      console.error(`[EventConsumer] Error reverting commission for order ${actualOrderId}:`, err);
      throw err;
    }
  }).catch(err => console.error("[EventConsumer] order.refunded subscription failed:", err));
}
