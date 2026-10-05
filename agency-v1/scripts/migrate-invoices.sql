ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS client_type text;
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS rete_fuente double precision DEFAULT 0 NOT NULL;
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS rete_ica double precision DEFAULT 0 NOT NULL;
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS rete_iva double precision DEFAULT 0 NOT NULL;
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS document_nature text DEFAULT 'SALE' NOT NULL;
ALTER TABLE tbl_invoices ADD COLUMN IF NOT EXISTS parent_invoice_id text;
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tbl_invoices_parent_invoice_id_fkey'
  ) THEN 
    ALTER TABLE tbl_invoices 
    ADD CONSTRAINT tbl_invoices_parent_invoice_id_fkey 
    FOREIGN KEY (parent_invoice_id) REFERENCES tbl_invoices(id) ON DELETE NO ACTION ON UPDATE NO ACTION; 
  END IF; 
END $$;
