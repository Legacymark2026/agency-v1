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
        meetingType: meta.meetingType || "GOOGLE_MEET",
        meetingUrl: meta.meetingUrl || `https://meet.google.com/legacymark-${ev.id.slice(0, 4)}-${ev.id.slice(-3)}`,
        status: (ev.status as any) || "SCHEDULED",
        notes: meta.notes || "",
        price: meta.price || 0,
        currency: meta.currency || "USD",
        paymentStatus: meta.paymentStatus || (meta.price > 0 ? "PAID" : "FREE"),
        organizerName: ev.organizer?.name || "Equipo LegacyMark",
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
  meetingType?: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "PHONE" | "IN_PERSON";
  notes?: string;
  price?: number;
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
      meetingType: params.meetingType || "GOOGLE_MEET",
      meetingUrl,
      notes: params.notes || "",
      price: params.price || 0,
      currency: "USD",
      paymentStatus: (params.price || 0) > 0 ? "PAID" : "FREE",
    };

    const ev = await prisma.event.create({
      data: {
        title: `${params.typeName} - ${params.customerName}`,
        description: params.notes || `Cita agendada para ${params.customerName}`,
        type: params.typeName,
        status: "CONFIRMED",
        startDate: start,
        endDate: end,
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
      meetingType: params.meetingType || "GOOGLE_MEET",
      meetingUrl,
      status: "CONFIRMED",
      notes: params.notes || "",
      price: params.price || 0,
      currency: "USD",
      paymentStatus: (params.price || 0) > 0 ? "PAID" : "FREE",
      organizerName: user.name || "Administrador",
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
        description: s.descripcion || "Servicio empresarial especializado.",
        price: s.precio_base || 0,
        currency: "USD",
        requiresPayment: (s.precio_base || 0) > 0,
        color: "border-teal-500/40 text-teal-400 bg-teal-500/10",
        isActive: true,
        assignmentStrategy: "ROUND_ROBIN",
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
      description: "Presentación interactiva de características, facturación DIAN y resolución de dudas.",
      price: 0,
      currency: "USD",
      requiresPayment: false,
      color: "border-teal-500/40 text-teal-400 bg-teal-500/10",
      isActive: true,
      assignmentStrategy: "ROUND_ROBIN",
    },
    {
      id: "bt-ia-consulting",
      title: "Consultoría de IA, Agentes & Automatización",
      slug: "consultoria-ia",
      durationMinutes: 60,
      bufferMinutes: 15,
      meetingType: "GOOGLE_MEET",
      description: "Diseño de estrategia de automatización cognitiva, pipelines LLM y modelos de lenguaje.",
      price: 75,
      currency: "USD",
      requiresPayment: true,
      color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
      isActive: true,
      assignmentStrategy: "SINGLE_HOST",
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

export async function getBookingRulesAction(): Promise<BookingRulesConfig> {
  return {
    minNoticeHours: 2,
    maxAdvanceDays: 45,
    slotIntervalMinutes: 15,
    allowReschedule: true,
    allowCancellation: true,
    whatsappReminderTemplate:
      "👋 Hola {{nombre}}, te recordamos tu cita de '{{tipo_cita}}' agendada para el {{fecha}} a las {{hora}}. Enlace de videollamada: {{link_reunion}}",
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

  const messageText = `👋 Hola *${appointment.customerName}*, te recordamos tu cita corporativa:\n\n📅 *Servicio:* ${appointment.typeName}\n🕒 *Fecha y Hora:* ${formattedDate} a las ${formattedTime}\n📹 *Enlace de Reunión (Google Meet):* ${appointment.meetingUrl}\n\n¡Te esperamos puntualmente! Si necesitas reagendar, responde a este mensaje.`;

  const encodedText = encodeURIComponent(messageText);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return {
    whatsappUrl,
    messageText,
  };
}
