const fs = require('fs');
const path = 'packages/database/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

const newModels = `
// ════════════════════════════════════════════════════════════════════════════
// 1. BANK RECONCILIATION (Zero-Touch Accounting)
// ════════════════════════════════════════════════════════════════════════════

model BankConnection {
  id              String            @id @default(uuid())
  companyId       String            @map("company_id")
  bankName        String            @map("bank_name")
  provider        String            @default("BELVO") // PLAID, BELVO, PROMOCETE
  accountId       String            @map("account_id") // Provider's account ID
  accountType     String            @map("account_type") // CHECKING, SAVINGS, CREDIT
  currency        String            @default("COP")
  balance         Float             @default(0)
  lastSyncedAt    DateTime?         @map("last_synced_at")
  isActive        Boolean           @default(true) @map("is_active")
  createdAt       DateTime          @default(now()) @map("created_at")
  company         Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  transactions    BankTransaction[]

  @@unique([companyId, accountId])
  @@index([companyId])
  @@map("tbl_bank_connections")
}

model BankTransaction {
  id              String            @id @default(uuid())
  connectionId    String            @map("connection_id")
  providerTxId    String            @unique @map("provider_tx_id")
  date            DateTime          @db.Date
  amount          Float
  description     String
  status          String            @default("PENDING") // PENDING, RECONCILED, IGNORED
  reconciledToId  String?           @map("reconciled_to_id") // Link to Expense or Invoice ID
  reconciledType  String?           @map("reconciled_type") // EXPENSE, INVOICE, TRANSFER
  createdAt       DateTime          @default(now()) @map("created_at")
  
  connection      BankConnection    @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@index([connectionId, status])
  @@map("tbl_bank_transactions")
}

// ════════════════════════════════════════════════════════════════════════════
// 3. AUTONOMOUS AI AGENTS (Delegated Access)
// ════════════════════════════════════════════════════════════════════════════

model AgentDelegation {
  id              String            @id @default(uuid())
  agentId         String            @map("agent_id") // Reference to existing AgentMemory/Agent
  companyId       String            @map("company_id")
  role            String            // e.g. "SUPPORT_TIER_1", "SALES_CLOSER"
  allowedActions  String[]          @map("allowed_actions") // ["REFUND_APPROVE", "DISCOUNT_APPLY"]
  maxBudgetUsd    Float             @default(0) @map("max_budget_usd")
  requireApproval Boolean           @default(false) @map("require_approval")
  createdAt       DateTime          @default(now()) @map("created_at")

  @@unique([agentId, companyId])
  @@index([companyId])
  @@map("tbl_agent_delegations")
}
`;

content = content.replace(
  'costCenters CostCenter[]',
  'costCenters CostCenter[]\n  bankConnections BankConnection[]'
);

content += '\n' + newModels;

fs.writeFileSync(path, content, 'utf8');
console.log("Enterprise Database Schema updated successfully!");
