import { prisma } from "@/lib/prisma";

export interface EventAlertPayload {
    eventId: string;
    title: string;
    description?: string;
    type: "ONLINE" | "PHYSICAL" | "HYBRID";
    startDate: Date;
    recipients: {
        userId?: string;
        leadId?: string;
        email?: string;
        phone?: string;
    }[];
    metadata: any;
}

/**
 * Triggers an asynchronous notification flow for an event.
 * In a real production environment, this would push a job to a Queue (RabbitMQ, bullmq, AWS SQS)
 * to be picked up by a worker that sends the actual Email/SMS/WhatsApp.
 */
export async function queueEventNotification(payload: EventAlertPayload, scheduleTimeDelayMinutes: number = 0) {
    try {
        console.log(`[EventAlertService] Queuing notification for event: ${payload.title} (ID: ${payload.eventId})`);

        // 1. Determine delivery time
        const deliverAt = new Date();
        deliverAt.setMinutes(deliverAt.getMinutes() + scheduleTimeDelayMinutes);

        // 2. Prepare recipient list
        const recipientList = payload.recipients.map(r => {
            // Logic to fetch user email or lead phone if only IDs are provided
            return {
                ...r,
                // Mocking full details
                resolvedEmail: r.email || "resolved@example.com",
                resolvedPhone: r.phone || "+1234567890"
            };
        });

        // 3. Format Message based on type
        let messageBody = `Recordatorio de Evento: ${payload.title}\nFecha: ${payload.startDate.toLocaleString()}`;

        if (payload.type === "ONLINE" && payload.metadata?.meetingUrl) {
            messageBody += `\nEnlace de acceso: ${payload.metadata.meetingUrl}`;
        } else if (payload.type === "PHYSICAL" && payload.metadata?.address) {
            messageBody += `\nLugar: ${payload.metadata.address}`;
        }

        // 4. In a real system, you'd insert this into a NotificationQueue table
        // await prisma.notificationQueue.create({ ... })

        console.log(`[EventAlertService] Scheduled delivery at ${deliverAt.toISOString()} to ${recipientList.length} recipients.`);
        console.log(`[EventAlertService] Message Preview: \n${messageBody}`);

        return { success: true, queuedFor: deliverAt };

    } catch (error) {
        console.error("[EventAlertService] Failed to queue notification:", error);
        return { success: false, error };
    }
}
