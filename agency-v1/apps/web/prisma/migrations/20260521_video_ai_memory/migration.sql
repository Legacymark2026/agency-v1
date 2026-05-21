-- AlterTable
ALTER TABLE "tbl_video_editor_projects" ADD COLUMN "brand_style_id" TEXT;

-- CreateTable
CREATE TABLE "tbl_video_ai_sessions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "initial_prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_video_ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_video_ai_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tool_calls" JSONB,
    "tool_results" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_video_ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_video_edit_history" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "before_state" JSONB NOT NULL,
    "after_state" JSONB NOT NULL,
    "undone" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_video_edit_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_brand_styles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "primary_color" TEXT NOT NULL DEFAULT '#6D28D9',
    "secondary_color" TEXT NOT NULL DEFAULT '#FFFFFF',
    "accent_color" TEXT NOT NULL DEFAULT '#10B981',
    "font_family" TEXT NOT NULL DEFAULT 'Inter',
    "subtitle_preset" JSONB NOT NULL,
    "style_embedding" TEXT,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_brand_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_asset_catalogs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_asset_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_video_ai_sessions_company_id_idx" ON "tbl_video_ai_sessions"("company_id");

-- CreateIndex
CREATE INDEX "tbl_video_ai_sessions_project_id_idx" ON "tbl_video_ai_sessions"("project_id");

-- CreateIndex
CREATE INDEX "tbl_video_ai_sessions_status_idx" ON "tbl_video_ai_sessions"("status");

-- CreateIndex
CREATE INDEX "tbl_video_ai_messages_session_id_idx" ON "tbl_video_ai_messages"("session_id");

-- CreateIndex
CREATE INDEX "tbl_video_ai_messages_role_idx" ON "tbl_video_ai_messages"("role");

-- CreateIndex
CREATE INDEX "tbl_video_edit_history_session_id_idx" ON "tbl_video_edit_history"("session_id");

-- CreateIndex
CREATE INDEX "tbl_video_edit_history_action_idx" ON "tbl_video_edit_history"("action");

-- CreateIndex
CREATE INDEX "tbl_video_edit_history_undone_idx" ON "tbl_video_edit_history"("undone");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_brand_styles_company_id_key" ON "tbl_brand_styles"("company_id");

-- CreateIndex
CREATE INDEX "tbl_brand_styles_company_id_idx" ON "tbl_brand_styles"("company_id");

-- CreateIndex
CREATE INDEX "tbl_asset_catalogs_company_id_idx" ON "tbl_asset_catalogs"("company_id");

-- CreateIndex
CREATE INDEX "tbl_asset_catalogs_asset_type_idx" ON "tbl_asset_catalogs"("asset_type");

-- CreateIndex
CREATE INDEX "tbl_asset_catalogs_tags_idx" ON "tbl_asset_catalogs"("tags");

-- AddForeignKey
ALTER TABLE "tbl_video_editor_projects" ADD CONSTRAINT "tbl_video_editor_projects_brand_style_id_fkey" FOREIGN KEY ("brand_style_id") REFERENCES "tbl_brand_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_video_ai_sessions" ADD CONSTRAINT "tbl_video_ai_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tbl_video_editor_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_video_ai_messages" ADD CONSTRAINT "tbl_video_ai_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "tbl_video_ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_video_edit_history" ADD CONSTRAINT "tbl_video_edit_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "tbl_video_ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_brand_styles" ADD CONSTRAINT "tbl_brand_styles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tbl_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_asset_catalogs" ADD CONSTRAINT "tbl_asset_catalogs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tbl_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
