const fs = require('fs');
const path = 'packages/database/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// 1. Create CostCenter model
const costCenterModel = `
model CostCenter {
  id          String    @id @default(uuid())
  companyId   String    @map("company_id")
  name        String
  code        String
  description String?
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  expenses    Expense[]

  @@unique([companyId, code])
  @@index([companyId])
  @@map("tbl_cost_centers")
}
`;

// Inject before ExpenseCategory
content = content.replace('model ExpenseCategory {', costCenterModel + '\nmodel ExpenseCategory {');

// 2. Add properties to Expense
const expenseChanges = `
  // Cost Accounting Fields
  costType      String?           @map("cost_type") // FIXED, VARIABLE, CIF, MOD, MPD
  costCenterId  String?           @map("cost_center_id")
  isDeductible  Boolean           @default(true) @map("is_deductible")
  
  costCenter    CostCenter?       @relation(fields: [costCenterId], references: [id])
`;

content = content.replace(
  '  createdAt     DateTime          @default(now()) @map("created_at")',
  expenseChanges + '\n  createdAt     DateTime          @default(now()) @map("created_at")'
);

// 3. Add to Company model
content = content.replace(
  'expenses             Expense[]',
  'expenses             Expense[]\n  costCenters          CostCenter[]'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Prisma updated successfully!");
