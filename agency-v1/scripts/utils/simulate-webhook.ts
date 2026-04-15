
import crypto from 'crypto';

const APP_SECRET = process.env.META_APP_SECRET || 'test-secret';
const BASE_URL = 'http://localhost:3000/api/webhooks/channels';

function signBody(body: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(body));
    return `sha256=${hmac.digest('hex')}`;
}

async function sendWebhook(provider: string, body: any) {
    console.log(`\n--- Sending Webhook to ${provider.toUpperCase()} ---`);
    const signature = signBody(body, APP_SECRET);

    try {
        const res = await fetch(`${BASE_URL}/${provider}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hub-signature-256': signature
            },
            body: JSON.stringify(body)
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error("Failed to send webhook:", e);
    }
}

// Mock Payloads - Dynamic IDs
const FB_PAYLOAD = {
    object: "page",
    entry: [
        {
            id: "12345",
            time: Date.now(),
            messaging: [
                {
                    sender: { id: "user-123" },
                    recipient: { id: "page-123" },
                    timestamp: Date.now(),
                    message: { mid: "mid." + Date.now() + ":" + Math.random().toString(36).substring(7), text: "Hello Facebook! " + new Date().toISOString() }
                }
            ]
        }
    ]
};

const WA_PAYLOAD = {
    object: "whatsapp_business_account",
    entry: [
        {
            id: "88888",
            changes: [
                {
                    value: {
                        messaging_product: "whatsapp",
                        metadata: { display_phone_number: "16505551111", phone_number_id: "123456123" },
                        contacts: [{ profile: { name: "Kerry Fisher" }, wa_id: "16315551234" }],
                        messages: [{
                            from: "16315551234",
                            id: "wamid." + Date.now(),
                            timestamp: Math.floor(Date.now() / 1000).toString(),
                            text: { body: "Hello WhatsApp! " + new Date().toISOString() },
                            type: "text"
                        }]
                    },
                    field: "messages"
                }
            ]
        }
    ]
};

async function main() {
    // 1. Test Facebook
    await sendWebhook('facebook', FB_PAYLOAD);

    // 2. Test WhatsApp
    await sendWebhook('whatsapp', WA_PAYLOAD);

    // 3. Test Invalid Signature
    console.log(`\n--- Sending Invalid Signature ---`);
    await fetch(`${BASE_URL}/facebook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hub-signature-256': 'sha256=invalid'
        },
        body: JSON.stringify(FB_PAYLOAD)
    }).then(async r => console.log(`Status: ${r.status}`, await r.text()));
}

main();
