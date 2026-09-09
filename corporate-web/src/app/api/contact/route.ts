import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

function sanitizeString(str: unknown, maxLen: number): string {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`contact_form_${clientIp}`, {
      maxRequests: 5,
      windowSeconds: 10 * 60,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Límite de solicitudes de contacto alcanzado. Por favor espere unos minutos." },
        { 
          status: 429,
          headers: { "Retry-After": String(rateCheck.resetSeconds) }
        }
      );
    }

    const body = await req.json();
    const { name, email, phone, company, service, urgency, message } = body;

    if (!name || !email || !phone || !company || !message) {
      return NextResponse.json(
        { error: "Todos los campos marcados con asterisco (*) son obligatorios." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 150) {
      return NextResponse.json(
        { error: "El formato de correo corporativo no es válido." },
        { status: 400 }
      );
    }

    const cleanName = sanitizeString(name, 120);
    const cleanPhone = sanitizeString(phone, 40);
    const cleanCompany = sanitizeString(company, 150);
    const cleanService = sanitizeString(service, 100) || "Consultoría Estratégica & Directiva";
    const cleanUrgency = sanitizeString(urgency, 80) || "En las próximas 2 semanas";
    const cleanMessage = sanitizeString(message, 3000);

    if (cleanName.length < 2 || cleanMessage.length < 5) {
      return NextResponse.json(
        { error: "La información provista no cumple con la longitud mínima requerida." },
        { status: 400 }
      );
    }

    const lead = await prisma.contactLead.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        company: cleanCompany,
        service: cleanService,
        urgency: cleanUrgency,
        message: cleanMessage,
        status: "nuevo",
        ipAddress: clientIp,
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        path: "/contacto",
        eventType: "form_submission",
        deviceType: "desktop",
        metadata: JSON.stringify({
          leadId: lead.id,
          service: cleanService,
          company: cleanCompany,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Solicitud registrada con éxito bajo protocolo confidencial.",
      id: lead.id,
    });
  } catch (error) {
    console.error("Error in contact POST API:", error);
    return NextResponse.json(
      { error: "Error interno al registrar su solicitud. Intente nuevamente." },
      { status: 500 }
    );
  }
}
