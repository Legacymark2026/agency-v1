// scripts/fix-deal-stages.ts
// Diagnoses and fixes deal stages that don't match the STAGES config
// Run with: npx tsx scripts/fix-deal-stages.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

// Map of possible bad values -> correct stage
const STAGE_MAP: Record<string, string> = {
    'NUEVO': 'NEW',
    'new': 'NEW',
    'NEW_LEAD': 'NEW',
    'NUEVO_LEAD': 'NEW',
    'CONTACTADO': 'CONTACTED',
    'contacted': 'CONTACTED',
    'CALIFICADO': 'QUALIFIED',
    'qualified': 'QUALIFIED',
    'PROPUESTA': 'PROPOSAL',
    'proposal': 'PROPOSAL',
    'NEGOCIACION': 'NEGOTIATION',
    'NEGOCIACIÓN': 'NEGOTIATION',
    'negotiation': 'NEGOTIATION',
    'CERRADO_GANADO': 'WON',
    'CLOSED_WON': 'WON',
    'won': 'WON',
    'CERRADO_PERDIDO': 'LOST',
    'CLOSED_LOST': 'LOST',
    'lost': 'LOST',
};

async function main() {
    console.log('🔍 Diagnosticando stages de Deals en la DB...\n');

    const allDeals = await prisma.deal.findMany({
        select: { id: true, title: true, stage: true, companyId: true, value: true }
    });

    console.log(`📊 Total deals en DB: ${allDeals.length}`);
    
    // Group by stage
    const byStage: Record<string, number> = {};
    allDeals.forEach(d => {
        byStage[d.stage] = (byStage[d.stage] || 0) + 1;
    });
    
    console.log('\n📋 Distribución de stages actuales:');
    Object.entries(byStage).forEach(([stage, count]) => {
        const isValid = VALID_STAGES.includes(stage);
        console.log(`  ${isValid ? '✅' : '❌'} "${stage}": ${count} deals`);
    });

    // Find deals with invalid stages
    const invalidDeals = allDeals.filter(d => !VALID_STAGES.includes(d.stage));
    
    if (invalidDeals.length === 0) {
        console.log('\n✅ Todos los deals tienen stages válidos. El problema puede ser otro.');
        console.log('\n💡 Pista: verifica que companyId de los Deals coincida con el de la sesión actual.');
        
        // Show companyIds
        const companies = await prisma.company.findMany({ select: { id: true, name: true } });
        console.log('\n🏢 Compañías en DB:');
        companies.forEach(c => console.log(`  - ${c.name}: ${c.id}`));
        
        const dealCompanies = [...new Set(allDeals.map(d => d.companyId))];
        console.log('\n📦 CompanyIDs en Deals:', dealCompanies);
    } else {
        console.log(`\n⚠️  ${invalidDeals.length} deals con stages inválidos:`);
        invalidDeals.forEach(d => {
            const correctedStage = STAGE_MAP[d.stage] || 'NEW';
            console.log(`  Deal "${d.title}": "${d.stage}" → "${correctedStage}"`);
        });

        console.log('\n🔧 Corrigiendo stages inválidos...');
        for (const deal of invalidDeals) {
            const correctedStage = STAGE_MAP[deal.stage] || 'NEW';
            await prisma.deal.update({
                where: { id: deal.id },
                data: { stage: correctedStage }
            });
            console.log(`  ✅ Deal "${deal.title}": "${deal.stage}" → "${correctedStage}"`);
        }
        console.log('\n🎉 Corrección completada. Recarga el Pipeline.');
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
