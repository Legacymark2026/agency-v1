
import { automationHub } from "../../lib/integrations/providers";
import { getSystemIntegrationConfig } from "../../lib/integration-config-service";
import crypto from "crypto";
import 'dotenv/config';

/**
 * LegacyMark Meta Messaging Tester
 * -------------------------------
 * Este script permite probar el envío y la recepción de mensajes
 * incluyendo notas de voz.
 */

async function main() {
    const args = process.argv.slice(2);
    const mode = args[0]; // 'send' o 'receive'

    if (!mode || (mode !== 'send' && mode !== 'receive' && mode !== 'status')) {
        console.log(`
🚀 Meta Messaging Tester - Uso:
------------------------------
📊 Estado:
  npx tsx scripts/testing/test-meta-messaging.ts status

📤 Enviar Mensaje (Real):
  npx tsx scripts/testing/test-meta-messaging.ts send --channel [whatsapp|messenger|instagram] --to [ID] --text "hola"
  npx tsx scripts/testing/test-meta-messaging.ts send --channel [channel] --to [ID] --voice [URL_AUDIO]

📥 Simular Recepción (Mock Webhook):
  npx tsx scripts/testing/test-meta-messaging.ts receive --channel [channel] --from [ID] --text "mensaje entrante"
        `);
        return;
    }

    // Help parse args
    const getArg = (name: string) => {
        const idx = args.indexOf(name);
        return idx !== -1 ? args[idx+1] : null;
    };

    if (mode === 'status') {
        console.log("🔍 Verificando configuración...");
        const wa = await getSystemIntegrationConfig('whatsapp');
        const fb = await getSystemIntegrationConfig('facebook');

        console.log("\n[WhatsApp]");
        console.log(`- Token: ${wa?.accessToken ? '✅ Configurado' : '❌ Falta'}`);
        console.log(`- Phone ID: ${wa?.phoneNumberId || '❌ Falta'}`);

        console.log("\n[Facebook/Messenger]");
        console.log(`- Token: ${fb?.accessToken ? '✅ Configurado' : '❌ Falta'}`);
        console.log(`- App Secret: ${fb?.appSecret ? '✅ Configurado' : '❌ Falta'}`);

        return;
    }

    if (mode === 'send') {
        const channel = getArg('--channel') as any;
        const to = getArg('--to');
        const text = getArg('--text') || "Prueba desde LegacyMark";
        const voice = getArg('--voice');

        if (!channel || !to) {
            console.error("❌ Error: Faltan parámetros --channel o --to");
            return;
        }

        console.log(`🚀 Enviando ${voice ? 'Nota de Voz' : 'Texto'} a ${to} vía ${channel.toUpperCase()}...`);

        const attachments = voice ? [{ type: 'audio' as const, url: voice }] : undefined;

        const result = await automationHub.sendMessage(channel.toUpperCase(), {
            conversationId: to,
            content: text,
            attachments
        });

        if (result.success) {
            console.log(`✅ Mensaje enviado exitosamente! ID: ${result.messageId}`);
        } else {
            console.error(`❌ Fallo el envío: ${result.error}`);
        }
    }

    if (mode === 'receive') {
        const channel = getArg('--channel') || 'whatsapp';
        const from = getArg('--from') || '123456789';
        const text = getArg('--text') || "Hola, soy un mensaje de simulación";
        
        console.log(`📥 Simulando evento de recepción para ${channel.toUpperCase()}...`);

        // 1. Construir Payload según canal
        let payload: any = {};
        const timestamp = Math.floor(Date.now() / 1000);
        const mid = `mid.mock.${Date.now()}`;

        if (channel === 'whatsapp') {
            payload = {
                object: "whatsapp_business_account",
                entry: [{
                    id: "WHATSAPP_ID",
                    changes: [{
                        value: {
                            messaging_product: "whatsapp",
                            metadata: { display_phone_number: "SYSTEM", phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID },
                            contacts: [{ profile: { name: "Test User" }, wa_id: from }],
                            messages: [{ from: from, id: mid, timestamp: timestamp.toString(), text: { body: text }, type: "text" }]
                        },
                        field: "messages"
                    }]
                }]
            };
        } else {
            payload = {
                object: "page",
                entry: [{
                    id: "PAGE_ID",
                    time: Date.now(),
                    messaging: [{
                        sender: { id: from },
                        recipient: { id: "PAGE_ID" },
                        timestamp: Date.now(),
                        message: { mid: mid, text: text }
                    }]
                }]
            };
        }

        const rawBody = JSON.stringify(payload);
        
        // 2. Firmar payload
        const appSecret = process.env.META_APP_SECRET || "DEV_SECRET";
        const signature = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

        // 3. Enviar al Webhook Local
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/webhooks/channels/${channel}`;

        console.log(`🔗 Llamando a ${url}...`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hub-signature-256': signature
                },
                body: rawBody
            });

            const result = await response.json();
            if (response.ok) {
                console.log("✅ Simulación procesada correctamente por el backend.");
                console.log("   Verifica el Inbox en el Dashboard para ver el nuevo Lead/Mensaje.");
            } else {
                console.error(`❌ Error en el backend (${response.status}):`, result);
            }
        } catch (e: any) {
            console.error("❌ Error conectando al servidor local. ¿Esta corriendo el proyecto (npm run dev)?", e.message);
        }
    }
}

main().catch(console.error);
