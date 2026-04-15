import { prisma } from '../lib/prisma';

async function diagnose() {
    console.log("🔍 Diagnosticando Base de Datos en el Servidor...");
    
    try {
        const companies = await prisma.company.findMany({
            select: { id: true, name: true }
        });

        if (companies.length === 0) {
            console.log("⚠️ No se encontraron empresas en la base de datos.");
            return;
        }

        console.log("\n🏢 EMPRESAS DISPONIBLES:");
        for (const company of companies) {
            const configs = await prisma.integrationConfig.findMany({
                where: { companyId: company.id, provider: 'facebook' }
            });
            
            const hasConfig = configs.length > 0;
            const isEnabled = configs.some(c => c.isEnabled);
            const activeConfig = configs.find(c => c.isEnabled);
            const configKeys = activeConfig ? Object.keys(activeConfig.config as object) : [];
            
            console.log(`- [${company.id}] ${company.name}`);
            console.log(`  └─ Meta Config: ${hasConfig ? (isEnabled ? '✅ ACTIVA' : '⚠️ EXISTE PERO DESACTIVADA') : '❌ NO ENCONTRADA'}`);
            if (activeConfig) {
                console.log(`  └─ Keys encontradas: ${configKeys.join(', ') || 'VACIÓ'}`);
                
                const hasPixel = configKeys.includes('pixelId');
                const hasCapi = configKeys.includes('capiToken');
                const hasPageToken = configKeys.includes('accessToken');

                console.log(`  └─ Pixel ID: ${hasPixel ? '✅ OK' : '❌ FALTANTE'}`);
                console.log(`  └─ CAPI Token: ${hasCapi ? '✅ OK' : '❌ FALTANTE'}`);
                console.log(`  └─ Page Token: ${hasPageToken ? '✅ OK' : '❌ FALTANTE'}`);
            }
        }
        console.log("\n💡 INSTRUCCIÓN: Si dice 'NO ENCONTRADA', ve a la plataforma LegacyMark -> Configuración -> Integraciones y guarda tus datos de Meta primero.");

    } catch (error) {
        console.error("❌ Error de Prisma:", error);
    }
}

diagnose().catch(console.error);
