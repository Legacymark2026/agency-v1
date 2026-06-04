"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

export async function getSubscriptionAction() {
  const me = await getMeAction();
  if (!me) return null;

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/subscription/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getSubscriptionAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: me.id },
    });

    if (profile && profile.preferences) {
      const prefs = typeof profile.preferences === "string" 
        ? JSON.parse(profile.preferences) 
        : profile.preferences as any;
      if (prefs.subscription) {
        return prefs.subscription;
      }
    }

    // Suscripción por defecto si no existe
    const defaultSub = {
      beans: "signature-blend",
      frequency: "30",
      status: "active",
      nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
    return defaultSub;
  } catch (err) {
    console.error("[getSubscriptionAction] Error en base de datos:", err);
    return null;
  }
}

export async function updateSubscriptionAction(beans: string, frequency: string, status: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  const nextDelivery = new Date(Date.now() + parseInt(frequency) * 24 * 60 * 60 * 1000).toLocaleDateString();
  const subData = { beans, frequency, status, nextDelivery };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, ...subData }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[updateSubscriptionAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: me.id },
    });

    let currentPrefs: any = {};
    if (profile && profile.preferences) {
      currentPrefs = typeof profile.preferences === "string"
        ? JSON.parse(profile.preferences)
        : profile.preferences;
    }

    const updatedPrefs = {
      ...currentPrefs,
      subscription: subData
    };

    await prisma.userProfile.update({
      where: { userId: me.id },
      data: {
        preferences: JSON.stringify(updatedPrefs)
      }
    });

    return { success: true, subscription: subData };
  } catch (err: any) {
    console.error("[updateSubscriptionAction] Error en base de datos:", err);
    return { error: err.message };
  }
}
