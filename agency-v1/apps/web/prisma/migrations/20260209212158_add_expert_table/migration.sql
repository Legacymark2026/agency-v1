/*
  Warnings:

  - You are about to drop the column `event_value` on the `analytics_events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "analytics_events" DROP COLUMN "event_value";

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "assigned_to" TEXT;

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "image_url" TEXT,
    "social_links" JSONB DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'AB_TEST',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "variants" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "results" JSONB,
    "winner_id" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author_id" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_activities_deal_id_idx" ON "crm_activities"("deal_id");

-- CreateIndex
CREATE INDEX "crm_activities_user_id_idx" ON "crm_activities"("user_id");

-- CreateIndex
CREATE INDEX "crm_activities_created_at_idx" ON "crm_activities"("created_at");

-- CreateIndex
CREATE INDEX "experts_order_idx" ON "experts"("order");

-- CreateIndex
CREATE INDEX "experts_is_visible_idx" ON "experts"("is_visible");

-- CreateIndex
CREATE INDEX "experiments_company_id_idx" ON "experiments"("company_id");

-- CreateIndex
CREATE INDEX "experiments_status_idx" ON "experiments"("status");

-- CreateIndex
CREATE INDEX "annotations_company_id_idx" ON "annotations"("company_id");

-- CreateIndex
CREATE INDEX "annotations_date_idx" ON "annotations"("date");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
