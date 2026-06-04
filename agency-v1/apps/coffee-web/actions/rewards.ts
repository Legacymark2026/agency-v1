"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

const REWARDS_CATALOG = [
  { id: "rwd-001", title: "Bolsa de Café de Especialidad (250g)", cost: 1000, desc: "Canjea cualquier origen de nuestra carta en presentación de 250g." },
  { id: "rwd-002", title: "Mug de Cerámica Goldneez", cost: 800, desc: "Mug hecho a mano por artesanos locales con acabado dorado." },
  { id: "rwd-003", title: "Molino Manual Hario Slim", cost: 3000, desc: "Molino de muelas cerámicas portátil para una molienda fresca." },
  { id: "rwd-004", title: "Taller Privado de Barismo (1h)", cost: 5000, desc: "Clase uno a uno con nuestro Head Barista para perfeccionar tu filtrado." }
];

export async function getRewardsCatalogAction() {
  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/rewards`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getRewardsCatalogAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    let rewards = await prisma.goldneezReward.findMany({
      where: { isActive: true },
      orderBy: { cost: "asc" }
    });

    if (rewards.length === 0) {
      console.log("[rewardsAction] Sembrando premios locales en la base de datos...");
      await prisma.goldneezReward.createMany({
        data: REWARDS_CATALOG.map(r => ({
          id: r.id,
          title: r.title,
          cost: r.cost,
          description: r.desc,
          isActive: true
        }))
      });
      rewards = await prisma.goldneezReward.findMany({
        where: { isActive: true },
        orderBy: { cost: "asc" }
      });
    }

    return rewards.map(r => ({
      id: r.id,
      title: r.title,
      cost: r.cost,
      desc: r.description
    }));
  } catch (err) {
    console.error("[getRewardsCatalogAction] Error en base de datos:", err);
    return REWARDS_CATALOG;
  }
}

export async function getPointsHistoryAction() {
  const me = await getMeAction();
  if (!me) return { points: 0, tier: "Silver", history: [] };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/points/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getPointsHistoryAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: me.id },
    });

    let points = 500;
    let registeredAt = new Date().toLocaleDateString();
    let city = "";
    if (userProfile && userProfile.metadata) {
      try {
        const meta = typeof userProfile.metadata === "string"
          ? JSON.parse(userProfile.metadata)
          : userProfile.metadata as any;
        points = meta.points ?? 500;
        registeredAt = meta.registeredAt ?? registeredAt;
        city = meta.city ?? "";
      } catch (e) {}
    }

    const history = await prisma.goldneezPointsHistory.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
    });

    let tier = "Silver";
    if (points >= 3000) {
      tier = "Platinum";
    } else if (points >= 1000) {
      tier = "Gold";
    }

    return { points, tier, history };
  } catch (err) {
    console.error("[getPointsHistoryAction] Error en base de datos:", err);
    return { points: 0, tier: "Silver", history: [] };
  }
}

export async function addPointsAction(puntos: number, concepto: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/points/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, puntos, concepto }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[addPointsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: me.id },
    });

    let points = 500;
    let registeredAt = new Date().toLocaleDateString();
    let city = "";
    if (userProfile && userProfile.metadata) {
      try {
        const meta = typeof userProfile.metadata === "string"
          ? JSON.parse(userProfile.metadata)
          : userProfile.metadata as any;
        points = meta.points ?? 500;
        registeredAt = meta.registeredAt ?? registeredAt;
        city = meta.city ?? "";
      } catch (e) {}
    }

    const newPoints = points + puntos;

    // Actualizar perfil
    await prisma.userProfile.update({
      where: { userId: me.id },
      data: {
        metadata: JSON.stringify({ points: newPoints, registeredAt, city }),
      },
    });

    // Registrar en historial
    await prisma.goldneezPointsHistory.create({
      data: {
        userId: me.id,
        puntos,
        tipo: "earned",
        concepto,
      },
    });

    return { success: true, points: newPoints };
  } catch (err: any) {
    console.error("[addPointsAction] Error en base de datos:", err);
    return { error: err.message };
  }
}

export async function redeemRewardAction(puntosRequeridos: number, concepto: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/points/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, puntosRequeridos, concepto }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[redeemRewardAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: me.id },
    });

    let points = 500;
    let registeredAt = new Date().toLocaleDateString();
    let city = "";
    if (userProfile && userProfile.metadata) {
      try {
        const meta = typeof userProfile.metadata === "string"
          ? JSON.parse(userProfile.metadata)
          : userProfile.metadata as any;
        points = meta.points ?? 500;
        registeredAt = meta.registeredAt ?? registeredAt;
        city = meta.city ?? "";
      } catch (e) {}
    }

    if (points < puntosRequeridos) {
      return { error: "Puntos insuficientes." };
    }

    const newPoints = points - puntosRequeridos;

    // Actualizar perfil
    await prisma.userProfile.update({
      where: { userId: me.id },
      data: {
        metadata: JSON.stringify({ points: newPoints, registeredAt, city }),
      },
    });

    // Registrar en historial
    await prisma.goldneezPointsHistory.create({
      data: {
        userId: me.id,
        puntos: -puntosRequeridos,
        tipo: "redeemed",
        concepto,
      },
    });

    return { success: true, points: newPoints };
  } catch (err: any) {
    console.error("[redeemRewardAction] Error en base de datos:", err);
    return { error: err.message };
  }
}

export async function getMonthlyConsumptionAction() {
  const me = await getMeAction();
  if (!me) return [];

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/consumption/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getMonthlyConsumptionAction] Fallback local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const logs = await prisma.userActivityLog.findMany({
      where: { userId: me.id, action: "CHECKOUT_SUCCESS" },
      orderBy: { createdAt: "asc" }
    });

    const consumptionMap: Record<string, number> = months.reduce((acc, m) => {
      acc[m] = 0;
      return acc;
    }, {} as Record<string, number>);

    for (const log of logs) {
      try {
        const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details as any;
        const date = new Date(log.createdAt);
        const monthName = months[date.getMonth()];

        if (details && details.items) {
          for (const item of details.items) {
            const match = String(item.size || "").match(/\d+/);
            if (match) {
              const grams = parseInt(match[0], 10);
              const qty = parseInt(item.quantity || "1", 10);
              consumptionMap[monthName] += grams * qty;
            }
          }
        }
      } catch (e) {}
    }

    return months.map((m) => ({
      month: m,
      grams: consumptionMap[m],
    }));
  } catch (err) {
    console.error("[getMonthlyConsumptionAction] Error en base de datos:", err);
    return months.map(m => ({ month: m, grams: 0 }));
  }
}
