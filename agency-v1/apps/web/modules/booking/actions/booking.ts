"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type {
  AppointmentRecord,
  BookingTypeConfig,
  WeeklyScheduleDay,
  BookingRulesConfig,
  BookingMetricsReport,
  SmartRoutingRule,
  BlockedDateOverride,
} from "../types";

export async function getAppointmentsAction(): Promise<{
  success: boolean;
  appointments: AppointmentRecord[];
}> {
  const appointments: AppointmentRecord[] = [];

  try {
    const company = await prisma.company.findFirst();
    const events = await prisma.event.findMany({
      where: company ? { companyId: company.id } : {},
      include: {
        participants: true,
        organizer: true,
      },
      orderBy: { startDate: "desc" },
      take: 100,
    });

    for (const ev of events) {
      const meta = (ev.metadata as any) || {};
      const participant = ev.participants[0] || {};

      appointments.push({
        id: ev.id,
        title: ev.title,
        description: ev.description || "",
        customerName: participant.guestName || meta.customerName || "Cliente Registrado",
        customerEmail: participant.guestEmail || meta.customerEmail || "cliente@empresa.com",
        customerPhone: meta.customerPhone || "",
        typeName: meta.typeName || ev.type || "Cita de Servicio",
        durationMinutes: meta.durationMinutes || 30,
        bufferMinutes: meta.bufferMinutes || 10,
        startDate: ev.startDate.toISOString(),
        endDate: ev.endDate.toISOString(),
        timeZone: ev.timeZone || meta.timeZone || "America/Bogota",
        meetingType: meta.meetingType || "GOOGLE_MEET",
        meetingUrl: meta.meetingUrl || `https://meet.google.com/legacymark-${ev.id.slice(0, 4)}-${ev.id.slice(-3)}`,
        status: (ev.status as any) || "SCHEDULED",
        bookingMode: meta.bookingMode || "ONE_ON_ONE",
        maxAttendees: meta.maxAttendees || 1,
        currentAttendees: ev.participants.length || 1,
        notes: meta.notes || "",
        price: meta.price || 0,
        currency: meta.currency || "USD",
        paymentStatus: meta.paymentStatus || (meta.price > 0 ? "PAID" : "FREE"),
        organizerName: ev.organizer?.name || "Equipo LegacyMark",
        hostMembers: meta.hostMembers || ["Administrador LegacyMark"],
        routingAnswers: meta.routingAnswers || {},
        createdAt: ev.createdAt.toISOString(),
      });
    }
  } catch (err) {
    console.error("[getAppointmentsAction] DB Error:", err);
  }

  return {
    success: true,
    appointments,
  };
}

