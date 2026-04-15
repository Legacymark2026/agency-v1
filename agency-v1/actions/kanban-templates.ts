"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const REVALIDATE = () => revalidatePath("/dashboard/admin/operations/kanban");

// ── Built-in global templates ─────────────────────────────────────────────────
const BUILTIN_TEMPLATES = [
  {
    id: "tpl_meta_ads",
    name: "🚀 Lanzamiento Meta Ads",
    description: "Flujo completo para lanzar una campaña de Facebook e Instagram",
    icon: "📣",
    isGlobal: true,
    structure: {
      swimlanes: [
        {
          name: "Estrategia",
          tasks: [
            { title: "Brief de campaña", priority: "HIGH", labels: ["Estrategia"], estimatedHours: 2 },
            { title: "Definir audiencias y segmentación", priority: "HIGH", labels: ["Meta"], estimatedHours: 3 },
            { title: "Configurar Pixel y CAPI", priority: "URGENT", labels: ["Backend", "Meta"], estimatedHours: 4 },
          ],
        },
        {
          name: "Producción",
          tasks: [
            { title: "Diseño de artes (4:5 y 9:16)", priority: "HIGH", labels: ["Diseño"], estimatedHours: 8 },
            { title: "Copy para anuncios (3 variaciones)", priority: "MEDIUM", labels: ["Copy"], estimatedHours: 3 },
            { title: "Video de 15s para Reels", priority: "HIGH", labels: ["Motion"], estimatedHours: 6 },
            { title: "Review de marca y ortografía", priority: "MEDIUM", labels: ["QA"], estimatedHours: 1 },
          ],
        },
        {
          name: "Aprobación y Lanzamiento",
          tasks: [
            { title: "Enviar a aprobación cliente", priority: "HIGH", labels: ["Cliente"], estimatedHours: 0.5 },
            { title: "Configurar campaña en Ads Manager", priority: "HIGH", labels: ["Meta"], estimatedHours: 2 },
            { title: "Test A/B de creatividades", priority: "MEDIUM", labels: ["Meta"], estimatedHours: 1 },
            { title: "Informe de resultados semana 1", priority: "MEDIUM", labels: ["Reporte"], estimatedHours: 2 },
          ],
        },
      ],
    },
  },
  {
    id: "tpl_tiktok",
    name: "🎵 Campaña TikTok Ads",
    description: "Producción y lanzamiento de contenido optimizado para TikTok",
    icon: "🎵",
    isGlobal: true,
    structure: {
      swimlanes: [
        {
          name: "Pre-producción",
          tasks: [
            { title: "Investigación de tendencias TikTok", priority: "HIGH", labels: ["Estrategia"], estimatedHours: 2 },
            { title: "Script de videos (3 formatos)", priority: "HIGH", labels: ["Copy"], estimatedHours: 3 },
            { title: "Casting y locaciones", priority: "MEDIUM", labels: ["Producción"], estimatedHours: 2 },
          ],
        },
        {
          name: "Producción",
          tasks: [
            { title: "Grabación de contenido (Día 1)", priority: "URGENT", labels: ["Motion"], estimatedHours: 8 },
            { title: "Edición con efectos nativos TikTok", priority: "HIGH", labels: ["Motion"], estimatedHours: 6 },
            { title: "Subtítulos y caption", priority: "MEDIUM", labels: ["Copy"], estimatedHours: 1 },
          ],
        },
        {
          name: "Publicación",
          tasks: [
            { title: "Configurar TikTok Pixel", priority: "HIGH", labels: ["Backend"], estimatedHours: 2 },
            { title: "Subir anuncios a TikTok Ads", priority: "HIGH", labels: ["Pauta"], estimatedHours: 1.5 },
            { title: "Monitor de métricas semana 1", priority: "MEDIUM", labels: ["Reporte"], estimatedHours: 2 },
          ],
        },
      ],
    },
  },
  {
    id: "tpl_email_marketing",
    name: "📧 Email Marketing Campaign",
    description: "Flujo completo de diseño, segmentación y envío de campaña email",
    icon: "📧",
    isGlobal: true,
    structure: {
      swimlanes: [
        {
          name: "Preparación",
          tasks: [
            { title: "Segmentar base de datos", priority: "HIGH", labels: ["Estrategia"], estimatedHours: 2 },
            { title: "Redactar copy del email", priority: "HIGH", labels: ["Copy"], estimatedHours: 3 },
            { title: "Diseño del template HTML", priority: "HIGH", labels: ["Diseño"], estimatedHours: 4 },
          ],
        },
        {
          name: "QA y Envío",
          tasks: [
            { title: "Test en múltiples clientes de email", priority: "HIGH", labels: ["QA"], estimatedHours: 1.5 },
            { title: "Test de entregabilidad (spam score)", priority: "URGENT", labels: ["Backend", "QA"], estimatedHours: 1 },
            { title: "Envío campaña principal", priority: "URGENT", labels: ["Pauta"], estimatedHours: 0.5 },
            { title: "Informe de aperturas y CTR", priority: "MEDIUM", labels: ["Reporte"], estimatedHours: 2 },
          ],
        },
      ],
    },
  },
  {
    id: "tpl_web_redesign",
    name: "🌐 Rediseño Web",
    description: "Proceso completo de redesign y deploy de sitio web cliente",
    icon: "🌐",
    isGlobal: true,
    structure: {
      swimlanes: [
        {
          name: "Discovery",
          tasks: [
            { title: "Análisis de competencia", priority: "MEDIUM", labels: ["Estrategia"], estimatedHours: 4 },
            { title: "Wireframes (home + 3 páginas)", priority: "HIGH", labels: ["Diseño"], estimatedHours: 8 },
            { title: "Aprobación de wireframes", priority: "HIGH", labels: ["Cliente"], estimatedHours: 1 },
          ],
        },
        {
          name: "Diseño",
          tasks: [
            { title: "Design system y guía de estilos", priority: "HIGH", labels: ["Diseño"], estimatedHours: 6 },
            { title: "Mockups en alta fidelidad", priority: "HIGH", labels: ["Diseño"], estimatedHours: 12 },
            { title: "Proofing con cliente", priority: "HIGH", labels: ["Cliente"], estimatedHours: 2 },
          ],
        },
        {
          name: "Desarrollo",
          tasks: [
            { title: "Maquetado HTML/CSS", priority: "HIGH", labels: ["Frontend"], estimatedHours: 16 },
            { title: "Integración CMS", priority: "HIGH", labels: ["Backend"], estimatedHours: 8 },
            { title: "QA cross-browser", priority: "HIGH", labels: ["QA"], estimatedHours: 4 },
            { title: "Deploy y configuración DNS", priority: "URGENT", labels: ["Backend"], estimatedHours: 2 },
          ],
        },
      ],
    },
  },
];

