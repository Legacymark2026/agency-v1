"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

export async function getReferralStatsAction() {
  const me = await getMeAction();
  if (!me) return { codigo: "", referredCount: 0, pointsEarned: 0 };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/referrals/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getReferralStatsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    // Buscar código del usuario
    let referral = await prisma.goldneezReferral.findFirst({
      where: { referrerId: me.id },
    });

    let codigo = "";
    if (referral) {
      codigo = referral.codigo;
    } else {
      // Generar código aleatorio
      codigo = `GOLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await prisma.goldneezReferral.create({
        data: {
          referrerId: me.id,
          codigo,
          estado: "pending",
        },
      });
    }

    const count = await prisma.goldneezReferral.count({
      where: { referrerId: me.id, estado: "completed" },
    });

    const pointsEarned = count * 200;

    return { codigo, referredCount: count, pointsEarned };
  } catch (err) {
    console.error("[getReferralStatsAction] Error en base de datos:", err);
    return { codigo: "", referredCount: 0, pointsEarned: 0 };
  }
}

export async function applyReferralCodeAction(codigo: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  const codigoTrim = codigo.trim().toUpperCase();

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/referrals/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, codigo: codigoTrim }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const errorData = await res.json();
      return { error: errorData.error || "Error al aplicar código" };
    }
  } catch (err: any) {
    console.warn("[applyReferralCodeAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    // Buscar código de referido
    const referralRecord = await prisma.goldneezReferral.findFirst({
      where: { codigo: codigoTrim },
    });

    if (!referralRecord) {
      return { error: "Código de referido inválido." };
    }

    const referrerId = referralRecord.referrerId;

    if (referrerId === me.id) {
      return { error: "No puedes aplicar tu propio código." };
    }

    // Verificar que el usuario no haya sido referido previamente
    const alreadyReferred = await prisma.goldneezReferral.findFirst({
      where: { referredId: me.id },
    });

    if (alreadyReferred) {
      return { error: "Ya has aplicado un código de referido anteriormente." };
    }

    // Registrar aplicación completada
    await prisma.goldneezReferral.create({
      data: {
        referrerId,
        referredId: me.id,
        codigo: codigoTrim,
        estado: "completed",
        puntosReferente: 200,
        puntosReferido: 100,
      },
    });

    // Otorgar 100 puntos al referido (usuario actual)
    const meProfile = await prisma.userProfile.findUnique({
      where: { userId: me.id },
    });
    let mePoints = 500, meReg = new Date().toLocaleDateString(), meCity = "";
    if (meProfile && meProfile.metadata) {
      try {
        const m = typeof meProfile.metadata === "string" ? JSON.parse(meProfile.metadata) : meProfile.metadata as any;
        mePoints = m.points ?? 500;
        meReg = m.registeredAt ?? meReg;
        meCity = m.city ?? "";
      } catch (e) {}
    }
    await prisma.userProfile.update({
      where: { userId: me.id },
      data: {
        metadata: JSON.stringify({ points: mePoints + 100, registeredAt: meReg, city: meCity }),
      },
    });
    await prisma.goldneezPointsHistory.create({
      data: {
        userId: me.id,
        puntos: 100,
        tipo: "earned",
        concepto: `Código de referido aplicado (${codigoTrim})`,
      },
    });

    // Otorgar 200 puntos al referente
    const referrerProfile = await prisma.userProfile.findUnique({
      where: { userId: referrerId },
    });
    let refPoints = 500, refReg = new Date().toLocaleDateString(), refCity = "";
    if (referrerProfile && referrerProfile.metadata) {
      try {
        const m = typeof referrerProfile.metadata === "string" ? JSON.parse(referrerProfile.metadata) : referrerProfile.metadata as any;
        refPoints = m.points ?? 500;
        refReg = m.registeredAt ?? refReg;
        refCity = m.city ?? "";
      } catch (e) {}
    }
    await prisma.userProfile.update({
      where: { userId: referrerId },
      data: {
        metadata: JSON.stringify({ points: refPoints + 200, registeredAt: refReg, city: refCity }),
      },
    });
    await prisma.goldneezPointsHistory.create({
      data: {
        userId: referrerId,
        puntos: 200,
        tipo: "earned",
        concepto: `Amigo referido se ha registrado (${codigoTrim})`,
      },
    });

    return { success: true, pointsEarned: 100 };
  } catch (err: any) {
    console.error("[applyReferralCodeAction] Error en base de datos:", err);
    return { error: err.message };
  }
}
