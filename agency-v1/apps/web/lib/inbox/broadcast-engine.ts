/**
 * apps/web/lib/inbox/broadcast-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de Envíos Masivos Broadcast por WhatsApp/Email con Delay Estocástico Antiban.
 *
 * Aplica variaciones aleatorias de tiempo entre envíos (Jitter Delay)
 * para evitar la detección por algoritmos de SPAM de Meta y proveedores de email.
 */

export interface BroadcastRecipient {
    id: string;
    name: string;
    phoneOrEmail: string;
    variables?: Record<string, string>;
}

export interface BroadcastQueueItem {
    recipient: BroadcastRecipient;
    messageText: string;
    scheduledDelayMs: number;
    status: 'QUEUED' | 'SENT' | 'FAILED';
}

export interface BroadcastCampaignResult {
    campaignId: string;
    totalRecipients: number;
    estimatedDurationSeconds: number;
    queue: BroadcastQueueItem[];
}

export function calculateStochasticDelayMs(minDelayMs: number = 1500, maxDelayMs: number = 4200): number {
    return Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
}

export function queueBroadcastCampaign(
    templateText: string,
    recipients: BroadcastRecipient[]
): BroadcastCampaignResult {
    const campaignId = `CAMP-${Date.now().toString().substring(5)}`;
    let accumulatedDelayMs = 0;

    const queue: BroadcastQueueItem[] = recipients.map(recipient => {
        const jitter = calculateStochasticDelayMs(1500, 4200);
        accumulatedDelayMs += jitter;

        // Personalize template text
        let personalizedMsg = templateText;
        if (recipient.variables) {
            Object.entries(recipient.variables).forEach(([key, val]) => {
                personalizedMsg = personalizedMsg.replace(new RegExp(`{{${key}}}`, 'g'), val);
            });
        }
        personalizedMsg = personalizedMsg.replace(/{{nombre}}/gi, recipient.name);

        return {
            recipient,
            messageText: personalizedMsg,
            scheduledDelayMs: accumulatedDelayMs,
            status: 'QUEUED',
        };
    });

    const estimatedDurationSeconds = Math.ceil(accumulatedDelayMs / 1000);

    return {
        campaignId,
        totalRecipients: recipients.length,
        estimatedDurationSeconds,
        queue,
    };
}
