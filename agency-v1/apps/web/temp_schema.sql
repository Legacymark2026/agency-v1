-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'guest',
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deactivated_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "custom_tag" TEXT,
    "job_title" TEXT,
    "backup_codes" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_configs" (
    "id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "allowed_routes" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_title" TEXT,
    "department" TEXT,
    "bio" TEXT,
    "social_links" JSONB DEFAULT '{}',
    "preferences" JSONB DEFAULT '{"theme": "system", "notifications": {"email": true}}',
    "metadata" JSONB DEFAULT '{}',
    "google_analytics_config" JSONB,
    "facebook_pixel_config" JSONB,
    "google_tag_manager_config" JSONB,
    "hotjar_config" JSONB,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "subscription_status" TEXT NOT NULL DEFAULT 'active',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "default_settings" JSONB,
    "password_policy" JSONB,
    "white_labeling" JSONB,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_kits" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Brand Kit',
    "primary_color" TEXT NOT NULL DEFAULT '#6D28D9',
    "secondary_color" TEXT NOT NULL DEFAULT '#FFFFFF',
    "accent_color" TEXT NOT NULL DEFAULT '#10B981',
    "logo_url" TEXT,
    "font_family" TEXT NOT NULL DEFAULT 'Inter',
    "tone_of_voice" TEXT NOT NULL DEFAULT 'professional',
    "brand_values" TEXT[],
    "target_audience" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "permissions" JSONB DEFAULT '[]',
    "invited_by" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_id" TEXT,
    "phone_extension" TEXT,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL DEFAULT '/',
    "level" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "company_id" TEXT NOT NULL,
    "max_headcount" INTEGER,
    "monthly_budget" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomObjectDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomObjectDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomObjectField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "definitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomObjectField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomObjectRelationship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomObjectRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomObjectPermission" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CustomObjectPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_object_records" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_object_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "user_id" TEXT,
    "company_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "image_alt" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "canonical_url" TEXT,
    "focus_keyword" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_date" TIMESTAMP(3),
    "author_id" TEXT NOT NULL,
    "series_id" TEXT,
    "series_order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "client" TEXT,
    "cover_image" TEXT,
    "image_alt" TEXT,
    "gallery" JSONB DEFAULT '[]',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "focus_keyword" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_date" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "testimonial" TEXT,
    "results" JSONB DEFAULT '[]',
    "project_url" TEXT,
    "category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "client_logo" TEXT,
    "pdf_url" TEXT,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "team" JSONB DEFAULT '[]',
    "techStack" JSONB DEFAULT '[]',
    "video_url" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "project_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_views" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "referer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "trigger_type" TEXT NOT NULL,
    "trigger_config" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "logs" JSONB,
    "workflow_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "resume_at" TIMESTAMP(3),

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bounties" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reward_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "team_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "claimed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bounties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_views" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "referer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "author_url" TEXT,
    "post_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'blog',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirm_token" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "interests" JSONB DEFAULT '[]',
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_list_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_slug" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "probability" INTEGER NOT NULL DEFAULT 0,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "company_id" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "lost_reason" TEXT,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT DEFAULT 'Unknown',
    "expected_close" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "assigned_to" TEXT,
    "kanban_task_id" TEXT,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "deal_stage_history" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "from_stage" TEXT NOT NULL,
    "to_stage" TEXT NOT NULL,
    "changed_by" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_goals" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "department_id" TEXT,
    "level" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "period" TEXT NOT NULL,
    "target_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "rate" DOUBLE PRECISION NOT NULL,
    "min_deal_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cap_amount" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_automation_rules" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger_type" TEXT NOT NULL,
    "trigger_stage" TEXT,
    "trigger_days" INTEGER,
    "action_type" TEXT NOT NULL,
    "action_payload" JSONB NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_logs" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "result" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequences" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_stage" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequence_enrollments" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "next_run_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_sequence_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "deal_id" TEXT,
    "lead_id" TEXT,
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scoring_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "points" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "budget" DOUBLE PRECISION,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "description" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "approval_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by_id" TEXT,
    "launch_status" TEXT NOT NULL DEFAULT 'PENDING',
    "launched_at" TIMESTAMP(3),
    "parameters" JSONB,
    "tracking_config" JSONB,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "job_title" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL,
    "gclid" TEXT,
    "fbclid" TEXT,
    "li_fat_id" TEXT,
    "ttclid" TEXT,
    "fbp" TEXT,
    "fbc" TEXT,
    "medium" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "referer" TEXT,
    "landing_page" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "campaign_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "conversion_probability" DOUBLE PRECISION,
    "prediction_factors" JSONB,
    "converted_to_deal_id" TEXT,
    "converted_at" TIMESTAMP(3),
    "form_id" TEXT,
    "form_data" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "assigned_to" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT,
    "url" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "visitor_id" TEXT,
    "lead_id" TEXT,
    "user_id" TEXT,
    "properties" JSONB DEFAULT '{}',
    "session_id" TEXT,
    "campaign_id" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_spend" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "campaign_id" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_spend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_assets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "company_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" INTEGER,
    "duration" INTEGER,
    "alt_text" TEXT,
    "mime_type" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "winner_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_variants" (
    "id" TEXT NOT NULL,
    "ab_test_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ab_test_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_links" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "last_click" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "platform_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "lead_id" TEXT,
    "company_id" TEXT NOT NULL,
    "assigned_to" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_preview" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB DEFAULT '{}',
    "sentiment" TEXT,
    "topic" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "direction" TEXT NOT NULL,
    "sender_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "media_url" TEXT,
    "media_type" TEXT,
    "external_id" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "session_id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "user_id" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "browser_ver" TEXT,
    "os" TEXT,
    "os_version" TEXT,
    "screen_res" TEXT,
    "country" TEXT,
    "country_code" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "load_time" INTEGER,
    "dom_ready" INTEGER,
    "duration" INTEGER,
    "scroll_depth" INTEGER,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
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
    "badge_id" TEXT,
    "icon_name" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],

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

