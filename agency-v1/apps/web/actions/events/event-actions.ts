"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole, Permission, ROLE_PERMISSIONS } from "@/types/auth";
import { revalidatePath } from "next/cache";

// --- SEARCH LEADS ---
export async function searchLeadsForEvent(query: string) {
    try {
        const { authorized, companyId } = await checkEventPermission('read');
        if (!authorized || !companyId) return { success: false, data: [], error: "Unauthorized" };

        const leads = await prisma.lead.findMany({
            where: {
                companyId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 10,
            select: { id: true, name: true, email: true }
        });

        return { success: true, data: leads };
    } catch (error: any) {
        console.error("Error searching leads:", error);
        return { success: false, error: error.message };
    }
}

// --- SEARCH DEALS ---
export async function searchDealsForEvent(query: string) {
    try {
        const { authorized, companyId } = await checkEventPermission('read');
        if (!authorized || !companyId) return { success: false, data: [], error: "Unauthorized" };

        const deals = await prisma.deal.findMany({
            where: {
                companyId,
                title: { contains: query, mode: 'insensitive' }
            },
            take: 10,
            select: { id: true, title: true, stage: true, value: true }
        });

        return { success: true, data: deals };
    } catch (error: any) {
        console.error("Error searching deals:", error);
        return { success: false, error: error.message };
    }
}

// --- PERMISSION HELPERS ---

export async function checkEventPermission(action: 'read' | 'write' | 'delete', eventId?: string): Promise<{ authorized: boolean; companyId?: string; userId?: string; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { authorized: false, error: "Unauthorized" };

    const userId = session.user.id;
    const role = session.user.role as UserRole;

    // Find the user's primary company for scope
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId },
        select: { companyId: true, role: true }
    });

    if (!companyUser?.companyId) return { authorized: false, error: "No company associated with user." };
    const companyId = companyUser.companyId;

    const permissions = session.user.permissions || ROLE_PERMISSIONS[role] || [];

    // Admins can do anything within the company
    const isAdmin = permissions.includes(Permission.MANAGE_SETTINGS) || role === "admin" || role === "super_admin";

    if (action === "read") {
        return { authorized: true, companyId, userId }; // Specific scoping is done in queries
    }

    if (!eventId) {
        // Creating a new event. Base requirement is having some company context. 
        // We'll restrict by PM / Sales locally if they try to impersonate another organizer.
        return { authorized: true, companyId, userId };
    }

    // Modify/Delete existing event
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { authorized: false, error: "Event not found" };

    if (isAdmin) return { authorized: true, companyId, userId };

    const isOwner = event.organizerId === userId;
    // Project Managers can potentially edit team events, but for V1 we stick to Owner or Admin
    if (!isOwner) {
        return { authorized: false, error: "You only have permission to modify events you organized." };
    }

    return { authorized: true, companyId, userId };
}

// --- CONFLICT CHECKER ---

interface ConflictCheckParams {
    startDate: Date;
    endDate: Date;
    organizerId: string;
    type: string;
    metadata: any;
    excludeEventId?: string; // Edit mode
}

export async function checkConflicts({ startDate, endDate, organizerId, type, metadata, excludeEventId }: ConflictCheckParams) {
    // 1. Time Overlap Query for Organizer
    const userOverlap = await prisma.event.findFirst({
        where: {
            organizerId,
            status: { not: "CANCELLED" },
            id: excludeEventId ? { not: excludeEventId } : undefined,
            AND: [
                { startDate: { lt: endDate } },
                { endDate: { gt: startDate } }
            ]
        }
    });

    if (userOverlap) {
        return { hasConflict: true, reason: `Organizer is already booked for event: "${userOverlap.title}" during this time.` };
    }

    // 2. Physical Location Overlap (Assuming exact address match)
    if (type === "PHYSICAL" && metadata?.address) {
        const locationOverlap = await prisma.event.findFirst({
            where: {
                type: "PHYSICAL",
                status: { not: "CANCELLED" },
                id: excludeEventId ? { not: excludeEventId } : undefined,
                AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gt: startDate } },
                    {
                        metadata: {
                            path: ['address'],
                            equals: metadata.address
                        }
                    }
                ]
            }
        });

        if (locationOverlap) {
            return { hasConflict: true, reason: `Location conflict: Another event ("${locationOverlap.title}") is already scheduled at this exact location during this timeframe.` };
        }
    }

    return { hasConflict: false };
}

// --- SERVER ACTIONS ---

export async function createEvent(data: {
    title: string;
    description?: string;
    type: "ONLINE" | "PHYSICAL" | "HYBRID";
    startDate: string | Date;
    endDate: string | Date;
    timeZone?: string;
    isAllDay?: boolean;
    recurrenceRule?: string;
    metadata?: any;
    tags?: string[];
    dealId?: string | null;
    participants?: { userId?: string; leadId?: string }[];
}) {
    try {
        const { authorized, companyId, userId, error } = await checkEventPermission('write');
        if (!authorized || !companyId || !userId) return { success: false, error: error || "Unauthorized" };

        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (startDate >= endDate) return { success: false, error: "End date must be after start date." };

        const conflictCheck = await checkConflicts({
            startDate, endDate, organizerId: userId, type: data.type, metadata: data.metadata || {}
        });

        if (conflictCheck.hasConflict) {
            return { success: false, error: conflictCheck.reason };
        }

        const event = await prisma.event.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                startDate,
                endDate,
                timeZone: data.timeZone || "UTC",
                isAllDay: data.isAllDay || false,
                recurrenceRule: data.recurrenceRule,
                metadata: data.metadata || {},
                tags: data.tags || [],
                dealId: data.dealId || null,
                organizerId: userId,
                companyId: companyId,
                status: "SCHEDULED",
                participants: {
                    create: data.participants?.map(p => ({
                        userId: p.userId,
                        leadId: p.leadId,
                        rsvpStatus: "PENDING"
                    })) || []
                }
            }
        });

        revalidatePath("/dashboard/events");
        return { success: true, event };
    } catch (e: any) {
        console.error("Error creating event:", e);
        return { success: false, error: e.message || "Failed to create event" };
    }
}

