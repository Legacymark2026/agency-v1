-- AlterTable: Add author and confidence to VideoEditHistory
ALTER TABLE "tbl_video_edit_history" ADD COLUMN "edit_author" TEXT NOT NULL DEFAULT 'human';
ALTER TABLE "tbl_video_edit_history" ADD COLUMN "edit_confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
CREATE INDEX "tbl_video_edit_history_edit_author_idx" ON "tbl_video_edit_history"("edit_author");

-- AlterTable: Add activeSessionId to VideoEditorProject
ALTER TABLE "tbl_video_editor_projects" ADD COLUMN "active_session_id" TEXT;

-- CreateTable: EditProposal
CREATE TABLE "tbl_edit_proposals" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "proposal_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposal_confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "before_state" JSONB NOT NULL,
    "after_state" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_edit_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EditConflict
CREATE TABLE "tbl_edit_conflicts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "element_id" TEXT NOT NULL,
    "element_type" TEXT NOT NULL,
    "ai_edit" JSONB NOT NULL,
    "human_edit" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "conflict_resolution" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_edit_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VersionSnapshot
CREATE TABLE "tbl_version_snapshots" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "snapshot_author" TEXT NOT NULL DEFAULT 'human',
    "clip_count" INTEGER NOT NULL DEFAULT 0,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_version_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AICorrection
CREATE TABLE "tbl_ai_corrections" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "session_id" TEXT,
    "action_type" TEXT NOT NULL,
    "ai_suggestion" JSONB NOT NULL,
    "user_correction" JSONB NOT NULL,
    "correction_category" TEXT,
    "correction_pattern" TEXT,
    "confidence_delta" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_ai_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VideoComment
CREATE TABLE "tbl_video_comments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "clip_id" TEXT,
    "comment_timestamp" DOUBLE PRECISION,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_video_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AutoCaption
CREATE TABLE "tbl_auto_captions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "clip_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "start_time" DOUBLE PRECISION NOT NULL,
    "end_time" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_auto_captions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExportJob
CREATE TABLE "tbl_export_jobs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "export_format" TEXT NOT NULL,
    "export_preset" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "output_url" TEXT,
    "file_size" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "col_schema_version" INTEGER NOT NULL DEFAULT 0,
    "col_deleted_at" TIMESTAMP(3),

    CONSTRAINT "tbl_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_edit_proposals_session_id_idx" ON "tbl_edit_proposals"("session_id");
CREATE INDEX "tbl_edit_proposals_project_id_idx" ON "tbl_edit_proposals"("project_id");
CREATE INDEX "tbl_edit_proposals_status_idx" ON "tbl_edit_proposals"("status");
CREATE INDEX "tbl_edit_proposals_proposal_confidence_idx" ON "tbl_edit_proposals"("proposal_confidence");

CREATE INDEX "tbl_edit_conflicts_session_id_idx" ON "tbl_edit_conflicts"("session_id");
CREATE INDEX "tbl_edit_conflicts_project_id_idx" ON "tbl_edit_conflicts"("project_id");
CREATE INDEX "tbl_edit_conflicts_resolved_idx" ON "tbl_edit_conflicts"("resolved");

CREATE INDEX "tbl_version_snapshots_project_id_idx" ON "tbl_version_snapshots"("project_id");
CREATE INDEX "tbl_version_snapshots_created_at_idx" ON "tbl_version_snapshots"("created_at");

CREATE INDEX "tbl_ai_corrections_company_id_idx" ON "tbl_ai_corrections"("company_id");
CREATE INDEX "tbl_ai_corrections_action_type_idx" ON "tbl_ai_corrections"("action_type");
CREATE INDEX "tbl_ai_corrections_correction_category_idx" ON "tbl_ai_corrections"("correction_category");

CREATE INDEX "tbl_video_comments_project_id_idx" ON "tbl_video_comments"("project_id");
CREATE INDEX "tbl_video_comments_clip_id_idx" ON "tbl_video_comments"("clip_id");
CREATE INDEX "tbl_video_comments_resolved_idx" ON "tbl_video_comments"("resolved");

CREATE INDEX "tbl_auto_captions_project_id_idx" ON "tbl_auto_captions"("project_id");
CREATE INDEX "tbl_auto_captions_clip_id_idx" ON "tbl_auto_captions"("clip_id");

CREATE INDEX "tbl_export_jobs_project_id_idx" ON "tbl_export_jobs"("project_id");
CREATE INDEX "tbl_export_jobs_status_idx" ON "tbl_export_jobs"("status");

-- AddForeignKey
ALTER TABLE "tbl_video_editor_projects" ADD CONSTRAINT "tbl_video_editor_projects_active_session_id_fkey" FOREIGN KEY ("active_session_id") REFERENCES "tbl_video_ai_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tbl_edit_proposals" ADD CONSTRAINT "tbl_edit_proposals_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "tbl_video_ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tbl_edit_conflicts" ADD CONSTRAINT "tbl_edit_conflicts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "tbl_video_ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tbl_version_snapshots" ADD CONSTRAINT "tbl_version_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tbl_video_editor_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tbl_video_comments" ADD CONSTRAINT "tbl_video_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tbl_video_editor_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
