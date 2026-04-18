const crypto = require('crypto');
const http = require('http');

// Configuration
// Usage: APP_SECRET=xyz PHONE_NUMBER_ID=123 node scripts/test-whatsapp-webhook.js
const APP_SECRET = process.env.APP_SECRET || 'test_secret';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '123456789';
const HOST = process.env.HOST || 'http://localhost:3000';

console.log(`Using PHONE_NUMBER_ID: ${PHONE_NUMBER_ID}`);
console.log(`Using APP_SECRET: ${APP_SECRET}`);
console.log(`Target: ${HOST}/api/integrations/whatsapp/webhook`);

const payload = {
    object: "whatsapp_business_account",
    entry: [
        {
            id: "88888888",
            changes: [
                {
                    value: {
                        messaging_product: "whatsapp",
                        metadata: {
                            display_phone_number: "15555555555",
                            phone_number_id: PHONE_NUMBER_ID
                        },
                        contacts: [{ profile: { name: "Test User" }, wa_id: "573001234567" }],
                        messages: [
                            {
                                from: "573001234567",
                                id: "wamid.test." + Date.now(),
                                timestamp: Math.floor(Date.now() / 1000).toString(),
                                text: { body: "Hola, prueba de webhook local!" },
                                type: "text"
                            }
                        ]
                    },
                    field: "messages"
                }
            ]
        }
    ]
};

const body = JSON.stringify(payload);
const signature = crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');

const url = new URL(`${HOST}/api/integrations/whatsapp/webhook`);

const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': `sha256=${signature}`,
        'Content-Length': Buffer.byteLength(body)
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => console.log(`Response: ${chunk}`));
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(body);
req.end();