export async function updateEvent(id: string, data: any) {
    try {
        const { authorized, error, userId } = await checkEventPermission('write', id);
        if (!authorized) return { success: false, error: error || "Unauthorized to update this event" };

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) return { success: false, error: "Event not found" };

        const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;
        const organizerId = existing.organizerId;
        const type = data.type || existing.type;
        const metadata = data.metadata || existing.metadata;

        // Re-check conflicts if time or location changed
        if (data.startDate || data.endDate || data.metadata || data.type) {
            const conflictCheck = await checkConflicts({
                startDate, endDate, organizerId, type, metadata, excludeEventId: id
            });

            if (conflictCheck.hasConflict) {
                return { success: false, error: conflictCheck.reason };
            }
        }

        const updateData: any = { ...data };
        delete updateData.participants; // Handled separately if needed in future

        // Ensure dates are correctly typed
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

        const event = await prisma.event.update({
            where: { id },
            data: updateData
        });

        revalidatePath("/dashboard/events");
        return { success: true, event };

    } catch (e: any) {
        console.error("Error updating event:", e);
        return { success: false, error: e.message || "Failed to update event" };
    }
}

export async function deleteEvent(id: string) {
    try {
        const { authorized, error } = await checkEventPermission('delete', id);
        if (!authorized) return { success: false, error: error || "Unauthorized to delete this event" };

        await prisma.event.delete({ where: { id } });

        revalidatePath("/dashboard/events");
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting event:", e);
        return { success: false, error: e.message || "Failed to delete event" };
    }
}

export async function getEvents(filters?: { startDate?: string; endDate?: string; organizerId?: string }) {
    try {
        const { authorized, companyId, userId } = await checkEventPermission('read');
        if (!authorized || !companyId) return { success: false, events: [], error: "Unauthorized" };

        const session = await auth();
        const role = session?.user?.role as UserRole;
        const isAdmin = role === "super_admin" || role === "admin" || (session?.user?.permissions || []).includes(Permission.MANAGE_SETTINGS);

        const where: any = { companyId };

        // Todos los usuarios autorizados (que pueden ver el calendario) pueden
        // ver todos los eventos de la compañía, no solo los propios.

        if (filters?.startDate) where.startDate = { gte: new Date(filters.startDate) };
        if (filters?.endDate) where.endDate = { lte: new Date(filters.endDate) };

        // Todos pueden filtrar por el calendario específico de alguien si el frontend lo envía
        if (filters?.organizerId) {
            where.organizerId = filters.organizerId;
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                organizer: { select: { id: true, name: true, image: true, email: true } },
                participants: {
                    include: {
                        user: { select: { id: true, name: true, image: true } },
                        lead: { select: { id: true, name: true, email: true } }
                    }
                }
            },
            orderBy: { startDate: 'asc' }
        });

        return { success: true, events };

    } catch (e: any) {
        console.error("Error fetching events:", e);
        return { success: false, events: [], error: e.message || "Failed to fetch events" };
    }
}

export async function getEventsForLead(leadId: string) {
    try {
        const { authorized, companyId } = await checkEventPermission('read');
        if (!authorized || !companyId) return { success: false, events: [], error: "Unauthorized" };

        const events = await prisma.event.findMany({
            where: {
                companyId,
                participants: { some: { leadId } }
            },
            include: {
                organizer: { select: { id: true, name: true, image: true } }
            },
            orderBy: { startDate: 'desc' }
        });

        return { success: true, events };
    } catch (e: any) {
        console.error("Error fetching lead events:", e);
        return { success: false, events: [], error: e.message || "Failed to fetch lead events" };
    }
}

// --- NOTIFICATIONS & REMINDERS ---
export async function sendAutomatedEventReminders() {
    try {
        // Scaffold for Triggering Email/WhatsApp Reminders 24 hours before event
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const upcomingEvents = await prisma.event.findMany({
            where: {
                status: "SCHEDULED",
                startDate: {
                    gte: new Date(),
                    lte: tomorrow
                }
            },
            include: {
                participants: {
                    include: { lead: true, user: true }
                }
            }
        });

        // Loop through and fire notifications to Omnichannel / Email Service
        let notificationsQueued = 0;
        for (const event of upcomingEvents) {
            for (const participant of event.participants) {
                // Determine contact info
                const contactEmail = participant.lead?.email || participant.user?.email || participant.guestEmail;
                const contactPhone = participant.lead?.phone;

                if (contactEmail || contactPhone) {
                    console.log(`[Notification Engine]: Mock sending reminder for ${event.title} to ${contactEmail || contactPhone}`);
                    // await omnichannel.send({ type: "WHATSAPP", to: contactPhone, template: "event_reminder", ... })
                    notificationsQueued++;
                }
            }
        }

        return { success: true, queued: notificationsQueued };
    } catch (e: any) {
        console.error("Error sending reminders:", e);
        return { success: false, error: e.message || "Failed to trigger reminders" };
    }
}
