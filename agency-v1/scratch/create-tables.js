const { PrismaClient } = require('@prisma/client');

const databaseUrl = "postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function main() {
  console.log("Creating LeadAssignmentRule table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tbl_lead_assignment_rules" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "priority" INTEGER NOT NULL DEFAULT 0,
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "conditions" JSONB NOT NULL,
      "assigned_user_id" TEXT,
      "team_id" TEXT,
      "round_robin_enabled" BOOLEAN NOT NULL DEFAULT false,
      "company_id" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "tbl_lead_assignment_rules_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "tbl_lead_assignment_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tbl_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  console.log("Creating index on company_id...");
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "tbl_lead_assignment_rules_company_id_idx" ON "tbl_lead_assignment_rules"("company_id");
  `);

  console.log("Creating LeadAssignmentRoundRobinState table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tbl_lead_assignment_round_robin_states" (
      "id" TEXT NOT NULL,
      "rule_id" TEXT,
      "team_id" TEXT,
      "last_assigned_user_id" TEXT NOT NULL,
      "company_id" TEXT NOT NULL,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "tbl_lead_assignment_round_robin_states_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "tbl_lead_assignment_round_robin_states_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "tbl_lead_assignment_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  console.log("Creating unique constraint 1...");
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "tbl_lead_assignment_round_robin_states_company_id_rule_id_key" ON "tbl_lead_assignment_round_robin_states"("company_id", "rule_id");
  `);

  console.log("Creating unique constraint 2...");
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "tbl_lead_assignment_round_robin_states_company_id_team_id_key" ON "tbl_lead_assignment_round_robin_states"("company_id", "team_id");
  `);

  console.log("Tables created successfully!");
}

main()
  .catch(e => {
    console.error("Error creating tables:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
