
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const prisma = new PrismaClient();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

async function main() {
    console.log("\n🛠️  \x1b[36mSETUP DE PRODUCCIÓN: META (FACEBOOK) INTEGRATION\x1b[0m");
    console.log("====================================================\n");
    console.log("Este script configurará directamente la base de datos de producción.");
    console.log("Esto es necesario si las variables de entorno no están funcionando.\n");

    const appId = await question("👉 Ingresa tu Facebook App ID: ");
    const appSecret = await question("👉 Ingresa tu Facebook App Secret: ");

    if (!appId || !appSecret) {
        console.error("\n❌ Error: ID y Secreto son requeridos.");
        process.exit(1);
    }

    console.log("\n🔄 Buscando/Creando Compañía...");

    // 1. Find or Create Default Company
    let company = await prisma.company.findFirst();
    if (!company) {
        console.log("   -> No se encontró compañía. Creando 'Default Company'...");
        company = await prisma.company.create({
            data: {
                name: "LegacyMark Production",
                slug: "legacymark-prod",
            }
        });
    }
    console.log(`   ✅ Compañía ID: ${company.id} (${company.name})`);

    // 2. Upsert Config
    console.log("\n💾 Guardando Configuración en Base de Datos...");

    await prisma.integrationConfig.upsert({
        where: {
            companyId_provider: {
                companyId: company.id,
                provider: "facebook"
            }
        },
        update: {
            config: {
                appId: appId.trim(),
                appSecret: appSecret.trim()
            },
            isEnabled: true
        },
        create: {
            companyId: company.id,
            provider: "facebook",
            config: {
                appId: appId.trim(),
                appSecret: appSecret.trim()
            },
            isEnabled: true
        }
    });

    console.log("\n✅ \x1b[32mCONFIGURACIÓN GUARDADA EXITOSAMENTE.\x1b[0m");
    console.log("   Ahora el sistema usará estos datos prioritariamente.");
    console.log("\n⚠️  IMPORTANTE: Asegúrate de tener NEXTAUTH_URL configurado en Vercel/Railway.");

    process.exit(0);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
