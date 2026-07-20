import { prisma } from "../packages/database";

async function main() {
  console.log("Checking if tbl_outbox_events exists and creating if needed...");
  try {
    // Attempt to count. If it fails, we will try to create the table.
    const count = await prisma.outboxEvent.count();
    console.log("Success! Total outbox events count:", count);
  } catch (error: any) {
    console.log("Table does not exist. Creating table via raw SQL...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tbl_outbox_events (
          id VARCHAR(36) PRIMARY KEY,
          col_event_name VARCHAR(255) NOT NULL,
          col_payload JSONB NOT NULL,
          col_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
          col_attempts INTEGER DEFAULT 0 NOT NULL,
          col_correlation_id VARCHAR(255) NOT NULL,
          col_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          col_processed_at TIMESTAMP WITH TIME ZONE,
          col_schema_version INTEGER DEFAULT 1 NOT NULL
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON tbl_outbox_events (col_status)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_outbox_events_correlation ON tbl_outbox_events (col_correlation_id)
      `);

      console.log("Table tbl_outbox_events created successfully!");
      const count = await prisma.outboxEvent.count();
      console.log("Querying new table count:", count);
    } catch (createError: any) {
      console.error("Failed to create table:", createError.message);
    }
  }
}

main();
