CREATE TABLE IF NOT EXISTS "tbl_auth_refresh_tokens" (
  "col_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "col_user_id" UUID NOT NULL,
  "col_refresh_token_encrypted" TEXT NOT NULL UNIQUE,
  "col_expires_at" TIMESTAMP NOT NULL,
  "col_used" BOOLEAN DEFAULT FALSE,
  "col_created_at" TIMESTAMP DEFAULT now(),
  "col_schema_version" INT DEFAULT 1
);