export async function createAppointmentAction(params: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  typeName: string;
  durationMinutes: number;
  startDate: string;
  timeZone?: string;
  meetingType?: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "PHONE" | "IN_PERSON";
  bookingMode?: "ONE_ON_ONE" | "COLLECTIVE" | "GROUP";
  notes?: string;
  price?: number;
  routingAnswers?: Record<string, any>;
}): Promise<{ success: boolean; appointment?: AppointmentRecord; error?: string }> {
  try {
    const company = await prisma.company.findFirst();
    const user = await prisma.user.findFirst();

    if (!company || !user) {
      return { success: false, error: "Empresa o usuario administrador no encontrado en PostgreSQL." };
    }

    const duration = Number(params.durationMinutes) || 30;
    const start = new Date(params.startDate);
    const end = new Date(start.getTime() + duration * 60000);
    const tz = params.timeZone || "America/Bogota";

    const meetId = crypto.randomBytes(4).toString("hex");
    const meetingUrl = params.meetingType === "ZOOM" 
      ? `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`
      : `https://meet.google.com/legacymark-${meetId}`;

    const metadata = {
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      typeName: params.typeName,
      durationMinutes: duration,
      bufferMinutes: 10,
      timeZone: tz,
      meetingType: params.meetingType || "GOOGLE_MEET",
      meetingUrl,
      bookingMode: params.bookingMode || "ONE_ON_ONE",
      notes: params.notes || "",
      price: params.price || 0,
      currency: "USD",
      paymentStatus: (params.price || 0) > 0 ? "PAID" : "FREE",
      routingAnswers: params.routingAnswers || {},
      hostMembers: [user.name || "Consultor Senior LegacyMark"],
    };

    const ev = await prisma.event.create({
      data: {
        title: `${params.typeName} - ${params.customerName}`,
        description: params.notes || `Cita agendada para ${params.customerName}`,
        type: params.typeName,
        status: "CONFIRMED",
        startDate: start,
        endDate: end,
        timeZone: tz,
        organizerId: user.id,
        companyId: company.id,
        metadata,
        participants: {
          create: {
            guestName: params.customerName,
            guestEmail: params.customerEmail,
            rsvpStatus: "ACCEPTED",
          },
        },
      },
    });

    const appointment: AppointmentRecord = {
      id: ev.id,
      title: `${params.typeName} - ${params.customerName}`,
      description: params.notes || "",
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      typeName: params.typeName,
      durationMinutes: duration,
      bufferMinutes: 10,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      timeZone: tz,
      meetingType: params.meetingType || "GOOGLE_MEET",
      meetingUrl,
      status: "CONFIRMED",
      bookingMode: params.bookingMode || "ONE_ON_ONE",
      notes: params.notes || "",
      price: params.price || 0,
      currency: "USD",
      paymentStatus: (params.price || 0) > 0 ? "PAID" : "FREE",
      organizerName: user.name || "Administrador",
      hostMembers: [user.name || "Consultor Senior LegacyMark"],
      routingAnswers: params.routingAnswers || {},
      createdAt: ev.createdAt.toISOString(),
    };

    return { success: true, appointment };
  } catch (err: any) {
    console.error("[createAppointmentAction] Error:", err);
    return { success: false, error: err.message || "Error al crear cita en base de datos" };
  }
}

export async function updateAppointmentStatusAction(params: {
  id: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";
  notes?: string;
}): Promise<{ success: boolean }> {
  try {
    await prisma.event.updateMany({
      where: { id: params.id },
      data: {
        status: params.status,
      },
    });
  } catch (e) {
    console.error("[updateAppointmentStatusAction] DB Update error:", e);
  }

  return { success: true };
}

