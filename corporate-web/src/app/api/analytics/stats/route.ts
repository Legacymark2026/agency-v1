import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Métricas Totales
    const totalViews = await prisma.analyticsEvent.count({
      where: { eventType: "pageview" },
    });

    const todayViews = await prisma.analyticsEvent.count({
      where: {
        eventType: "pageview",
        createdAt: { gte: today },
      },
    });

    const whatsappClicks = await prisma.analyticsEvent.count({
      where: { eventType: "whatsapp_click" },
    });

    const formSubmissions = await prisma.analyticsEvent.count({
      where: { eventType: "form_submission" },
    });

    // 2. Dispositivos
    const devicesGroup = await prisma.analyticsEvent.groupBy({
      by: ["deviceType"],
      where: { eventType: "pageview" },
      _count: { deviceType: true },
    });

    const devices = devicesGroup.map((d) => ({
      type: d.deviceType,
      count: d._count.deviceType,
    }));

    // 3. Páginas más visitadas
    const topPagesGroup = await prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: { eventType: "pageview" },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    });

    const topPages = topPagesGroup.map((p) => ({
      path: p.path,
      views: p._count.path,
    }));

    // 4. Artículos con más lecturas
    const topPosts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        viewsCount: true,
        published: true,
      },
      orderBy: { viewsCount: "desc" },
      take: 5,
    });

    // 5. Total de Artículos y Publicados
    const totalPosts = await prisma.post.count();
    const publishedPosts = await prisma.post.count({ where: { published: true } });

    // 6. Actividad Reciente
    const recentEvents = await prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return NextResponse.json({
      totalViews,
      todayViews,
      whatsappClicks,
      formSubmissions,
      totalPosts,
      publishedPosts,
      devices,
      topPages,
      topPosts,
      recentEvents,
    });
  } catch (error) {
    console.error("Error generating analytics stats:", error);
    return NextResponse.json({ error: "Error al generar estadísticas" }, { status: 500 });
  }
}
