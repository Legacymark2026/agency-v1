"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

export async function getNotificationPrefsAction() {
  const me = await getMeAction();
  if (!me) return { promociones: true, pedidos: true, clubPuntos: true, boletines: true };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/notifications/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getNotificationPrefsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const prefs = await prisma.goldneezNotificationPreference.findUnique({
      where: { userId: me.id },
    });

    if (!prefs) {
      return { promociones: true, pedidos: true, clubPuntos: true, boletines: true };
    }

    return {
      promociones: prefs.promociones,
      pedidos: prefs.pedidos,
      clubPuntos: prefs.clubPuntos,
      boletines: prefs.boletines,
    };
  } catch (err) {
    console.error("[getNotificationPrefsAction] Error en base de datos:", err);
    return { promociones: true, pedidos: true, clubPuntos: true, boletines: true };
  }
}

export async function updateNotificationPrefsAction(prefs: {
  promociones: boolean;
  pedidos: boolean;
  clubPuntos: boolean;
  boletines: boolean;
}) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, ...prefs }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[updateNotificationPrefsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    await prisma.goldneezNotificationPreference.upsert({
      where: { userId: me.id },
      create: {
        userId: me.id,
        promociones: prefs.promociones,
        pedidos: prefs.pedidos,
        clubPuntos: prefs.clubPuntos,
        boletines: prefs.boletines,
      },
      update: {
        promociones: prefs.promociones,
        pedidos: prefs.pedidos,
        clubPuntos: prefs.clubPuntos,
        boletines: prefs.boletines,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("[updateNotificationPrefsAction] Error en base de datos:", err);
    return { error: err.message };
  }
}