-- CreateTable
CREATE TABLE "analytics_sessions" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "user_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "page_views" INTEGER NOT NULL DEFAULT 1,
    "entry_page" TEXT NOT NULL,
    "exit_page" TEXT,
    "is_bounce" BOOLEAN NOT NULL DEFAULT true,
    "referrer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "country_code" TEXT,
    "city" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "goal_id" TEXT,
    "conversion_value" DOUBLE PRECISION,
    "engagement_score" INTEGER,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_goals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "match_type" TEXT NOT NULL,
    "match_value" TEXT NOT NULL,
    "goal_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_count" INTEGER,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "total_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "avg_duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounce_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pages_per_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "by_device" JSONB,
    "by_country" JSONB,
    "by_source" JSONB,
    "top_pages" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "time_zone" TEXT NOT NULL DEFAULT 'UTC',
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "organizer_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "client_id" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deal_id" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT,
    "lead_id" TEXT,
    "rsvp_status" TEXT NOT NULL DEFAULT 'PENDING',
    "guest_email" TEXT,
    "guest_name" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectToProjectTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

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
    "scheduled_at" TIMESTAMP(3),
    "design_json" JSONB,
    "is_ab_test" BOOLEAN NOT NULL DEFAULT false,
    "subject_b" TEXT,
    "html_body_b" TEXT,
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
    "variant" TEXT NOT NULL DEFAULT 'A',
    "sent_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "complained_at" TIMESTAMP(3),

    CONSTRAINT "email_blast_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppression_list" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppression_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailing_lists" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mailing_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailing_list_subscribers" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "variables" JSONB DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mailing_list_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" JSONB DEFAULT '[]',
    "platforms" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "author_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "company_id" TEXT NOT NULL,
    "approval_status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by_id" TEXT,
    "internal_notes" TEXT,
    "is_evergreen" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "target_url" TEXT,
    "tiktok_audio_id" TEXT,
    "first_comment" TEXT,
    "utm_campaign" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_nit" TEXT,
    "client_address" TEXT,
    "client_city" TEXT,
    "client_phone" TEXT,
    "service_description" TEXT,
    "subtotal_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "advance_amount" DOUBLE PRECISION NOT NULL,
    "final_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT_AWAITING_PAYMENT',
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "terms" TEXT,
    "company_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "stripe_invoice_id" TEXT,
    "payment_url" TEXT,
    "pdf_url" TEXT,
    "token" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_electronic" BOOLEAN NOT NULL DEFAULT true,
    "dian_status" TEXT,
    "cufe" TEXT,
    "qr_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nueva conversación',
    "user_id" TEXT,
    "company_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "contact_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "suspended_until" TIMESTAMP(3),
    "suspended_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "raw_content" TEXT,
    "sentiment_score" DOUBLE PRECISION,
    "is_human_override" BOOLEAN NOT NULL DEFAULT false,
    "tokens_used" INTEGER,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_configs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "system_prompt" TEXT,
    "llm_model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash-lite',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL DEFAULT 1024,
    "admin_whatsapp_phone" TEXT,
    "monthly_sales_target" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agent_type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "system_prompt" TEXT NOT NULL,
    "llm_model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "max_tokens" INTEGER NOT NULL DEFAULT 400,
    "enabled_tools" JSONB NOT NULL DEFAULT '[]',
    "strict_rag_mode" BOOLEAN NOT NULL DEFAULT false,
    "human_transfer_webhook" TEXT,
    "suspension_duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "priority_alpha" BOOLEAN NOT NULL DEFAULT true,
    "frustration_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "enforce_temp_clamp" BOOLEAN NOT NULL DEFAULT false,
    "enforce_token_limit" BOOLEAN NOT NULL DEFAULT true,
    "simulate_latency" BOOLEAN NOT NULL DEFAULT true,
    "filter_robotic_lists" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "company_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "spent_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "health_score" INTEGER NOT NULL DEFAULT 100,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_swimlanes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "wip_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_swimlanes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_health_logs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "healthScore" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "project_health_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "order" INTEGER NOT NULL DEFAULT 0,
    "project_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "estimated_hours" DOUBLE PRECISION,
    "swimlane_id" TEXT,
    "labels" JSONB NOT NULL DEFAULT '[]',
    "story_points" INTEGER,
    "media_urls" JSONB NOT NULL DEFAULT '[]',
    "cost_per_hour" DOUBLE PRECISION,
    "budget_cap" DOUBLE PRECISION,
    "sla_deadline" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_comments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_subtasks" (
    "id" TEXT NOT NULL,
    "parent_task_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "is_blocking" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_audit_logs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_project_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT '📋',
    "company_id" TEXT,
    "structure" JSONB NOT NULL,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_project_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_asset_annotations" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "asset_url" TEXT NOT NULL,
    "x_percent" DOUBLE PRECISION NOT NULL,
    "y_percent" DOUBLE PRECISION NOT NULL,
    "timestamp" DOUBLE PRECISION,
    "comment" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_asset_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "company_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "expires_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "signature" TEXT,
    "client_ip" TEXT,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_macros" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "actions" JSONB NOT NULL,
    "icon" TEXT DEFAULT 'Wand2',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_macros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "kanban_task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "timesheet_id" TEXT,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "document_type" TEXT NOT NULL DEFAULT 'CC',
    "document_number" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "contract_type" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "base_salary" DOUBLE PRECISION NOT NULL,
    "pto_days" INTEGER NOT NULL DEFAULT 15,
    "joining_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_account_type" TEXT DEFAULT 'AHORROS',
    "eps_name" TEXT,
    "eps_number" TEXT,
    "afp_name" TEXT,
    "afp_number" TEXT,
    "arl_name" TEXT,
    "compensation_box" TEXT,
    "risk_level" INTEGER NOT NULL DEFAULT 1,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_rel" TEXT,
    "address" TEXT,
    "city" TEXT,
    "birth_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_pay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_electronic" BOOLEAN NOT NULL DEFAULT true,
    "dian_status" TEXT,
    "cune" TEXT,
    "payment_method" TEXT NOT NULL DEFAULT 'TRANSFER',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "base_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BANK_ACCOUNT',
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "invoice_id" TEXT,
    "payroll_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_off_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_benefits" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "date" DATE NOT NULL,
    "vendor" TEXT,
    "reference" TEXT,
    "receipt_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT DEFAULT 'TRANSFER',
    "account_id" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_audit_logs" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_annotations" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "x_percent" DOUBLE PRECISION NOT NULL,
    "y_percent" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "company_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_versions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "prompt" TEXT,
    "change_note" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "company_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_delivered_at" TIMESTAMP(3),
    "last_status_code" INTEGER,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery_logs" (
    "id" TEXT NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status_code" INTEGER,
    "response_body" TEXT,
    "payload" TEXT,
    "duration_ms" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "digest" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "integration" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latency_ms" INTEGER,
    "message" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_bases" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'TEXT',
    "source_url" TEXT,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery_logs" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "provider_info" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProjectToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CategoryToPost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AIAgentToKnowledgeBase" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_configs_role_name_key" ON "role_configs"("role_name");

