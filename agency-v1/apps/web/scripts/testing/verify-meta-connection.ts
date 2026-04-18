
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("\n🔍 \x1b[36mINICIANDO DIAGNÓSTICO ULTRA-PROFESIONAL DE META INTEGRATION\x1b[0m");
    console.log("============================================================\n");

    // 1. Check Environment Variables
    console.log("\x1b[33m1. Verificando Variables de Entorno (Sistema de Respaldo)\x1b[0m");
    const envAppId = process.env.FACEBOOK_CLIENT_ID;
    const envSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    if (envAppId) console.log(`   ✅ FACEBOOK_CLIENT_ID:  \x1b[32mPresente (${envAppId.slice(0, 4)}...${envAppId.slice(-4)})\x1b[0m`);
    else console.log("   ❌ FACEBOOK_CLIENT_ID:  \x1b[31mFaltante\x1b[0m");

    if (envSecret) console.log(`   ✅ FACEBOOK_CLIENT_SECRET: \x1b[32mPresente (********)\x1b[0m`);
    else console.log("   ❌ FACEBOOK_CLIENT_SECRET: \x1b[31mFaltante\x1b[0m");

    if (nextAuthUrl) console.log(`   ✅ NEXTAUTH_URL:        \x1b[32m${nextAuthUrl}\x1b[0m (Crítico para Redirect URI)`);
    else console.log("   ⚠️ NEXTAUTH_URL:        \x1b[33mNo definido (Se usará req.url, riesgoso en Prod)\x1b[0m");

    // 2. Check Database Configuration
    console.log("\n\x1b[33m2. Verificando Configuración en Base de Datos (Sistema Principal)\x1b[0m");
    try {
        const configs = await prisma.integrationConfig.findMany({
            where: { provider: 'facebook' },
            include: { company: true }
        });

        if (configs.length === 0) {
            console.log("   ⚠️ \x1b[33mNo se encontraron configuraciones en DB.\x1b[0m");
            console.log("      -> El sistema usará las Variables de Entorno automáticamente.");
        } else {
            console.log(`   ℹ️ Se encontraron ${configs.length} configuraciones.`);
            configs.forEach((cfg, idx) => {
                const data = cfg.config as any;
                const companyName = cfg.company?.name || "Sin Compañía";
                console.log(`      [${idx + 1}] Company: ${companyName} | AppID: ${data.appId ? data.appId.slice(0, 4) + '...' : 'N/A'} | Token: ${data.accessToken ? '✅ Si' : '❌ No'}`);

                if (data.appId && envAppId && data.appId !== envAppId) {
                    console.log("      ⚠️ \x1b[33mADVERTENCIA: El AppID de BD no coincide con el de ENV.\x1b[0m");
                    console.log("         -> El sistema priorizará la BD. Asegúrate que sea el correcto.");
                }
            });
        }
    } catch (error) {
        console.log("   ❌ Error conectando a BD:", error);
    }

    // 3. Network Check
    console.log("\n\x1b[33m3. Prueba de Conectividad con Facebook API\x1b[0m");
    try {
        const start = Date.now();
        const res = await fetch("https://graph.facebook.com/v19.0/");
        const duration = Date.now() - start;

        if (res.status === 200 || res.status === 400) { // 400 is fine, means we reached it but sent no params
            console.log(`   ✅ Conexión Exitosa (${duration}ms)`);
        } else {
            console.log(`   ❌ Error de conexión: Status ${res.status}`);
        }
    } catch (error) {
        console.log("   ❌ Error de red:", error);
    }

    // 4. Redirect URI Validation
    console.log("\n\x1b[33m4. Validación de Redirect URI\x1b[0m");
    const domain = nextAuthUrl || "http://localhost:3000";
    const expectedUri = `${domain}/api/integrations/facebook/callback`;
    console.log(`   ℹ️ URL de Retorno Esperada: \x1b[36m${expectedUri}\x1b[0m`);
    console.log("   👉 \x1b[1mAsegúrate de que esta URL exacta esté en la 'Facebook App Settings' > 'Valid OAuth Redirect URIs'\x1b[0m");

    console.log("\n============================================================");
    console.log("✅ DIAGNÓSTICO COMPLETADO");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
