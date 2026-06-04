"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

const DEFAULT_STEPS = [
  { label: "Procesado", status: "completed", desc: "Tu pedido ha sido recibido y confirmado.", date: "1 hora" },
  { label: "Tostado", status: "completed", desc: "Granos tostados artesanalmente en pequeños lotes.", date: "2 horas" },
  { label: "Empacado", status: "current", desc: "Sellado al vacío con válvula desgasificadora.", date: "En proceso" },
  { label: "Enviado", status: "upcoming", desc: "En manos de la transportadora asociada.", date: "Por programar" },
  { label: "Entregado", status: "upcoming", desc: "Listo para crear recuerdos dorados en tu taza.", date: "Por programar" }
];

export async function getShippingTrackingAction(orderId: string) {
  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/shipping-tracking/${orderId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getShippingTrackingAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB (dinámico y real basado en la fecha de la orden)
  try {
    const shortId = orderId.replace("GDN-", "").toLowerCase();
    const deal = await prisma.deal.findFirst({
      where: {
        id: {
          startsWith: shortId
        }
      }
    });

    const createdAt = deal ? deal.createdAt : new Date();
    const timeDiffMs = Date.now() - createdAt.getTime();

    const stepsConfig = [
      { label: "Procesado", desc: "Tu pedido ha sido recibido y confirmado.", minMs: 0, currentMaxMs: 5 * 60 * 1000 },
      { label: "Tostado", desc: "Granos tostados artesanalmente en pequeños lotes.", minMs: 5 * 60 * 1000, currentMaxMs: 30 * 60 * 1000 },
      { label: "Empacado", desc: "Sellado al vacío con válvula desgasificadora.", minMs: 30 * 60 * 1000, currentMaxMs: 2 * 60 * 60 * 1000 },
      { label: "Enviado", desc: "En manos de la transportadora asociada.", minMs: 2 * 60 * 60 * 1000, currentMaxMs: 12 * 60 * 60 * 1000 },
      { label: "Entregado", desc: "Listo para crear recuerdos dorados en tu taza.", minMs: 12 * 60 * 60 * 1000, currentMaxMs: 24 * 60 * 60 * 1000 }
    ];

    const computedSteps = stepsConfig.map((config, idx) => {
      let status = "upcoming";
      let date = "Por programar";

      if (timeDiffMs > config.currentMaxMs) {
        status = "completed";
        const completionTime = new Date(createdAt.getTime() + config.currentMaxMs);
        date = completionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + completionTime.toLocaleDateString();
      } else if (timeDiffMs >= config.minMs && timeDiffMs <= config.currentMaxMs) {
        status = "current";
        date = "En proceso";
      }

      return {
        stepIndex: idx,
        label: config.label,
        status,
        desc: config.desc,
        date
      };
    });

    // Guardar/Actualizar en base de datos para que queden persistidos
    for (const step of computedSteps) {
      await prisma.goldneezShippingStep.upsert({
        where: {
          orderId_stepIndex: {
            orderId,
            stepIndex: step.stepIndex
          }
        },
        create: {
          orderId,
          stepIndex: step.stepIndex,
          label: step.label,
          status: step.status,
          desc: step.desc,
          date: step.date
        },
        update: {
          status: step.status,
          date: step.date
        }
      });
    }

    return {
      orderId,
      steps: computedSteps
    };
  } catch (err) {
    console.error("[getShippingTrackingAction] Error en base de datos:", err);
    return { orderId, steps: DEFAULT_STEPS };
  }
}
