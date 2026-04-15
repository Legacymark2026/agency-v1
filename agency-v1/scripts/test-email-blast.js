/**
 * Script de diagnóstico para Email Blast
 * Uso: node scripts/test-email-blast.js tu@correo.com
 */
require('dotenv').config({ path: '.env' });

const TO_EMAIL = process.argv[2] || 'test@example.com';

async function run() {
    console.log('\n══════════════════════════════════════════');
    console.log('  DIAGNÓSTICO EMAIL BLAST — LegacyMark   ');
    console.log('══════════════════════════════════════════\n');

    // ── 1. Variables de entorno ───────────────────────────────────────────────
    console.log('📋 [1/4] Verificando variables de entorno...');
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('   ❌ RESEND_API_KEY no está configurada en .env');
        process.exit(1);
    }
    if (!apiKey.startsWith('re_')) {
        console.error('   ❌ RESEND_API_KEY tiene formato incorrecto (debe empezar con re_)');
        process.exit(1);
    }
    console.log(`   ✅ RESEND_API_KEY cargada: ${apiKey.slice(0, 10)}...`);

    // ── 2. Conexión a Prisma ─────────────────────────────────────────────────
    console.log('\n📋 [2/4] Verificando conexión a base de datos...');
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$connect();

        // Verificar que la tabla email_blasts existe
        const count = await prisma.emailBlast.count();
        console.log(`   ✅ Tabla email_blasts existe. Registros: ${count}`);
        await prisma.$disconnect();
    } catch (err) {
        console.error('   ❌ Error de Prisma:', err.message);
        if (err.message.includes('does not exist')) {
            console.error('   💡 Solución: Ejecuta npx prisma migrate deploy');
        }
        process.exit(1);
    }

    // ── 3. Conexión a Resend API ─────────────────────────────────────────────
    console.log('\n📋 [3/4] Verificando conexión a Resend API...');
    try {
        const response = await fetch('https://api.resend.com/domains', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (!response.ok) {
            console.error(`   ❌ Error de autenticación: ${data.message || response.status}`);
            process.exit(1);
        }

        console.log(`   ✅ Conexión a Resend OK`);

        if (data.data && data.data.length > 0) {
            console.log('   📌 Dominios verificados:');
            data.data.forEach(d => {
                const status = d.status === 'verified' ? '✅' : '⏳';
                console.log(`      ${status} ${d.name} — ${d.status}`);
            });
        } else {
            console.warn('   ⚠️  No tienes dominios verificados en Resend');
        }
    } catch (err) {
        console.error('   ❌ Error al conectar a Resend:', err.message);
        process.exit(1);
    }

    // ── 4. Envío de correo de prueba ─────────────────────────────────────────
    console.log(`\n📋 [4/4] Enviando correo de prueba a: ${TO_EMAIL}...`);
    try {
        const fromEmail = 'noreply@legacymarksas.com';
        console.log(`   🔸 Remitente: ${fromEmail}`);
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `LegacyMark <${fromEmail}>`,
                to: [TO_EMAIL],
                subject: '🚀 Prueba Crítica de Entrega — LegacyMark',
                html: `
                    <div style="font-family:sans-serif; max-width:600px; margin:auto; border:1px solid #eee; padding:20px; border-radius:10px;">
                        <h1 style="color:#0d9488">Verificación de Entrega</h1>
                        <p>Este es un correo de prueba técnica para verificar la configuración de <b>SPF, DKIM y DMARC</b>.</p>
                        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
                        <p style="font-size:12px; color:#666;">
                            Enviado desde el servidor de producción el ${new Date().toLocaleString('es-CO')}
                        </p>
                    </div>
                `
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`   ❌ Error al enviar: [${response.status}] ${JSON.stringify(data)}`);
            process.exit(1);
        }

        console.log(`   ✅ ¡Correo enviado exitosamente!`);
        console.log(`   🆔 ID de Resend: ${data.id}`);
        console.log('\n══════════════════════════════════════════');
        console.log('  ⚠️  SIGUIENTE PASO:                    ');
        console.log('  1. Revisa tu bandeja de entrada.       ');
        console.log('  2. Si no llegó, revisa SPAM (podría tardar 2-3 min)');
        console.log('  3. Si SIGUE sin llegar, ve a resend.com');
        console.log('     y revisa "Emails" -> "Activity" para');
        console.log('     ver por qué rebotó (Bounced).       ');
        console.log('══════════════════════════════════════════\n');
    } catch (err) {
        console.error('   ❌ Error inesperado:', err.message);
        process.exit(1);
    }
}

run().catch(err => {
    console.error('\n❌ Error fatal:', err.message);
    process.exit(1);
});
