"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";
import { completeQuestAction } from "./quests";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

export async function getProductReviewsAction(coffeeId: string) {
  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/reviews/${coffeeId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getProductReviewsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    return await prisma.goldneezProductReview.findMany({
      where: { coffeeId },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("[getProductReviewsAction] Error en base de datos:", err);
    return [];
  }
}

export async function submitReviewAction(
  orderId: string,
  coffeeId: string,
  coffeeName: string,
  calificacion: number,
  comentario: string
) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  const calNum = Number(calificacion);

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, orderId, coffeeId, coffeeName, calificacion: calNum, comentario }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      try {
        await completeQuestAction("coffee-critic");
      } catch {}
      return data;
    }
  } catch (err: any) {
    console.warn("[submitReviewAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const review = await prisma.goldneezProductReview.create({
      data: {
        userId: me.id,
        orderId,
        coffeeId,
        coffeeName,
        calificacion: calNum,
        comentario,
      },
    });

    // Auto-complete the quest Coffee Critic to award 150 points
    try {
      await completeQuestAction("coffee-critic");
    } catch (questErr) {
      console.warn("Fallo al completar misión coffee-critic:", questErr);
    }

    return { success: true, reviewId: review.id };
  } catch (err: any) {
    console.error("[submitReviewAction] Error en base de datos:", err);
    return { error: err.message };
  }
}