// 📅 GENERADOR DE ARCHIVO iCALENDAR (.ICS) RFC 5545 ESTÁNDAR
export async function generateICalendarAction(appointment: AppointmentRecord): Promise<{
  icsContent: string;
  filename: string;
}> {
  const startObj = new Date(appointment.startDate);
  const endObj = new Date(appointment.endDate);

  const formatDateToICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LegacyMark S.A.S.//Enterprise Booking 2.0//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:uid-${appointment.id}@legacymarksas.com`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    `DTSTART:${formatDateToICS(startObj)}`,
    `DTEND:${formatDateToICS(endObj)}`,
    `SUMMARY:${appointment.title}`,
    `DESCRIPTION:${appointment.description || appointment.typeName}\\nEnlace de Reunión: ${appointment.meetingUrl}`,
    `LOCATION:${appointment.meetingUrl}`,
    `ORGANIZER;CN=LegacyMark ERP:mailto:soporte@legacymarksas.com`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${appointment.customerName}:mailto:${appointment.customerEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const filename = `Cita_${appointment.customerName.replace(/\s+/g, "_")}.ics`;
  return { icsContent, filename };
}

// 🔀 MOTOR DE ENRUTAMIENTO INTELIGENTE DE LEADS (SMART ROUTING)
export async function getSmartRoutingRulesAction(): Promise<SmartRoutingRule[]> {
  return [
    {
      id: "rule-budget",
      name: "Enrutamiento por Presupuesto de Proyecto",
      question: "¿Cuál es el presupuesto estimado para tu proyecto?",
      options: [
        { label: "Menos de $1,000 USD", value: "tier_starter", targetBookingTypeId: "bt-saas-demo", targetHostName: "Especialista de Producto" },
        { label: "$1,000 USD - $5,000 USD", value: "tier_growth", targetBookingTypeId: "bt-software-dev", targetHostName: "Líder de Desarrollo" },
        { label: "Más de $5,000 USD (Empresarial)", value: "tier_enterprise", targetBookingTypeId: "bt-ia-consulting", targetHostName: "Director de Arquitectura & IA" },
      ],
    },
    {
      id: "rule-type",
      name: "Enrutamiento por Tipo de Necesidad",
      question: "¿Qué solución técnica buscas implementar principalmente?",
      options: [
        { label: "Facturación Electrónica DIAN & Contabilidad ERP", value: "erp_accounting", targetBookingTypeId: "bt-saas-demo", targetHostName: "Consultor Financiero NIIF" },
        { label: "Agentes Autónomos de IA & Automatización de Procesos", value: "ai_agents", targetBookingTypeId: "bt-ia-consulting", targetHostName: "Ingeniero de Inteligencia Artificial" },
        { label: "Desarrollo de Software Web & Móvil a la Medida", value: "custom_software", targetBookingTypeId: "bt-software-dev", targetHostName: "Líder Técnico Senior" },
      ],
    },
  ];
}

// 🌐 SNIPPETS DE INCRUSTACIÓN (EMBED CODE & POPUP)
export async function getEmbedSnippetsAction(): Promise<{
  iframeCode: string;
  reactSnippet: string;
  popupScript: string;
}> {
  const embedUrl = "https://legacymarksas.com/book/legacymark";

  const iframeCode = `<iframe 
  src="${embedUrl}?embed=true" 
  width="100%" 
  height="700px" 
  frameborder="0" 
  style="border: none; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);"
  allow="camera; microphone; autoplay">
</iframe>`;

  const reactSnippet = `import { useState } from 'react';

export function BookingWidget() {
  return (
    <iframe
      src="${embedUrl}?embed=true"
      className="w-full h-[700px] rounded-2xl border border-slate-800 shadow-2xl"
      allow="camera; microphone; autoplay"
    />
  );
}`;

  const popupScript = `<script src="https://legacymarksas.com/embed/booking-modal.js" data-slug="legacymark" async></script>
<button data-booking-popup="legacymark" class="btn-primary">Agendar Reunión</button>`;

  return { iframeCode, reactSnippet, popupScript };
}

export async function getBookingTypesAction(): Promise<BookingTypeConfig[]> {
  try {
    const services = await prisma.servicePrice.findMany({
      where: { estado: "activo" },
      orderBy: { orderIndex: "asc" },
    });

    if (services && services.length > 0) {
      return services.map(s => ({
        id: s.id,
        title: s.nombre_servicio,
        slug: (s.codigo_id || s.nombre_servicio).toLowerCase().replace(/\s+/g, "-"),
        durationMinutes: parseInt(s.tiempo_estimado || "45", 10) || 45,
        bufferMinutes: 10,
        meetingType: "GOOGLE_MEET",
        bookingMode: "ONE_ON_ONE",
        description: s.descripcion || "Servicio empresarial especializado.",
        price: s.precio_base || 0,
        currency: "USD",
        requiresPayment: (s.precio_base || 0) > 0,
        color: "border-teal-500/40 text-teal-400 bg-teal-500/10",
        isActive: true,
        assignmentStrategy: "ROUND_ROBIN",
        hosts: ["Administrador LegacyMark", "Consultor Senior"],
      }));
    }
  } catch (err) {
    console.error("[getBookingTypesAction] DB Error:", err);
  }

  return [
    {
      id: "bt-saas-demo",
      title: "Demostración de Plataforma SaaS ERP",
      slug: "demostracion-saas",
      durationMinutes: 45,
      bufferMinutes: 10,
      meetingType: "GOOGLE_MEET",
      bookingMode: "ONE_ON_ONE",
      description: "Presentación interactiva de características, facturación DIAN y resolución de dudas.",
      price: 0,
      currency: "USD",
      requiresPayment: false,
      color: "border-teal-500/40 text-teal-400 bg-teal-500/10",
      isActive: true,
      assignmentStrategy: "ROUND_ROBIN",
      hosts: ["Especialista de Producto"],
    },
    {
      id: "bt-collective-panel",
      title: "Panel Técnico & Evaluación de Arquitectura (Colectivo)",
      slug: "panel-tecnico",
      durationMinutes: 60,
      bufferMinutes: 15,
      meetingType: "GOOGLE_MEET",
      bookingMode: "COLLECTIVE",
      description: "Reunión estratégica con Arquitecto de Software + Director de Operaciones simultáneamente.",
      price: 0,
      currency: "USD",
      requiresPayment: false,
      color: "border-blue-500/40 text-blue-400 bg-blue-500/10",
      isActive: true,
      assignmentStrategy: "COLLECTIVE",
      hosts: ["Arquitecto de Software", "Director DevOps"],
    },
    {
      id: "bt-ia-consulting",
      title: "Consultoría de IA, Agentes & Automatización",
      slug: "consultoria-ia",
      durationMinutes: 60,
      bufferMinutes: 15,
      meetingType: "GOOGLE_MEET",
      bookingMode: "ONE_ON_ONE",
      description: "Diseño de estrategia de automatización cognitiva, pipelines LLM y modelos de lenguaje.",
      price: 75,
      currency: "USD",
      requiresPayment: true,
      color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
      isActive: true,
      assignmentStrategy: "SINGLE_HOST",
      hosts: ["Director de Arquitectura & IA"],
    },
    {
      id: "bt-webinar-group",
      title: "Taller Grupal: Automatización de Ventas con IA (Webinar)",
      slug: "webinar-automatizacion",
      durationMinutes: 90,
      bufferMinutes: 20,
      meetingType: "GOOGLE_MEET",
      bookingMode: "GROUP",
      maxAttendees: 25,
      description: "Sesión grupal en vivo para hasta 25 líderes de marketing y tecnología.",
      price: 25,
      currency: "USD",
      requiresPayment: true,
      color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
      isActive: true,
      assignmentStrategy: "ROUND_ROBIN",
      hosts: ["Equipo de Formación LegacyMark"],
    },
  ];
}

export async function getWeeklyScheduleAction(): Promise<WeeklyScheduleDay[]> {
  try {
    const company = await prisma.company.findFirst({
      select: { defaultCompanySettings: true },
    });

    const settings = (company?.defaultCompanySettings as any) || {};
    if (settings.weeklySchedule && Array.isArray(settings.weeklySchedule)) {
      return settings.weeklySchedule;
    }
  } catch (err) {
    //
  }

  return [
    { day: "Lunes", enabled: true, startTime: "08:00", endTime: "18:00", lunchBreakStart: "12:00", lunchBreakEnd: "13:00" },
    { day: "Martes", enabled: true, startTime: "08:00", endTime: "18:00", lunchBreakStart: "12:00", lunchBreakEnd: "13:00" },
    { day: "Miércoles", enabled: true, startTime: "08:00", endTime: "18:00", lunchBreakStart: "12:00", lunchBreakEnd: "13:00" },
    { day: "Jueves", enabled: true, startTime: "08:00", endTime: "18:00", lunchBreakStart: "12:00", lunchBreakEnd: "13:00" },
    { day: "Viernes", enabled: true, startTime: "08:00", endTime: "17:00", lunchBreakStart: "12:00", lunchBreakEnd: "13:00" },
    { day: "Sábado", enabled: true, startTime: "09:00", endTime: "13:00" },
    { day: "Domingo", enabled: false, startTime: "09:00", endTime: "13:00" },
  ];
}

export async function saveWeeklyScheduleAction(schedule: WeeklyScheduleDay[]): Promise<{ success: boolean }> {
  try {
    const company = await prisma.company.findFirst();
    if (company) {
      const existingSettings = (company.defaultCompanySettings as any) || {};
      await prisma.company.update({
        where: { id: company.id },
        data: {
          defaultCompanySettings: {
            ...existingSettings,
            weeklySchedule: schedule,
          },
        },
      });
    }
  } catch (err) {
    console.error("[saveWeeklyScheduleAction] Error:", err);
  }
  return { success: true };
}

export async function getBlockedDatesAction(): Promise<BlockedDateOverride[]> {
  return [
    { id: "blk-1", date: "2026-10-12", reason: "Día de la Raza (Festivo Nacional)", isFullDay: true },
    { id: "blk-2", date: "2026-11-02", reason: "Día de Todos los Santos (Festivo Nacional)", isFullDay: true },
    { id: "blk-3", date: "2026-12-25", reason: "Navidad Corporativa", isFullDay: true },
  ];
}

export async function getBookingRulesAction(): Promise<BookingRulesConfig> {
  return {
    minNoticeHours: 2,
    maxAdvanceDays: 45,
    slotIntervalMinutes: 15,
    defaultTimeZone: "America/Bogota",
    allowReschedule: true,
    allowCancellation: true,
    whatsappReminderTemplate:
      "👋 Hola {{nombre}}, te recordamos tu cita de '{{tipo_cita}}' agendada para el {{fecha}} a las {{hora}} (Zona: {{zona_horaria}}). Enlace de videollamada: {{link_reunion}}",
    emailConfirmationTemplate:
      "Hola {{nombre}}, tu cita '{{tipo_cita}}' ha sido confirmada para el {{fecha}} a las {{hora}}. Accede aquí: {{link_reunion}}",
  };
}

export async function getBookingMetricsAction(): Promise<BookingMetricsReport> {
  let totalAppointments = 0;
  let confirmedCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let upcomingTodayCount = 0;

  try {
    const events = await prisma.event.findMany({
      select: { status: true, startDate: true },
    });

    totalAppointments = events.length;
    const todayStr = new Date().toISOString().split("T")[0];

    events.forEach(ev => {
      if (ev.status === "CONFIRMED" || ev.status === "SCHEDULED") confirmedCount++;
      if (ev.status === "COMPLETED") completedCount++;
      if (ev.status === "CANCELLED") cancelledCount++;

      const evDateStr = ev.startDate.toISOString().split("T")[0];
      if (evDateStr === todayStr && (ev.status === "CONFIRMED" || ev.status === "SCHEDULED")) {
        upcomingTodayCount++;
      }
    });
  } catch (err) {
    console.error("[getBookingMetricsAction] DB Error:", err);
  }

  const attendanceRate = totalAppointments > 0 
    ? Math.round(((totalAppointments - cancelledCount) / totalAppointments) * 100)
    : 100;

  return {
    totalAppointments,
    confirmedCount,
    completedCount,
    cancelledCount,
    attendanceRate,
    upcomingTodayCount,
  };
}

export async function generateWhatsAppReminderAction(appointment: AppointmentRecord): Promise<{
  whatsappUrl: string;
  messageText: string;
}> {
  const cleanPhone = (appointment.customerPhone || "").replace(/\D/g, "");
  const formattedDate = new Date(appointment.startDate).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = new Date(appointment.startDate).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const messageText = `👋 Hola *${appointment.customerName}*, te recordamos tu cita corporativa:\n\n📅 *Servicio:* ${appointment.typeName}\n🕒 *Fecha y Hora:* ${formattedDate} a las ${formattedTime} (${appointment.timeZone})\n📹 *Enlace de Reunión (Google Meet):* ${appointment.meetingUrl}\n\n¡Te esperamos puntualmente! Si necesitas reagendar, responde a este mensaje.`;

  const encodedText = encodeURIComponent(messageText);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return {
    whatsappUrl,
    messageText,
  };
}
