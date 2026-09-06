import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    let config = await prisma.integrationConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.integrationConfig.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json({ error: "Error al obtener integraciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const {
      googleTagManagerId = "",
      googleAnalyticsId = "",
      googleSearchConsoleMeta = "",
      facebookPixelId = "",
      tiktokPixelId = "",
      linkedinPartnerId = "",
      gtmEnabled = false,
      gaEnabled = false,
      gscEnabled = false,
      fbEnabled = false,
      tiktokEnabled = false,
      linkedinEnabled = false,
    } = data;

    const config = await prisma.integrationConfig.upsert({
      where: { id: "default" },
      update: {
        googleTagManagerId: String(googleTagManagerId || "").trim(),
        googleAnalyticsId: String(googleAnalyticsId || "").trim(),
        googleSearchConsoleMeta: String(googleSearchConsoleMeta || "").trim(),
        facebookPixelId: String(facebookPixelId || "").trim(),
        tiktokPixelId: String(tiktokPixelId || "").trim(),
        linkedinPartnerId: String(linkedinPartnerId || "").trim(),
        gtmEnabled: Boolean(gtmEnabled),
        gaEnabled: Boolean(gaEnabled),
        gscEnabled: Boolean(gscEnabled),
        fbEnabled: Boolean(fbEnabled),
        tiktokEnabled: Boolean(tiktokEnabled),
        linkedinEnabled: Boolean(linkedinEnabled),
      },
      create: {
        id: "default",
        googleTagManagerId: String(googleTagManagerId || "").trim(),
        googleAnalyticsId: String(googleAnalyticsId || "").trim(),
        googleSearchConsoleMeta: String(googleSearchConsoleMeta || "").trim(),
        facebookPixelId: String(facebookPixelId || "").trim(),
        tiktokPixelId: String(tiktokPixelId || "").trim(),
        linkedinPartnerId: String(linkedinPartnerId || "").trim(),
        gtmEnabled: Boolean(gtmEnabled),
        gaEnabled: Boolean(gaEnabled),
        gscEnabled: Boolean(gscEnabled),
        fbEnabled: Boolean(fbEnabled),
        tiktokEnabled: Boolean(tiktokEnabled),
        linkedinEnabled: Boolean(linkedinEnabled),
      },
    });

    // Revalidar el layout para inyectar o actualizar los scripts inmediatamente
    try {
      revalidatePath("/", "layout");
    } catch (err) {
      console.warn("Revalidation warning:", err);
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error saving integrations:", error);
    return NextResponse.json({ error: "Error al guardar integraciones" }, { status: 500 });
  }
}