-- CreateIndex
CREATE INDEX "role_configs_role_name_idx" ON "role_configs"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brand_kits_company_id_key" ON "brand_kits"("company_id");

-- CreateIndex
CREATE INDEX "company_users_role_idx" ON "company_users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_user_id_company_id_key" ON "company_users"("user_id", "company_id");

-- CreateIndex
CREATE INDEX "teams_company_id_idx" ON "teams"("company_id");

-- CreateIndex
CREATE INDEX "teams_path_idx" ON "teams"("path");

-- CreateIndex
CREATE UNIQUE INDEX "CustomObjectDefinition_companyId_name_key" ON "CustomObjectDefinition"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomObjectPermission_teamId_definitionId_key" ON "CustomObjectPermission"("teamId", "definitionId");

-- CreateIndex
CREATE INDEX "custom_object_records_definition_id_idx" ON "custom_object_records"("definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "posts_series_id_idx" ON "posts"("series_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_category_id_idx" ON "projects"("category_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_featured_idx" ON "projects"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_name_key" ON "project_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_slug_key" ON "project_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_tags_name_key" ON "project_tags"("name");

-- CreateIndex
CREATE INDEX "project_views_project_id_idx" ON "project_views"("project_id");

-- CreateIndex
CREATE INDEX "project_views_created_at_idx" ON "project_views"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "project_views_project_id_ip_hash_created_at_key" ON "project_views"("project_id", "ip_hash", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "workflows_company_id_idx" ON "workflows"("company_id");

-- CreateIndex
CREATE INDEX "workflow_executions_workflow_id_idx" ON "workflow_executions"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");

-- CreateIndex
CREATE INDEX "bounties_team_id_idx" ON "bounties"("team_id");

-- CreateIndex
CREATE INDEX "bounties_status_idx" ON "bounties"("status");

-- CreateIndex
CREATE INDEX "post_views_post_id_idx" ON "post_views"("post_id");

-- CreateIndex
CREATE INDEX "post_views_created_at_idx" ON "post_views"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_views_post_id_ip_hash_created_at_key" ON "post_views"("post_id", "ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_session_id_key" ON "post_likes"("post_id", "session_id");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "comments_approved_idx" ON "comments"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_confirmed_idx" ON "newsletter_subscriptions"("confirmed");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_unsubscribed_idx" ON "newsletter_subscriptions"("unsubscribed");

-- CreateIndex
CREATE UNIQUE INDEX "post_series_slug_key" ON "post_series"("slug");

-- CreateIndex
CREATE INDEX "reading_list_items_user_id_idx" ON "reading_list_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_list_items_user_id_post_slug_key" ON "reading_list_items"("user_id", "post_slug");

-- CreateIndex
CREATE UNIQUE INDEX "deals_kanban_task_id_key" ON "deals"("kanban_task_id");

-- CreateIndex
CREATE INDEX "deals_company_id_idx" ON "deals"("company_id");

-- CreateIndex
CREATE INDEX "deals_stage_idx" ON "deals"("stage");

-- CreateIndex
CREATE INDEX "deals_priority_idx" ON "deals"("priority");

-- CreateIndex
CREATE INDEX "deals_assigned_to_idx" ON "deals"("assigned_to");

-- CreateIndex
CREATE INDEX "crm_activities_deal_id_idx" ON "crm_activities"("deal_id");

-- CreateIndex
CREATE INDEX "crm_activities_user_id_idx" ON "crm_activities"("user_id");

-- CreateIndex
CREATE INDEX "crm_activities_created_at_idx" ON "crm_activities"("created_at");

-- CreateIndex
CREATE INDEX "deal_stage_history_deal_id_idx" ON "deal_stage_history"("deal_id");

-- CreateIndex
CREATE INDEX "deal_stage_history_created_at_idx" ON "deal_stage_history"("created_at");

-- CreateIndex
CREATE INDEX "sales_goals_company_id_idx" ON "sales_goals"("company_id");

-- CreateIndex
CREATE INDEX "sales_goals_period_idx" ON "sales_goals"("period");

-- CreateIndex
CREATE UNIQUE INDEX "sales_goals_company_id_user_id_period_key" ON "sales_goals"("company_id", "user_id", "period");

-- CreateIndex
CREATE INDEX "commission_rules_company_id_idx" ON "commission_rules"("company_id");

-- CreateIndex
CREATE INDEX "commission_payments_company_id_idx" ON "commission_payments"("company_id");

-- CreateIndex
CREATE INDEX "commission_payments_user_id_idx" ON "commission_payments"("user_id");

-- CreateIndex
CREATE INDEX "commission_payments_deal_id_idx" ON "commission_payments"("deal_id");

-- CreateIndex
CREATE INDEX "commission_payments_status_idx" ON "commission_payments"("status");

-- CreateIndex
CREATE INDEX "deal_automation_rules_company_id_idx" ON "deal_automation_rules"("company_id");

-- CreateIndex
CREATE INDEX "deal_automation_rules_is_active_idx" ON "deal_automation_rules"("is_active");

-- CreateIndex
CREATE INDEX "automation_logs_rule_id_idx" ON "automation_logs"("rule_id");

-- CreateIndex
CREATE INDEX "email_sequences_company_id_idx" ON "email_sequences"("company_id");

-- CreateIndex
CREATE INDEX "email_sequence_enrollments_sequence_id_idx" ON "email_sequence_enrollments"("sequence_id");

-- CreateIndex
CREATE INDEX "email_sequence_enrollments_deal_id_idx" ON "email_sequence_enrollments"("deal_id");

-- CreateIndex
CREATE INDEX "email_sequence_enrollments_status_next_run_at_idx" ON "email_sequence_enrollments"("status", "next_run_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_sequence_enrollments_sequence_id_deal_id_key" ON "email_sequence_enrollments"("sequence_id", "deal_id");

-- CreateIndex
CREATE INDEX "tasks_company_id_idx" ON "tasks"("company_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_idx" ON "tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "tasks_deal_id_idx" ON "tasks"("deal_id");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_completed_idx" ON "tasks"("completed");

-- CreateIndex
CREATE INDEX "email_templates_company_id_idx" ON "email_templates"("company_id");

-- CreateIndex
CREATE INDEX "email_templates_category_idx" ON "email_templates"("category");

-- CreateIndex
CREATE INDEX "lead_scoring_rules_company_id_idx" ON "lead_scoring_rules"("company_id");

-- CreateIndex
CREATE INDEX "lead_scoring_rules_active_idx" ON "lead_scoring_rules"("active");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_code_key" ON "campaigns"("code");

-- CreateIndex
CREATE INDEX "campaigns_company_id_idx" ON "campaigns"("company_id");

-- CreateIndex
CREATE INDEX "campaigns_code_idx" ON "campaigns"("code");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "leads_company_id_idx" ON "leads"("company_id");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_campaign_id_idx" ON "leads"("campaign_id");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "marketing_events_company_id_idx" ON "marketing_events"("company_id");

-- CreateIndex
CREATE INDEX "marketing_events_lead_id_idx" ON "marketing_events"("lead_id");

-- CreateIndex
CREATE INDEX "marketing_events_visitor_id_idx" ON "marketing_events"("visitor_id");

-- CreateIndex
CREATE INDEX "marketing_events_eventType_idx" ON "marketing_events"("eventType");

-- CreateIndex
CREATE INDEX "marketing_events_created_at_idx" ON "marketing_events"("created_at");

-- CreateIndex
CREATE INDEX "ad_spend_company_id_idx" ON "ad_spend"("company_id");

-- CreateIndex
CREATE INDEX "ad_spend_date_idx" ON "ad_spend"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_spend_date_campaign_id_platform_key" ON "ad_spend"("date", "campaign_id", "platform");

-- CreateIndex
CREATE INDEX "campaign_assets_company_id_idx" ON "campaign_assets"("company_id");

-- CreateIndex
CREATE INDEX "campaign_assets_campaign_id_idx" ON "campaign_assets"("campaign_id");

-- CreateIndex
CREATE INDEX "ab_tests_campaign_id_idx" ON "ab_tests"("campaign_id");

-- CreateIndex
CREATE INDEX "ab_tests_company_id_idx" ON "ab_tests"("company_id");

-- CreateIndex
CREATE INDEX "ab_test_variants_ab_test_id_idx" ON "ab_test_variants"("ab_test_id");

-- CreateIndex
CREATE UNIQUE INDEX "short_links_slug_key" ON "short_links"("slug");

-- CreateIndex
CREATE INDEX "short_links_company_id_idx" ON "short_links"("company_id");

-- CreateIndex
CREATE INDEX "conversations_company_id_idx" ON "conversations"("company_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_channel_idx" ON "conversations"("channel");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_platform_id_channel_key" ON "conversations"("platform_id", "channel");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_external_id_conversation_id_key" ON "messages"("external_id", "conversation_id");

-- CreateIndex
CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events"("session_id");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_path_idx" ON "analytics_events"("path");

-- CreateIndex
CREATE INDEX "analytics_events_visitor_id_idx" ON "analytics_events"("visitor_id");

-- CreateIndex
CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "analytics_events_utm_source_utm_medium_utm_campaign_idx" ON "analytics_events"("utm_source", "utm_medium", "utm_campaign");

-- CreateIndex
CREATE INDEX "analytics_events_country_created_at_idx" ON "analytics_events"("country", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_device_created_at_idx" ON "analytics_events"("device", "created_at");

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

-- CreateIndex
CREATE INDEX "analytics_sessions_visitor_id_idx" ON "analytics_sessions"("visitor_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_user_id_idx" ON "analytics_sessions"("user_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_started_at_idx" ON "analytics_sessions"("started_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_is_active_idx" ON "analytics_sessions"("is_active");

-- CreateIndex
CREATE INDEX "analytics_sessions_country_started_at_idx" ON "analytics_sessions"("country", "started_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_utm_source_utm_medium_idx" ON "analytics_sessions"("utm_source", "utm_medium");

-- CreateIndex
CREATE INDEX "analytics_sessions_device_started_at_idx" ON "analytics_sessions"("device", "started_at");

-- CreateIndex
CREATE INDEX "analytics_sessions_is_bounce_started_at_idx" ON "analytics_sessions"("is_bounce", "started_at");

-- CreateIndex
CREATE INDEX "analytics_goals_type_idx" ON "analytics_goals"("type");

-- CreateIndex
CREATE INDEX "analytics_goals_is_active_idx" ON "analytics_goals"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_stats_date_key" ON "analytics_daily_stats"("date");

-- CreateIndex
CREATE INDEX "analytics_daily_stats_date_idx" ON "analytics_daily_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_company_id_provider_key" ON "integration_configs"("company_id", "provider");

-- CreateIndex
CREATE INDEX "events_company_id_idx" ON "events"("company_id");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_start_date_end_date_idx" ON "events"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "event_participants_event_id_idx" ON "event_participants"("event_id");

-- CreateIndex
CREATE INDEX "event_participants_user_id_idx" ON "event_participants"("user_id");

-- CreateIndex
CREATE INDEX "event_participants_lead_id_idx" ON "event_participants"("lead_id");

-- CreateIndex
CREATE INDEX "event_participants_rsvp_status_idx" ON "event_participants"("rsvp_status");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_event_id_user_id_key" ON "event_participants"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_event_id_lead_id_key" ON "event_participants"("event_id", "lead_id");

-- CreateIndex
CREATE INDEX "_ProjectToProjectTag_B_index" ON "_ProjectToProjectTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToProjectTag_AB_unique" ON "_ProjectToProjectTag"("A", "B");

-- CreateIndex
CREATE INDEX "email_blasts_company_id_idx" ON "email_blasts"("company_id");

-- CreateIndex
CREATE INDEX "email_blasts_status_idx" ON "email_blasts"("status");

-- CreateIndex
CREATE INDEX "email_blasts_scheduled_at_idx" ON "email_blasts"("scheduled_at");

-- CreateIndex
CREATE INDEX "email_blast_recipients_blast_id_idx" ON "email_blast_recipients"("blast_id");

-- CreateIndex
CREATE INDEX "email_blast_recipients_status_idx" ON "email_blast_recipients"("status");

-- CreateIndex
CREATE INDEX "email_blast_recipients_email_idx" ON "email_blast_recipients"("email");

-- CreateIndex
CREATE INDEX "suppression_list_company_id_idx" ON "suppression_list"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppression_list_company_id_email_key" ON "suppression_list"("company_id", "email");

-- CreateIndex
CREATE INDEX "mailing_lists_company_id_idx" ON "mailing_lists"("company_id");

-- CreateIndex
CREATE INDEX "mailing_list_subscribers_list_id_idx" ON "mailing_list_subscribers"("list_id");

-- CreateIndex
CREATE INDEX "mailing_list_subscribers_email_idx" ON "mailing_list_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mailing_list_subscribers_list_id_email_key" ON "mailing_list_subscribers"("list_id", "email");

-- CreateIndex
CREATE INDEX "social_posts_company_id_idx" ON "social_posts"("company_id");

-- CreateIndex
CREATE INDEX "social_posts_status_idx" ON "social_posts"("status");

-- CreateIndex
CREATE INDEX "social_posts_approval_status_idx" ON "social_posts"("approval_status");

-- CreateIndex
CREATE INDEX "social_post_comments_post_id_idx" ON "social_post_comments"("post_id");

-- CreateIndex
CREATE INDEX "social_post_comments_user_id_idx" ON "social_post_comments"("user_id");

-- CreateIndex
CREATE INDEX "social_post_logs_post_id_idx" ON "social_post_logs"("post_id");

-- CreateIndex
CREATE INDEX "social_post_logs_user_id_idx" ON "social_post_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_token_key" ON "invoices"("token");

-- CreateIndex
CREATE INDEX "invoices_company_id_idx" ON "invoices"("company_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_lead_id_idx" ON "invoices"("lead_id");

-- CreateIndex
CREATE INDEX "invoices_deal_id_idx" ON "invoices"("deal_id");

-- CreateIndex
CREATE INDEX "invoices_token_idx" ON "invoices"("token");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items"("invoice_id");

-- CreateIndex
CREATE INDEX "agent_conversations_user_id_idx" ON "agent_conversations"("user_id");

-- CreateIndex
CREATE INDEX "agent_conversations_company_id_idx" ON "agent_conversations"("company_id");

-- CreateIndex
CREATE INDEX "agent_conversations_agent_id_status_idx" ON "agent_conversations"("agent_id", "status");

-- CreateIndex
CREATE INDEX "agent_messages_conversation_id_idx" ON "agent_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "agent_messages_conversation_id_created_at_idx" ON "agent_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agent_configs_company_id_key" ON "agent_configs"("company_id");

-- CreateIndex
CREATE INDEX "ai_agents_company_id_idx" ON "ai_agents"("company_id");

-- CreateIndex
CREATE INDEX "ai_agents_is_active_idx" ON "ai_agents"("is_active");

-- CreateIndex
CREATE INDEX "ai_agents_company_id_is_active_idx" ON "ai_agents"("company_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "kanban_projects_deal_id_key" ON "kanban_projects"("deal_id");

-- CreateIndex
CREATE INDEX "kanban_projects_company_id_idx" ON "kanban_projects"("company_id");

-- CreateIndex
CREATE INDEX "kanban_projects_status_idx" ON "kanban_projects"("status");

-- CreateIndex
CREATE INDEX "kanban_swimlanes_project_id_idx" ON "kanban_swimlanes"("project_id");

-- CreateIndex
CREATE INDEX "project_health_logs_project_id_idx" ON "project_health_logs"("project_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_project_id_idx" ON "kanban_tasks"("project_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_swimlane_id_idx" ON "kanban_tasks"("swimlane_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_assignee_id_idx" ON "kanban_tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_status_idx" ON "kanban_tasks"("status");

-- CreateIndex
CREATE INDEX "kanban_comments_task_id_idx" ON "kanban_comments"("task_id");

-- CreateIndex
CREATE INDEX "kanban_subtasks_parent_task_id_idx" ON "kanban_subtasks"("parent_task_id");

-- CreateIndex
CREATE INDEX "kanban_audit_logs_task_id_idx" ON "kanban_audit_logs"("task_id");

-- CreateIndex
CREATE INDEX "kanban_audit_logs_actor_id_idx" ON "kanban_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "kanban_project_templates_company_id_idx" ON "kanban_project_templates"("company_id");

-- CreateIndex
CREATE INDEX "kanban_asset_annotations_task_id_idx" ON "kanban_asset_annotations"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_token_key" ON "proposals"("token");

-- CreateIndex
CREATE INDEX "proposals_company_id_idx" ON "proposals"("company_id");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_token_idx" ON "proposals"("token");

-- CreateIndex
CREATE INDEX "proposal_items_proposal_id_idx" ON "proposal_items"("proposal_id");

-- CreateIndex
CREATE INDEX "inbox_macros_company_id_idx" ON "inbox_macros"("company_id");

-- CreateIndex
CREATE INDEX "time_entries_timesheet_id_idx" ON "time_entries"("timesheet_id");

-- CreateIndex
CREATE INDEX "time_entries_kanban_task_id_idx" ON "time_entries"("kanban_task_id");

-- CreateIndex
CREATE INDEX "time_entries_user_id_idx" ON "time_entries"("user_id");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "employees"("company_id");

-- CreateIndex
CREATE INDEX "employees_is_active_idx" ON "employees"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "employees_company_id_document_number_key" ON "employees"("company_id", "document_number");

-- CreateIndex
CREATE INDEX "payrolls_company_id_idx" ON "payrolls"("company_id");

-- CreateIndex
CREATE INDEX "payrolls_employee_id_idx" ON "payrolls"("employee_id");

-- CreateIndex
CREATE INDEX "payrolls_status_idx" ON "payrolls"("status");

-- CreateIndex
CREATE INDEX "payrolls_period_start_period_end_idx" ON "payrolls"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "payroll_items_payroll_id_idx" ON "payroll_items"("payroll_id");

-- CreateIndex
CREATE INDEX "payroll_items_type_idx" ON "payroll_items"("type");

-- CreateIndex
CREATE INDEX "financial_accounts_company_id_idx" ON "financial_accounts"("company_id");

-- CreateIndex
CREATE INDEX "financial_accounts_is_active_idx" ON "financial_accounts"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_payroll_id_key" ON "financial_transactions"("payroll_id");

-- CreateIndex
CREATE INDEX "financial_transactions_account_id_idx" ON "financial_transactions"("account_id");

-- CreateIndex
CREATE INDEX "financial_transactions_type_idx" ON "financial_transactions"("type");

-- CreateIndex
CREATE INDEX "financial_transactions_category_idx" ON "financial_transactions"("category");

-- CreateIndex
CREATE INDEX "financial_transactions_date_idx" ON "financial_transactions"("date");

-- CreateIndex
CREATE INDEX "timesheets_employee_id_idx" ON "timesheets"("employee_id");

-- CreateIndex
CREATE INDEX "timesheets_status_idx" ON "timesheets"("status");

-- CreateIndex
CREATE INDEX "time_off_requests_employee_id_idx" ON "time_off_requests"("employee_id");

-- CreateIndex
CREATE INDEX "time_off_requests_status_idx" ON "time_off_requests"("status");

-- CreateIndex
CREATE INDEX "employee_benefits_employee_id_idx" ON "employee_benefits"("employee_id");

-- CreateIndex
CREATE INDEX "employee_benefits_company_id_idx" ON "employee_benefits"("company_id");

-- CreateIndex
CREATE INDEX "expense_categories_company_id_idx" ON "expense_categories"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_company_id_name_key" ON "expense_categories"("company_id", "name");

-- CreateIndex
CREATE INDEX "expenses_company_id_idx" ON "expenses"("company_id");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "payroll_audit_logs_payroll_id_idx" ON "payroll_audit_logs"("payroll_id");

-- CreateIndex
CREATE INDEX "payroll_audit_logs_user_id_idx" ON "payroll_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "asset_annotations_asset_id_idx" ON "asset_annotations"("asset_id");

-- CreateIndex
CREATE INDEX "asset_annotations_author_id_idx" ON "asset_annotations"("author_id");

-- CreateIndex
CREATE INDEX "asset_collections_company_id_idx" ON "asset_collections"("company_id");

-- CreateIndex
CREATE INDEX "asset_collection_items_collection_id_idx" ON "asset_collection_items"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_collection_items_collection_id_asset_id_key" ON "asset_collection_items"("collection_id", "asset_id");

-- CreateIndex
CREATE INDEX "asset_versions_asset_id_idx" ON "asset_versions"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_versions_asset_id_version_key" ON "asset_versions"("asset_id", "version");

-- CreateIndex
CREATE INDEX "webhooks_company_id_idx" ON "webhooks"("company_id");

-- CreateIndex
CREATE INDEX "webhook_delivery_logs_webhook_id_idx" ON "webhook_delivery_logs"("webhook_id");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_company_id_idx" ON "notification_preferences"("user_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_company_id_channel_event_key" ON "notification_preferences"("user_id", "company_id", "channel", "event");

-- CreateIndex
CREATE INDEX "usage_logs_company_id_metric_idx" ON "usage_logs"("company_id", "metric");

-- CreateIndex
CREATE INDEX "usage_logs_company_id_recorded_at_idx" ON "usage_logs"("company_id", "recorded_at");

-- CreateIndex
CREATE INDEX "integration_logs_company_id_idx" ON "integration_logs"("company_id");

-- CreateIndex
CREATE INDEX "integration_logs_company_id_integration_idx" ON "integration_logs"("company_id", "integration");

-- CreateIndex
CREATE INDEX "knowledge_bases_company_id_idx" ON "knowledge_bases"("company_id");

-- CreateIndex
CREATE INDEX "notifications_company_id_idx" ON "notifications"("company_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_company_id_idx" ON "notification_delivery_logs"("company_id");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_user_id_idx" ON "notification_delivery_logs"("user_id");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_channel_status_idx" ON "notification_delivery_logs"("channel", "status");

-- CreateIndex
CREATE UNIQUE INDEX "_PostToTag_AB_unique" ON "_PostToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToService_AB_unique" ON "_ProjectToService"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToService_B_index" ON "_ProjectToService"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToPost_AB_unique" ON "_CategoryToPost"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToPost_B_index" ON "_CategoryToPost"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AIAgentToKnowledgeBase_AB_unique" ON "_AIAgentToKnowledgeBase"("A", "B");

-- CreateIndex
CREATE INDEX "_AIAgentToKnowledgeBase_B_index" ON "_AIAgentToKnowledgeBase"("B");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomObjectDefinition" ADD CONSTRAINT "CustomObjectDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomObjectField" ADD CONSTRAINT "CustomObjectField_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CustomObjectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomObjectRelationship" ADD CONSTRAINT "CustomObjectRelationship_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "CustomObjectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomObjectRelationship" ADD CONSTRAINT "CustomObjectRelationship_toId_fkey" FOREIGN KEY ("toId") REFERENCES "CustomObjectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomObjectPermission" ADD CONSTRAINT "CustomObjectPermission_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CustomObjectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomObjectPermission" ADD CONSTRAINT "CustomObjectPermission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_object_records" ADD CONSTRAINT "custom_object_records_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "CustomObjectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "post_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_views" ADD CONSTRAINT "project_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_claimed_by_fkey" FOREIGN KEY ("claimed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_list_items" ADD CONSTRAINT "reading_list_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_kanban_task_id_fkey" FOREIGN KEY ("kanban_task_id") REFERENCES "kanban_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_history" ADD CONSTRAINT "deal_stage_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_goals" ADD CONSTRAINT "sales_goals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_goals" ADD CONSTRAINT "sales_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_automation_rules" ADD CONSTRAINT "deal_automation_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "deal_automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequences" ADD CONSTRAINT "email_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "email_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_events" ADD CONSTRAINT "marketing_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_spend" ADD CONSTRAINT "ad_spend_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_spend" ADD CONSTRAINT "ad_spend_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_assets" ADD CONSTRAINT "campaign_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_assets" ADD CONSTRAINT "campaign_assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_variants" ADD CONSTRAINT "ab_test_variants_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "campaign_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_configs" ADD CONSTRAINT "integration_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToProjectTag" ADD CONSTRAINT "_ProjectToProjectTag_A_fkey" FOREIGN KEY ("A") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToProjectTag" ADD CONSTRAINT "_ProjectToProjectTag_B_fkey" FOREIGN KEY ("B") REFERENCES "project_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_blast_recipients" ADD CONSTRAINT "email_blast_recipients_blast_id_fkey" FOREIGN KEY ("blast_id") REFERENCES "email_blasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailing_list_subscribers" ADD CONSTRAINT "mailing_list_subscribers_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "mailing_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_comments" ADD CONSTRAINT "social_post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_comments" ADD CONSTRAINT "social_post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_logs" ADD CONSTRAINT "social_post_logs_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_logs" ADD CONSTRAINT "social_post_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "agent_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_projects" ADD CONSTRAINT "kanban_projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_projects" ADD CONSTRAINT "kanban_projects_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_swimlanes" ADD CONSTRAINT "kanban_swimlanes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "kanban_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_health_logs" ADD CONSTRAINT "project_health_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "kanban_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "kanban_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_swimlane_id_fkey" FOREIGN KEY ("swimlane_id") REFERENCES "kanban_swimlanes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_comments" ADD CONSTRAINT "kanban_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_comments" ADD CONSTRAINT "kanban_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_subtasks" ADD CONSTRAINT "kanban_subtasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_subtasks" ADD CONSTRAINT "kanban_subtasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_audit_logs" ADD CONSTRAINT "kanban_audit_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_audit_logs" ADD CONSTRAINT "kanban_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_asset_annotations" ADD CONSTRAINT "kanban_asset_annotations_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_asset_annotations" ADD CONSTRAINT "kanban_asset_annotations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_macros" ADD CONSTRAINT "inbox_macros_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_kanban_task_id_fkey" FOREIGN KEY ("kanban_task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_audit_logs" ADD CONSTRAINT "payroll_audit_logs_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_audit_logs" ADD CONSTRAINT "payroll_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_annotations" ADD CONSTRAINT "asset_annotations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "campaign_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_annotations" ADD CONSTRAINT "asset_annotations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_collections" ADD CONSTRAINT "asset_collections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_collections" ADD CONSTRAINT "asset_collections_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_collection_items" ADD CONSTRAINT "asset_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "asset_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_collection_items" ADD CONSTRAINT "asset_collection_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "campaign_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_versions" ADD CONSTRAINT "asset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "campaign_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_versions" ADD CONSTRAINT "asset_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery_logs" ADD CONSTRAINT "webhook_delivery_logs_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToService" ADD CONSTRAINT "_ProjectToService_A_fkey" FOREIGN KEY ("A") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToService" ADD CONSTRAINT "_ProjectToService_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPost" ADD CONSTRAINT "_CategoryToPost_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPost" ADD CONSTRAINT "_CategoryToPost_B_fkey" FOREIGN KEY ("B") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AIAgentToKnowledgeBase" ADD CONSTRAINT "_AIAgentToKnowledgeBase_A_fkey" FOREIGN KEY ("A") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AIAgentToKnowledgeBase" ADD CONSTRAINT "_AIAgentToKnowledgeBase_B_fkey" FOREIGN KEY ("B") REFERENCES "knowledge_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

