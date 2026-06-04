"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

export async function getFlavorProfileAction() {
  const me = await getMeAction();
  if (!me) return null;

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/flavor-profile/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getFlavorProfileAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    return await prisma.goldneezFlavorProfile.findUnique({
      where: { userId: me.id },
    });
  } catch (err) {
    console.error("[getFlavorProfileAction] Error en base de datos:", err);
    return null;
  }
}

export async function saveFlavorProfileAction(acidez: number, cuerpo: number, notas: string, metodoPreferido: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/flavor-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, acidez, cuerpo, notas, metodoPreferido }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[saveFlavorProfileAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    // Calcular recomendaciones
    const acidezNum = Number(acidez);
    const cuerpoNum = Number(cuerpo);
    let recs: string[] = [];

    if (acidezNum >= 4 && cuerpoNum <= 3) {
      recs = ["ethiopia-yirgacheffe", "panama-geisha"];
    } else if (cuerpoNum >= 4) {
      recs = ["sumatra-mandheling", "brasil-cerrado", "kenya-aa"];
    } else {
      recs = ["colombia-huila", "signature-blend", "costa-rica"];
    }

    const recomendaciones = recs.join(",");

    await prisma.goldneezFlavorProfile.upsert({
      where: { userId: me.id },
      create: {
        userId: me.id,
        acidez: acidezNum,
        cuerpo: cuerpoNum,
        notas,
        metodoPreferido,
        recomendaciones,
      },
      update: {
        acidez: acidezNum,
        cuerpo: cuerpoNum,
        notas,
        metodoPreferido,
        recomendaciones,
      },
    });

    return { success: true, recommendations: recs };
  } catch (err: any) {
    console.error("[saveFlavorProfileAction] Error en base de datos:", err);
    return { error: err.message };
  }
}
