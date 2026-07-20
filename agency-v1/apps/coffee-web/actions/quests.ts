"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";
import { addPointsAction } from "./rewards";
import { getUserOrdersAction } from "./checkout";

export interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  progressText?: string;
  isClaimable?: boolean;
}

export async function getQuestsAction(): Promise<Quest[]> {
  const me = await getMeAction();
  if (!me) return [];

  const defaultQuests = [
    {
      id: "perfect-cup",
      title: "La Taza Perfecta",
      description: "Usa el temporizador de extracción completo en tu panel por primera vez.",
      points: 100,
    },
    {
      id: "coffee-critic",
      title: "Crítico de Café",
      description: "Deja tu primera valoración o reseña sobre algún grano que hayas comprado.",
      points: 150,
    },
    {
      id: "origin-hunter",
      title: "Cazador de Orígenes",
      description: "Prueba la variedad del mundo: compra cafés de 3 orígenes continentales diferentes (África, Sudamérica, Centroamérica, Asia).",
      points: 250,
    },
    {
      id: "social-barista",
      title: "Barista Social",
      description: "Aplica el código de referido de un amigo o comparte el tuyo.",
      points: 100,
    }
  ];

  try {
    // 1. Obtener el historial de puntos para ver cuáles misiones ya están registradas como completadas
    const history = await prisma.goldneezPointsHistory.findMany({
      where: {
        userId: me.id,
        concepto: { startsWith: "Misión Completada:" },
      },
    });

    const completedQuestsTitles = history.map((h) => {
      const match = h.concepto.match(/Misión Completada: (.*)/);
      return match ? match[1] : "";
    });

    // 2. Lógica dinámica para la misión "Cazador de Orígenes"
    const orders = await getUserOrdersAction();
    const boughtCoffeeIds = orders.map((o) => o.coffeeId).filter((id) => id && id !== "unknown");
    
    const continents = new Set<string>();
    boughtCoffeeIds.forEach((id) => {
      if (id === "ethiopia-yirgacheffe" || id === "kenya-aa") continents.add("África");
      if (id === "colombia-huila" || id === "brasil-cerrado" || id === "signature-blend") continents.add("Sudamérica");
      if (id === "panama-geisha" || id === "costa-rica") continents.add("Centroamérica");
      if (id === "sumatra-mandheling") continents.add("Asia");
    });

    const continentsList = Array.from(continents);
    const hasOriginHunter = completedQuestsTitles.includes("Cazador de Orígenes");
    
    // Si cumple el criterio pero no se ha registrado, lo marcamos como listo para reclamar (o lo auto-completamos)
    const originHunterEligible = continents.size >= 3;

    // 3. Mapear misiones
    return defaultQuests.map((q) => {
      let completed = completedQuestsTitles.includes(q.title);
      let progressText = "";
      let isClaimable = false;

      if (q.id === "origin-hunter") {
        if (completed) {
          progressText = "¡Completado! Orígenes probados: " + continentsList.join(", ");
        } else {
          progressText = `${continents.size}/3 continentes probados (${continentsList.join(", ") || "ninguno"})`;
          if (originHunterEligible) {
            isClaimable = true;
          }
        }
      }

      if (q.id === "social-barista" && !completed) {
        // Verificar si el usuario ha aplicado un código de referido o tiene referidos reales
        // Revisamos en su perfil si tiene historial de referidos
        const hasReferrals = history.some(h => h.concepto.toLowerCase().includes("referido"));
        if (hasReferrals) {
          isClaimable = true;
        }
      }

      return {
        ...q,
        completed,
        progressText,
        isClaimable,
      };
    });
  } catch (err) {
    console.error("[getQuestsAction] Error cargando misiones:", err);
    return defaultQuests.map((q) => ({ ...q, completed: false }));
  }
}

export async function completeQuestAction(questId: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  const questsMap = {
    "perfect-cup": { title: "La Taza Perfecta", points: 100 },
    "coffee-critic": { title: "Crítico de Café", points: 150 },
    "origin-hunter": { title: "Cazador de Orígenes", points: 250 },
    "social-barista": { title: "Barista Social", points: 100 },
  };

  const quest = questsMap[questId as keyof typeof questsMap];
  if (!quest) return { error: "Misión no válida" };

  try {
    // Verificar si ya está completada
    const existing = await prisma.goldneezPointsHistory.findFirst({
      where: {
        userId: me.id,
        concepto: `Misión Completada: ${quest.title}`,
      },
    });

    if (existing) {
      return { success: false, message: "Misión ya completada anteriormente." };
    }

    // Agregar puntos
    const res = await addPointsAction(quest.points, `Misión Completada: ${quest.title}`);
    if (res.error) {
      return { error: res.error };
    }

    return { success: true, points: res.points };
  } catch (err: any) {
    console.error(`[completeQuestAction] Error al completar misión ${questId}:`, err);
    return { error: err.message };
  }
}