export async function listProjectTemplates() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, templates: [] };

    // DB templates (company-specific or global)
    let dbTemplates: any[] = [];
    try {
      dbTemplates = await (prisma as any).kanbanProjectTemplate.findMany({
        where: { OR: [{ isGlobal: true }, { companyId: { not: null } }] },
        orderBy: { usageCount: "desc" },
      });
    } catch { /* table not yet migrated */ }

    // Merge builtin + DB templates
    const all = [
      ...BUILTIN_TEMPLATES,
      ...dbTemplates.filter((d: any) => !BUILTIN_TEMPLATES.find((b) => b.id === d.id)),
    ];

    return { success: true, templates: all };
  } catch (err: any) {
    return { success: false, templates: BUILTIN_TEMPLATES };
  }
}

export async function createProjectFromTemplate(
  templateId: string,
  projectName: string,
  passedCompanyId?: string
) {
  try {
    const session = await auth();
    console.log("[createProjectFromTemplate] Session user:", session?.user);
    console.log("[createProjectFromTemplate] Session user companyId:", session?.user?.companyId);
    
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Get companyId: prioritize passedCompanyId > session.user.companyId > query
    let companyId = passedCompanyId;
    
    // Also check session user companyId (set by the app)
    if ((!companyId || companyId === "") && session.user.companyId) {
      companyId = session.user.companyId;
      console.log("[createProjectFromTemplate] Using companyId from session:", companyId);
    }
    
    // Fallback to DB query if still not found
    if (!companyId || companyId === "") {
      const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id }
      });
      console.log("[createProjectFromTemplate] companyUser query result:", companyUser);
      if (!companyUser) return { success: false, error: "No company found for user" };
      companyId = companyUser.companyId;
    }

    console.log("[createProjectFromTemplate] Final companyId:", companyId);

    // Verify company exists
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      // Return detailed error with the companyId that failed
      console.error("[createProjectFromTemplate] Company NOT FOUND. CompanyId:", companyId);
      return { success: false, error: `Company not found: ${companyId}` };
    }

    // Find template (builtin first, then DB)
    let template: any = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      template = await prisma.kanbanProjectTemplate.findUnique({ where: { id: templateId } });
    }
    if (!template) return { success: false, error: "Template not found" };

    console.log("[createProjectFromTemplate] Creating project with companyId:", companyId);

    // Create project
    const project = await prisma.kanbanProject.create({
      data: {
        name: projectName || template.name,
        description: template.description || "",
        companyId,
        status: "ACTIVE",
        healthScore: 100,
      },
    });

    // Create swimlanes + tasks
    const structure = template.structure as { swimlanes: any[] };
    for (let si = 0; si < structure.swimlanes.length; si++) {
      const sl = structure.swimlanes[si];
      const swimlane = await prisma.kanbanSwimlane.create({
        data: { name: sl.name, projectId: project.id, order: si },
      });

      for (let ti = 0; ti < sl.tasks.length; ti++) {
        const t = sl.tasks[ti];
        await prisma.kanbanTask.create({
          data: {
            title: t.title,
            priority: t.priority || "MEDIUM",
            status: "TODO",
            estimatedHours: t.estimatedHours || null,
            projectId: project.id,
            swimlaneId: swimlane.id,
            creatorId: session.user.id,
            order: ti,
            ...(t.labels ? { labels: t.labels } : {}),
          } as any,
        });
      }
    }

    // Increment usage count for DB templates
    try {
      await (prisma as any).kanbanProjectTemplate.updateMany({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      });
    } catch { /* builtin template */ }

    REVALIDATE();
    return { success: true, project };
  } catch (err: any) {
    console.error("[createProjectFromTemplate]", err);
    return { success: false, error: err.message };
  }
}

export async function saveProjectAsTemplate(projectId: string, name: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const project = await prisma.kanbanProject.findUnique({
      where: { id: projectId },
      include: {
        swimlanes: {
          orderBy: { order: "asc" },
          include: { kanbanTasks: { orderBy: { order: "asc" }, select: { title: true, priority: true, estimatedHours: true } } },
        },
      },
    });
    if (!project) return { success: false, error: "Project not found" };

    const structure = {
      swimlanes: project.swimlanes.map((sl) => ({
        name: sl.name,
        tasks: sl.kanbanTasks.map((t) => ({
          title: t.title, priority: t.priority, estimatedHours: t.estimatedHours || 0,
        })),
      })),
    };

    const template = await (prisma as any).kanbanProjectTemplate.create({
      data: {
        name, description: `Plantilla creada desde: ${project.name}`,
        companyId: project.companyId, structure, isGlobal: false,
      },
    });

    return { success: true, template };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
