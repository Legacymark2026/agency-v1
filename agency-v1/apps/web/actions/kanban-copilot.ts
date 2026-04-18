"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function generateTaskBrief(
  taskTitle: string,
  taskId?: string,
  projectId?: string
): Promise<{ success: boolean; brief?: { description: string; checklist: string[] }; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Optimización 1: Paralelizar consultas a la base de datos (Elimina el Anti-patrón Waterfalling)
    const [cu, project] = await Promise.all([
      prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
      }),
      projectId ? prisma.kanbanProject.findUnique({
        where: { id: projectId },
        select: { name: true, description: true },
      }) : Promise.resolve(null)
    ]);

    if (!cu) return { success: false, error: "No company found" };

    let apiKey = process.env.GEMINI_API_KEY || null;
    const integration = await prisma.integrationConfig.findFirst({
      where: { companyId: cu.companyId, provider: "gemini" },
      select: { config: true },
    });

    if (integration) {
      apiKey = (integration.config as any)?.apiKey || apiKey;
    }
    if (!apiKey) return { success: false, error: "No Gemini API key configured." };

    let projectContext = "";
    if (project) {
        projectContext = `Proyecto: "${project.name}". ${project.description || ""}`;
    }

    const prompt = `Eres un Project Manager senior de una agencia de marketing digital. Tu tarea es redactar un brief profesional y un checklist accionable para la siguiente tarea de Kanban.

${projectContext ? `Contexto del proyecto: ${projectContext}\n` : ""}Nombre de la tarea: "${taskTitle}"

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "description": "Descripción profesional de la tarea en 2-3 párrafos. Qué se debe hacer, por qué es importante y qué resultado se espera. Escribe en español.",
  "checklist": [
    "Paso accionable 1",
    "Paso accionable 2",
    "Paso accionable 3",
    "Paso accionable 4",
    "Paso accionable 5"
  ]
}

La descripción debe ser concreta, orientada a resultados y adecuada para una agencia de marketing digital. El checklist debe tener entre 4 y 7 pasos específicos y verificables. Todo en español.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // Optimización 2: Forzar 'application/json' nativo en Gemini 1.5+ para evitar Regex parsing hacks
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 800,
            responseMimeType: "application/json"
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `Gemini API error: ${err}` };
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let brief;
    try {
      // JSON nativo, no strings mágicos ni regex inestables.
      brief = JSON.parse(text);
    } catch (parseError) {
      return { success: false, error: "Could not safely parse Gemini response as JSON." };
    }

    if (!brief || !brief.description) {
      return { success: false, error: "Incomplete generation block." };
    }

    // Auto-save opcional al componente de Kanban, forzando tipado seguro.
    if (taskId) {
      try {
        await prisma.kanbanTask.update({
          where: { id: taskId },
          data: { description: brief.description } as any, // Cast mantenido si el schema diverge de string simple.
        });
      } catch (dbErr) {
        console.error("[generateTaskBrief] Warning: Auto-save failed", dbErr);
      }
    }

    return { success: true, brief };
  } catch (err: any) {
    console.error("[generateTaskBrief]", err);
    return { success: false, error: err.message || "Failed to generate brief" };
  }
}
