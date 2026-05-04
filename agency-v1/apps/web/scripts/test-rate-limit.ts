import fetch from 'node-fetch';

async function testRateLimit() {
    console.log("Iniciando prueba de estrés Anti-spam (Fase 4)...");
    const targetUrl = "http://localhost:3000/api/webhooks/channels/whatsapp";
    const totalRequests = 120;
    
    let successCount = 0;
    let blockedCount = 0;
    let errorCount = 0;

    // Fake payload for WhatsApp Meta Webhook
    const payload = {
        object: "whatsapp_business_account",
        entry: [{
            id: "123456789",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: { display_phone_number: "123456", phone_number_id: "test_recipient_id_1" },
                    contacts: [{ profile: { name: "Tester" }, wa_id: "123456" }],
                    messages: [{ from: "123456", id: "wamid.123", timestamp: "123456", type: "text", text: { body: "Hola Spam" } }]
                },
                field: "messages"
            }]
        }]
    };

    console.log(`Enviando ${totalRequests} peticiones webhooks en ráfaga...`);

    const promises = Array.from({ length: totalRequests }).map(async (_, i) => {
        try {
            const res = await fetch(targetUrl, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-Forwarded-For": "192.168.1.100" // Simulated IP
                },
                body: JSON.stringify(payload)
            });

            if (res.status === 429) {
                blockedCount++;
            } else {
                // 401 is expected because we don't have valid Meta signatures in the fake payload
                // But it shouldn't hit 429 if the rate limit allows it.
                // It evaluates rate limit BEFORE signature check (for IP) 
                // Wait! IP limit is evaluated first.
                successCount++;
            }
        } catch (e) {
            errorCount++;
        }
    });

    await Promise.all(promises);

    console.log("\n--- Resultados de la Prueba ---");
    console.log(`Total Enviados: ${totalRequests}`);
    console.log(`Pasaron IP Check (Status 401 expected): ${successCount}`);
    console.log(`Bloqueados por AntiSpam (Status 429): ${blockedCount}`);
    console.log(`Errores de conexión: ${errorCount}`);

    if (blockedCount > 0) {
        console.log("\n✅ ÉXITO: El sistema Anti-spam está funcionando y bloqueando ráfagas.");
    } else {
        console.log("\n❌ FALLO: No se detectó ningún bloqueo HTTP 429.");
    }
}

testRateLimit();
