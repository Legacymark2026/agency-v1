import { PrismaClient } from '@prisma/client';
import { recalculateLeadScore } from '../actions/crm-advanced';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Advanced Lead Scoring Test...");

    // 1. Get or create a company
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: { name: "Test Company" }
        });
    }
    const companyId = company.id;

    // 2. Clear old test data
    await prisma.leadScoringRule.deleteMany({ where: { companyId, name: { startsWith: "[TEST]" } } });
    await prisma.lead.deleteMany({ where: { email: "testscoring@example.com" } });

    // 3. Create Scoring Rules
    console.log("📝 Creating test scoring rules...");
    await prisma.leadScoringRule.createMany({
        data: [
            { companyId, name: "[TEST] Profile: Enterprise", field: "formData.companySize", operator: "equals", value: "Enterprise", points: 20 },
            { companyId, name: "[TEST] Intent: Pricing visits", field: "events.pricing_visits", operator: "greaterThan", value: "0", points: 15 },
            { companyId, name: "[TEST] Intent: Quote Request", field: "events.quote_requests", operator: "greaterThan", value: "0", points: 50 },
            { companyId, name: "[TEST] Profile: Budget > 1000", field: "formData.budget", operator: "greaterThan", value: "1000", points: 15 },
        ]
    });

    // 4. Create a Test Lead
    console.log("👤 Creating test lead...");
    const lead = await prisma.lead.create({
        data: {
            companyId,
            name: "Test Scorer",
            email: "testscoring@example.com",
            source: "DIRECT",
            status: "NEW",
            formData: {
                companySize: "Enterprise",
                budget: 5000
            }
        }
    });

    // 5. Add Marketing Events (Interactions & Intent)
    console.log("📊 Adding marketing events for lead...");
    await prisma.marketingEvent.createMany({
        data: [
            // Pricing visit
            { companyId, leadId: lead.id, eventType: "PAGE_VIEW", url: "https://example.com/precios" },
            { companyId, leadId: lead.id, eventType: "PAGE_VIEW", url: "https://example.com/precios" },
            // Quote request
            { companyId, leadId: lead.id, eventType: "FORM_SUBMIT", eventName: "Formulario Cotizar" },
            // Random webinar (no rule for this, but good for test)
            { companyId, leadId: lead.id, eventType: "WEBINAR", eventName: "Webinar Intro" }
        ]
    });

    // 6. Recalculate Score
    console.log("⚙️ Recalculating score...");
    // Expected score: 
    // Enterprise = +20
    // Pricing > 0 = +15
    // Quote > 0 = +50
    // Budget > 1000 = +15
    // Total Expected: 100

    const result = await recalculateLeadScore(lead.id, companyId);
    console.log("✅ Recalculation Result:", result);

    const updatedLead = await prisma.lead.findUnique({
        where: { id: lead.id },
        select: { score: true }
    });

    console.log(`🎯 Final Lead Score in DB: ${updatedLead?.score}`);

    if (updatedLead?.score === 100) {
        console.log("🎉 SUCCESS: Score is perfectly calculated!");
    } else {
        console.log("❌ FAILED: Score mismatch.");
    }
}

main()
    .catch(e => {
        console.error("Error running test:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
