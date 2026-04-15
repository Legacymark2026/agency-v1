
import { prisma } from "../lib/prisma";

async function seedDeals() {
    console.log("🌱 Seeding CRM Deals...");

    // Ensure we have a company (Using first found or creating strict default)
    let company = await prisma.company.findFirst();
    if (!company) {
        // Fallback if no company exists (unlikely in dev but good for safety)
        company = await prisma.company.create({
            data: { name: "Demo Agency", slug: "demo-agency" }
        });
    }

    const companyId = company.id;

    const deals = [
        { title: "Website Redesign - TechCorp", value: 15000, stage: "NEW", priority: "HIGH", contactName: "John Doe" },
        { title: "SEO Monthly Retainer - LocalBiz", value: 2500, stage: "CONTACTED", priority: "MEDIUM", contactName: "Jane Smith" },
        { title: "Mobile App Logic - StartupX", value: 45000, stage: "PROPOSAL", priority: "HIGH", contactName: "Mike Founder" },
        { title: "Social Media Ads - CoffeeShop", value: 1200, stage: "NEGOTIATION", priority: "LOW", contactName: "Sarah Barista" },
        { title: "Q3 Strategy Audit", value: 5000, stage: "WON", priority: "MEDIUM", contactName: "Enterprise Client" },
        { title: "Consulting Hour", value: 300, stage: "LOST", priority: "LOW", contactName: "Cheap Lead" },
    ];

    for (const deal of deals) {
        await prisma.deal.create({
            data: {
                ...deal,
                companyId,
                contactEmail: `${deal.contactName.split(' ')[0].toLowerCase()}@example.com`
            }
        });
    }

    console.log(`✅ Created ${deals.length} deals for company ${company.name}`);
}

seedDeals()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
