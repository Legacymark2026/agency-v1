import crypto from 'crypto';

/**
 * Meta Conversions API (CAPI) Utility
 * 
 * Documentation: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

interface UserData {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    externalId?: string | null;      // SHA-256 hashed CRM ID — deduplication cross-platform
    fbc?: string | null;             // fb.1.<timestamp>.<fbclid> — click attribution
    fbp?: string | null;             // Facebook browser cookie
    clientIpAddress?: string | null;
    clientUserAgent?: string | null;
}

interface CustomData {
    value?: number;
    currency?: string;
    contentName?: string;
    leadType?: string;
    [key: string]: any;
}

/**
 * Hash data using SHA-256 as required by Meta PII standards.
 */
function hashData(data: string | null | undefined): string | null {
    if (!data) return null;
    const cleanData = data.trim().toLowerCase();
    return crypto.createHash('sha256').update(cleanData).digest('hex');
}

/**
 * Sends a server-side event to Meta Conversions API.
 */
export async function sendMetaCapiEvent({
    pixelId,
    accessToken,
    eventName,
    userData,
    customData,
    eventSourceUrl,
    eventId,
    testEventCode,
}: {
    pixelId: string;
    accessToken: string;
    eventName: 'Lead' | 'Contact' | 'Purchase' | 'CompleteRegistration' | 'QualifiedLead' | 'ViewContent' | 'InitiateCheckout' | 'Other';
    userData: UserData;
    customData?: CustomData;
    eventSourceUrl?: string;
    /**
     * CRITICAL for deduplication: must match the eventID sent by the browser pixel.
     * Format: `${leadId}_${eventName}` — Meta merges server + browser events with same ID.
     */
    eventId?: string;
    testEventCode?: string; // Used for testing in Events Manager
}) {
    if (!pixelId || !accessToken) {
        console.warn('[Meta CAPI] Missing Pixel ID or Access Token. Event skipped.');
        return { success: false, error: 'Missing credentials' };
    }

    const cleanPixelId = pixelId.trim();
    const cleanToken = accessToken.trim();

    const timestamp = Math.floor(Date.now() / 1000);
    // Auto-generate event_id if not provided — used for pixel deduplication
    const resolvedEventId = eventId || `${eventName}_${timestamp}_${Math.random().toString(36).slice(2, 9)}`;

    // QualifiedLead is not a standard Meta event — map it to Other with custom_data label
    let resolvedEventName = eventName;
    let resolvedCustomData = customData || {};

    if (eventName === 'QualifiedLead') {
        resolvedEventName = 'Other';
        resolvedCustomData = {
            ...resolvedCustomData,
            event_name: 'QualifiedLead'
        };
    }

    const payload = {
        data: [
            {
                event_name: resolvedEventName,
                event_time: timestamp,
                // 'system_generated' for CRM/backend events; callers may override via customData
                action_source: 'system_generated',
                event_source_url: eventSourceUrl || '',
                // DEDUPLICATION: same event_id must be sent by browser pixel fbq('track', ..., {eventID})
                event_id: resolvedEventId,
                user_data: {
                    em: userData.email ? [hashData(userData.email)] : [],
                    ph: userData.phone ? [hashData(userData.phone)] : [],
                    fn: userData.firstName ? [hashData(userData.firstName)] : [],
                    ln: userData.lastName ? [hashData(userData.lastName)] : [],
                    // external_id links CRM identity to ad platform identity (cross-platform matching)
                    external_id: userData.externalId ? [hashData(userData.externalId)] : [],
                    fbc: userData.fbc || null,
                    fbp: userData.fbp || null,
                    client_ip_address: userData.clientIpAddress || null,
                    client_user_agent: userData.clientUserAgent || null,
                },
                custom_data: resolvedCustomData,
            },
        ],
        ...(testEventCode && { test_event_code: testEventCode }),
    };

    try {
        const url = `https://graph.facebook.com/v19.0/${cleanPixelId}/events`;
        
        // Debug exactly what we are sending
        console.log(`[Meta CAPI] DEBUG - URL: ${url}`);
        console.log(`[Meta CAPI] DEBUG - Payload:`, JSON.stringify(payload, null, 2).slice(0, 1000));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanToken}`
            },
            body: JSON.stringify(payload),
        });

        const contentType = response.headers.get('content-type');
        let result: any;

        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.error('[Meta CAPI] Non-JSON response received:', text.slice(0, 200));
            return { success: false, error: `Invalid response format (HTTP ${response.status})` };
        }

        if (!response.ok) {
            console.error('[Meta CAPI] Error response:', result);
            return { success: false, error: result.error?.message || 'Unknown error' };
        }

        console.log(`[Meta CAPI] Event "${eventName}" sent successfully:`, result);
        return { success: true, result };
    } catch (error) {
        console.error('[Meta CAPI] Request failed:', error);
        return { success: false, error: 'Fetch failed' };
    }
}
