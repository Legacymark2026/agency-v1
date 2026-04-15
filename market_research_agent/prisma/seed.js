const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Explicitly load .env from root with custom parsing to handle "export " prefix
const envPath = path.resolve(__dirname, '../.env');

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log(`Debug: Loaded .env file (${envContent.length} bytes). Parsing...`);

        let dbUrlFound = false;

        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            // Match KEY=VAL, lenient on spaces, optional export prefix
            // Regex: start, optional export, capture KEY, optional spaces, =, optional spaces, capture VAL
            const match = trimmed.match(/^(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)$/);

            if (match) {
                const key = match[1];
                let val = match[2];

                // Remove quotes if wrapping the value
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }

                process.env[key] = val;

                if (key === 'DATABASE_URL') {
                    dbUrlFound = true;
                    console.log(`Debug: Found DATABASE_URL (length: ${val.length})`);
                } else {
                    // Log other keys found (useful for debugging structure)
                    console.log(`Debug: Found key '${key}'`);
                }
            } else {
                if (trimmed.includes('DATABASE_URL')) {
                    console.warn(`Debug: Skipped line containing DATABASE_URL due to regex mismatch: '${trimmed}'`);
                }
            }
        });

        if (dbUrlFound) {
            console.log("✓ Manually extracted DATABASE_URL from .env");
        } else {
            console.warn("⚠️ DATABASE_URL not found in .env via manual parsing.");
            console.warn("   Double check for typos or weird formatting.");
        }
    } else {
        console.warn("⚠️ .env file not found at:", envPath);
    }

} catch (err) {
    console.error("Error manually reading .env:", err.message);
}

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed (JS)...");

    // Clean existing experts
    try {
        // Check if we can connect first
        await prisma.$connect();
        await prisma.expert.deleteMany();
        console.log("✓ Cleaned experts");
    } catch (e) {
        console.warn("⚠️ Could not clean experts (DB connection issue?):", e.message);
        if (e.message.includes("DATABASE_URL")) {
            console.error("FATAL: DATABASE_URL is missing or invalid.");
            process.exit(1);
        }
    }

    // Seed Default Company
    console.log("Creating/Updating Default Company...");
    const company = await prisma.company.upsert({
        where: { slug: "legacymark" },
        update: {},
        create: {
            name: "LegacyMark SAS",
            slug: "legacymark",
            industry: "Technology",
            website: "https://legacymarksas.com",
            subscriptionTier: "enterprise",
            subscriptionStatus: "active",
        },
    });
    console.log(`✓ Default company ready: ${company.name}`);

    console.log("🎉 Seed complete!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
