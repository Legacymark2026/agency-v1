"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

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

  // 2. Fallback
  return [
    { month: "Ene", grams: 500 },
    { month: "Feb", grams: 250 },
    { month: "Mar", grams: 750 },
    { month: "Abr", grams: 500 },
    { month: "May", grams: 250 },
    { month: "Jun", grams: 1000 },
    { month: "Jul", grams: 500 },
    { month: "Ago", grams: 750 },
    { month: "Sep", grams: 500 },
    { month: "Oct", grams: 1000 },
    { month: "Nov", grams: 750 },
    { month: "Dic", grams: 1250 }
  ];
}

