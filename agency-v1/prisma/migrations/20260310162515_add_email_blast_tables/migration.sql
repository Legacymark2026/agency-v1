-- CreateTable
CREATE TABLE "email_blasts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "from_name" TEXT NOT NULL DEFAULT 'LegacyMark',
    "from_email" TEXT NOT NULL DEFAULT 'noreply@legacymarksas.com',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "company_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_blasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_blast_recipients" (
    "id" TEXT NOT NULL,
    "blast_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "variables" JSONB DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "email_blast_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_blasts_company_id_idx" ON "email_blasts"("company_id");

-- CreateIndex
CREATE INDEX "email_blasts_status_idx" ON "email_blasts"("status");

-- CreateIndex
CREATE INDEX "email_blast_recipients_blast_id_idx" ON "email_blast_recipients"("blast_id");

-- CreateIndex
CREATE INDEX "email_blast_recipients_status_idx" ON "email_blast_recipients"("status");

-- AddForeignKey
ALTER TABLE "email_blast_recipients" ADD CONSTRAINT "email_blast_recipients_blast_id_fkey" FOREIGN KEY ("blast_id") REFERENCES "email_blasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
