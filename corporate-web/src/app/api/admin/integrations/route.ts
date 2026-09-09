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

    // Validación defensiva anti-XSS: formato estricto de identificadores
    const cleanGtm = String(googleTagManagerId || "").trim();
    if (cleanGtm && !/^GTM-[A-Z0-9_-]{3,20}$/i.test(cleanGtm)) {
      return NextResponse.json(
        { error: "Formato de Google Tag Manager ID inválido (ej: GTM-XXXXXX)" },
        { status: 400 }
      );
    }

    const cleanGa = String(googleAnalyticsId || "").trim();
    if (cleanGa && !/^G-[A-Z0-9_-]{3,25}$/i.test(cleanGa)) {
      return NextResponse.json(
        { error: "Formato de Google Analytics ID inválido (ej: G-XXXXXXXXXX)" },
        { status: 400 }
      );
    }

    const cleanGsc = String(googleSearchConsoleMeta || "").trim();
    if (cleanGsc && !/^[A-Za-z0-9_-]{10,120}$/.test(cleanGsc)) {
      return NextResponse.json(
        { error: "El token de Google Search Console solo debe contener caracteres alfanuméricos" },
        { status: 400 }
      );
    }

    const cleanFb = String(facebookPixelId || "").trim();
    if (cleanFb && !/^\d{5,25}$/.test(cleanFb)) {
      return NextResponse.json(
        { error: "El Pixel ID de Facebook debe ser un identificador numérico" },
        { status: 400 }
      );
    }

    const cleanTiktok = String(tiktokPixelId || "").trim();
    if (cleanTiktok && !/^[A-Z0-9]{5,30}$/i.test(cleanTiktok)) {
      return NextResponse.json(
        { error: "Formato de TikTok Pixel ID inválido" },
        { status: 400 }
      );
    }

    const cleanLinkedin = String(linkedinPartnerId || "").trim();
    if (cleanLinkedin && !/^\d{4,20}$/.test(cleanLinkedin)) {
      return NextResponse.json(
        { error: "El ID de socio de LinkedIn debe ser numérico" },
        { status: 400 }
      );
    }

    const config = await prisma.integrationConfig.upsert({
      where: { id: "default" },
      update: {
        googleTagManagerId: cleanGtm,
        googleAnalyticsId: cleanGa,
        googleSearchConsoleMeta: cleanGsc,
        facebookPixelId: cleanFb,
        tiktokPixelId: cleanTiktok,
        linkedinPartnerId: cleanLinkedin,
        gtmEnabled: Boolean(gtmEnabled),
        gaEnabled: Boolean(gaEnabled),
        gscEnabled: Boolean(gscEnabled),
        fbEnabled: Boolean(fbEnabled),
        tiktokEnabled: Boolean(tiktokEnabled),
        linkedinEnabled: Boolean(linkedinEnabled),
      },
      create: {
        id: "default",
        googleTagManagerId: cleanGtm,
        googleAnalyticsId: cleanGa,
        googleSearchConsoleMeta: cleanGsc,
        facebookPixelId: cleanFb,
        tiktokPixelId: cleanTiktok,
        linkedinPartnerId: cleanLinkedin,
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
