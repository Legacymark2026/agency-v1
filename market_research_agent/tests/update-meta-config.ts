import { prisma } from '../lib/prisma';

async function updateMeta(companyId: string, pixelId: string, capiToken: string) {
    console.log(`\n🔧 Updating Meta Config for Company: ${companyId}`);
    
    const existing = await prisma.integrationConfig.findFirst({
        where: { companyId, provider: 'facebook' }
    });

    if (!existing) {
        console.error("❌ Error: No se encontró configuración de Facebook para esta empresa.");
        return;
    }

    const currentConfig = existing.config as any;
    const newConfig = {
        ...currentConfig,
        pixelId: pixelId.trim(),
        capiToken: capiToken.trim()
    };

    const updated = await prisma.integrationConfig.update({
        where: { id: existing.id },
        data: {
            config: newConfig as any,
            isEnabled: true
        }
    });

    const finalConfig = updated.config as any;

    console.log("✅ Configuración actualizada con éxito.");
    console.log(`   - Pixel ID: ${finalConfig?.pixelId}`);
    console.log(`   - CAPI Token: ${finalConfig?.capiToken ? 'Configurado (Oculto)' : 'Faltante'}`);
}

const companyId = process.argv[2];
const pixelId = process.argv[3];
const capiToken = process.argv[4];

if (!companyId || !pixelId || !capiToken) {
    console.log("Usage: npx tsx tests/update-meta-config.ts <COMPANY_ID> <PIXEL_ID> <CAPI_TOKEN>");
} else {
    // Robust validation to prevent common placeholder mistakes
    const isPlaceholder = (str: string) => {
        const upper = str.toUpperCase();
        return upper.includes('TU_') || upper.includes('_AQUI') || upper.includes('PLACEHOLDER') || upper.includes('TEXTO');
    };

    if (isPlaceholder(pixelId) || isPlaceholder(capiToken)) {
        console.error("\n❌ ERROR CRÍTICO: Sigues usando texto de ejemplo.");
        console.log(`Píxel detectado: "${pixelId}"`);
        console.log(`Token detectado: "${capiToken.slice(0, 10)}..."`);
        console.log("\n⚠️ DEBES REEMPLAZAR esos textos por tus datos reales de Meta Business.");
        process.exit(1);
    }

    // Pixel ID should only be numbers
    if (!/^\d+$/.test(pixelId.trim())) {
        console.error("\n❌ ERROR: El ID de Píxel debe ser solo números.");
        console.log(`Recibido: "${pixelId}"`);
        process.exit(1);
    }

    updateMeta(companyId, pixelId, capiToken).catch(console.error);
}
