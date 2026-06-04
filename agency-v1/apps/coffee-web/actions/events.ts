"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

const MOCK_EVENTS = [
  { id: "evt-001", title: "Cata de Café: Orígenes de África", date: "15/06/2026", time: "18:00", capacity: 15, spotsLeft: 4, desc: "Explora la acidez frutal de Etiopía y Kenia en esta sesión guiada." },
  { id: "evt-002", title: "Taller: Arte Latte para Principiantes", date: "22/06/2026", time: "16:00", capacity: 8, spotsLeft: 2, desc: "Aprende a texturizar leche y realizar diseños básicos como el corazón y la roseta." },
  { id: "evt-003", title: "Curso de Barismo: Métodos de Filtro", date: "29/06/2026", time: "17:30", capacity: 12, spotsLeft: 7, desc: "Domina las extracciones en V60, Chemex y Prensa Francesa." }
];

export async function getEventsAction() {
  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/events`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getEventsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const counts = await prisma.goldneezEventBooking.groupBy({
      by: ["eventId"],
      where: { estado: "booked" },
      _count: { id: true },
    });

    const bookingCounts = counts.reduce((acc: any, c: any) => {
      acc[c.eventId] = c._count.id;
      return acc;
    }, {});

    return MOCK_EVENTS.map((evt) => ({
      ...evt,
      spotsLeft: Math.max(0, evt.capacity - (bookingCounts[evt.id] || 0)),
    }));
  } catch (err) {
    console.error("[getEventsAction] Error en base de datos:", err);
    return MOCK_EVENTS;
  }
}

export async function getBookingsAction() {
  const me = await getMeAction();
  if (!me) return [];

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/events/bookings/${me.id}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getBookingsAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    return await prisma.goldneezEventBooking.findMany({
      where: { userId: me.id, estado: "booked" },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("[getBookingsAction] Error en base de datos:", err);
    return [];
  }
}

export async function bookEventAction(eventId: string, eventTitle: string, eventDate: string) {
  const me = await getMeAction();
  if (!me) return { error: "No autorizado" };

  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/events/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, eventId, eventTitle, eventDate }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    } else {
      const errorData = await res.json();
      return { error: errorData.error || "Error al reservar" };
    }
  } catch (err: any) {
    console.warn("[bookEventAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    const checkBooking = await prisma.goldneezEventBooking.findFirst({
      where: { userId: me.id, eventId, estado: "booked" },
    });

    if (checkBooking) {
      return { error: "Ya tienes una reserva activa para este evento." };
    }

    const booking = await prisma.goldneezEventBooking.create({
      data: {
        userId: me.id,
        eventId,
        eventTitle,
        eventDate,
        estado: "booked",
      },
    });

    return { success: true, bookingId: booking.id };
  } catch (err: any) {
    console.error("[bookEventAction] Error en base de datos:", err);
    return { error: err.message };
  }
}

export async function cancelBookingAction(bookingId: string) {
  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/events/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[cancelBookingAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback a DB
  try {
    await prisma.goldneezEventBooking.update({
      where: { id: bookingId },
      data: {
        estado: "cancelled",
      },
    });
    return { success: true };
  } catch (err: any) {
    console.error("[cancelBookingAction] Error en base de datos:", err);
    return { error: err.message };
  }
}
