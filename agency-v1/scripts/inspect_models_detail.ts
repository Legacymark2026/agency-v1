import fs from 'fs';
import path from 'path';

const schema = fs.readFileSync(path.join(__dirname, '../apps/web/prisma/schema.prisma'), 'utf8');

function extractModel(modelName: string) {
  const regex = new RegExp(`model\\s+${modelName}\\s+\\{([^}]+)\\}`, 's');
  const match = schema.match(regex);
  if (match) {
    console.log(`\n=== MODEL: ${modelName} ===\n` + match[0]);
  }
}

extractModel('Invoice');
extractModel('Expense');
extractModel('FinancialAccount');
extractModel('FinancialTransaction');
extractModel('Payroll');
extractModel('Employee');
