"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

export async function getPaymentMethodsAction() {
  const me = await getMeAction();
  if (!me) return [];

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/payment-methods/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getPaymentMethodsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    return await prisma.goldneezPaymentMethod.findMany({
      where: { userId: me.id },
      orderBy: [
        { esPredeterminada: "desc" },
        { createdAt: "desc" },
      ],
    });
  } catch (err) {
    console.error("[getPaymentMethodsAction] Error en base de datos:", err);
    return [];
  }
}

export async function addPaymentMethodAction(marca: string, ultimosCuatro: string, nombreTarjeta: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/payment-methods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, marca, ultimosCuatro, nombreTarjeta }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[addPaymentMethodAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const existing = await prisma.goldneezPaymentMethod.findFirst({
      where: { userId: me.id },
    });
    const esPredeterminada = !existing;

    const method = await prisma.goldneezPaymentMethod.create({
      data: {
        userId: me.id,
        marca,
        ultimosCuatro,
        nombreTarjeta,
        token: `tok_${Math.random().toString(36).substring(7)}`,
        esPredeterminada,
      },
    });

    return { success: true, methodId: method.id };
  } catch (err: any) {
    console.error("[addPaymentMethodAction] Error en base de datos:", err);
    return { error: err.message };
  }
}

export async function deletePaymentMethodAction(methodId: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/payment-methods/${me.id}/${methodId}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[deletePaymentMethodAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    await prisma.goldneezPaymentMethod.delete({
      where: { id: methodId, userId: me.id },
    });
    return { success: true };
  } catch (err: any) {
    console.error("[deletePaymentMethodAction] Error en base de datos:", err);
    return { error: err.message };
  }
}
