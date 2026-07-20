ALTER TABLE tbl_users ADD COLUMN IF NOT EXISTS col_schema_version integer DEFAULT 0;
ALTER TABLE tbl_users ADD COLUMN IF NOT EXISTS col_deleted_at timestamp(3) without time zone;
