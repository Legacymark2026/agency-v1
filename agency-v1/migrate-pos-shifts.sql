DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PosShiftStatus') THEN
    CREATE TYPE "PosShiftStatus" AS ENUM ('OPEN', 'PENDING_SUPERVISION', 'CLOSED_BALANCED', 'CLOSED_DISCREPANCY', 'FORCE_CLOSED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS tbl_pos_shifts (
  id VARCHAR(64) PRIMARY KEY,
  shift_code VARCHAR(64) UNIQUE NOT NULL,
  company_id VARCHAR(64) NOT NULL,
  register_id VARCHAR(64) NOT NULL,
  cashier_id VARCHAR(64) NOT NULL,
  cashier_name VARCHAR(128),
  supervisor_id VARCHAR(64),
  supervisor_name VARCHAR(128),
  status "PosShiftStatus" DEFAULT 'OPEN' NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  declared_closed_at TIMESTAMP WITH TIME ZONE,
  verified_closed_at TIMESTAMP WITH TIME ZONE,
  opening_float NUMERIC(15,2) DEFAULT 0 NOT NULL,
  declared_cash NUMERIC(15,2),
  expected_cash NUMERIC(15,2) DEFAULT 0 NOT NULL,
  difference NUMERIC(15,2) DEFAULT 0 NOT NULL,
  cash_sales_total NUMERIC(15,2) DEFAULT 0 NOT NULL,
  card_sales_total NUMERIC(15,2) DEFAULT 0 NOT NULL,
  transfer_sales_total NUMERIC(15,2) DEFAULT 0 NOT NULL,
  credit_sales_total NUMERIC(15,2) DEFAULT 0 NOT NULL,
  total_sales NUMERIC(15,2) DEFAULT 0 NOT NULL,
  order_count INT DEFAULT 0 NOT NULL,
  denominations_count JSONB,
  cashier_notes TEXT,
  supervisor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pos_shifts_company_reg_status ON tbl_pos_shifts(company_id, register_id, status);
CREATE INDEX IF NOT EXISTS idx_pos_shifts_company_cashier ON tbl_pos_shifts(company_id, cashier_id);

ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS shift_id VARCHAR(64);
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS cashier_id VARCHAR(64);
ALTER TABLE tbl_pos_movements ADD COLUMN IF NOT EXISTS shift_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_invoices_shift_id ON tbl_invoices(shift_id);
