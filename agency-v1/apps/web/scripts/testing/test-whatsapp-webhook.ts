
async function main() {
    const url = 'http://localhost:3000/api/webhooks/channels/whatsapp';

    // Valid WhatsApp Webhook Payload
    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "888888888",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: {
                        "display_phone_number": "15555555555",
                        "phone_number_id": "123456789"
                    },
                    contacts: [{
                        profile: { name: "Integration Tester" },
                        "wa_id": "15550009999"
                    }],
                    messages: [{
                        from: "15550009999",
                        id: "wamid.TEST_ID_" + Date.now(),
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: "Hello! This is a verification message for the ultra-professional integration." },
                        type: "text"
                    }]
                },
                field: "messages"
            }]
        }]
    };

    console.log(`Sending webhook to ${url}...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const data = await response.json().catch(() => null);
        console.log('Response:', data);
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
}

main();
