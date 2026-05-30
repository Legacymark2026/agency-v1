const { PrismaClient } = require("@prisma/client");

const databaseUrl = "postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function main() {
  console.log("🏁 Starting manual table creation for Affiliate Service...");

  // 1. Crear ENUMs de forma segura
  console.log("Creating enums...");
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AffiliateStatus') THEN
        CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanType') THEN
        CREATE TYPE "PlanType" AS ENUM ('FIXED', 'PERCENTAGE');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutStatus') THEN
        CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
      END IF;
    END $$;
  `);

  // 2. Crear Tabla tbl_commission_plans
  console.log("Creating tbl_commission_plans...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tbl_commission_plans" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "type" "PlanType" NOT NULL,
      "value" DECIMAL(10,2) NOT NULL,
      "cookie_lifetime_int" INTEGER NOT NULL DEFAULT 30,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "col_schema_version" INTEGER NOT NULL DEFAULT 0,
      "col_deleted_at" TIMESTAMP(3),
      CONSTRAINT "tbl_commission_plans_pkey" PRIMARY KEY ("id")
    );
  `);

  // 3. Crear Tabla tbl_affiliate_profiles
  console.log("Creating tbl_affiliate_profiles...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tbl_affiliate_profiles" (
      "id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "status" "AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
      "commission_plan_id" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "col_schema_version" INTEGER NOT NULL DEFAULT 0,
      "col_deleted_at" TIMESTAMP(3),
      CONSTRAINT "tbl_affiliate_profiles_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "tbl_affiliate_profiles_commission_plan_id_fkey" FOREIGN KEY ("commission_plan_id") REFERENCES "tbl_commission_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  // Crear índices únicos para tbl_affiliate_profiles
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "tbl_affiliate_profiles_user_id_key" ON "tbl_affiliate_profiles"("user_id");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "tbl_affiliate_profiles_code_key" ON "tbl_affiliate_profiles"("code");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "tbl_affiliate_profiles_code_idx" ON "tbl_affiliate_profiles"("code");
  `);

  // 4. Crear Tabla tbl_affiliate_clicks
  console.log("Creating tbl_affiliate_clicks...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tbl_affiliate_clicks" (
      "id" TEXT NOT NULL,
      "affiliate_code" TEXT NOT NULL,
      "ip" TEXT NOT NULL,
      "user_agent" TEXT NOT NULL,
      "referer" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "col_schema_version" INTEGER NOT NULL DEFAULT 0,
      "col_deleted_at" TIMESTAMP(3),
      CONSTRAINT "tbl_affiliate_clicks_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "tbl_affiliate_clicks_affiliate_code_fkey" FOREIGN KEY ("affiliate_code") REFERENCES "tbl_affiliate_profiles"("code") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "tbl_affiliate_clicks_affiliate_code_idx" ON "tbl_affiliate_clicks"("affiliate_code");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "tbl_affiliate_clicks_ip_affiliate_code_idx" ON "tbl_affiliate_clicks"("ip", "affiliate_code");
  `);

  // 5. Crear Tabla tbl_affiliate_payouts
  console.log("Creating tbl_affiliate_payouts...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tbl_affiliate_payouts" (
      "id" TEXT NOT NULL,
      "affiliate_id" TEXT NOT NULL,
      "amount" DECIMAL(10,2) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PROCESSING',
      "paid_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "col_schema_version" INTEGER NOT NULL DEFAULT 0,
      "col_deleted_at" TIMESTAMP(3),
      CONSTRAINT "tbl_affiliate_payouts_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "tbl_affiliate_payouts_affiliate_id_idx" ON "tbl_affiliate_payouts"("affiliate_id");
  `);

  // 6. Crear Tabla tbl_affiliate_referrals
  console.log("Creating tbl_affiliate_referrals...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "tbl_affiliate_referrals" (
      "id" TEXT NOT NULL,
      "affiliate_id" TEXT NOT NULL,
      "referred_user_id" TEXT NOT NULL,
      "order_id" TEXT NOT NULL,
      "order_amount" DECIMAL(10,2) NOT NULL,
      "commission_amount" DECIMAL(10,2) NOT NULL,
      "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
      "payout_id" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "col_schema_version" INTEGER NOT NULL DEFAULT 0,
      "col_deleted_at" TIMESTAMP(3),
      CONSTRAINT "tbl_affiliate_referrals_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "tbl_affiliate_referrals_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "tbl_affiliate_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "tbl_affiliate_referrals_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "tbl_affiliate_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "tbl_affiliate_referrals_referred_user_id_key" ON "tbl_affiliate_referrals"("referred_user_id");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "tbl_affiliate_referrals_order_id_key" ON "tbl_affiliate_referrals"("order_id");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "tbl_affiliate_referrals_affiliate_id_idx" ON "tbl_affiliate_referrals"("affiliate_id");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "tbl_affiliate_referrals_order_id_idx" ON "tbl_affiliate_referrals"("order_id");
  `);

  console.log("🎉 All Affiliate tables and indexes created successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error creating Affiliate tables:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
