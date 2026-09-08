import fs from 'fs';
import path from 'path';

const schemaPath = path.join(__dirname, '../apps/web/prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

const modelMatches = schema.match(/model\s+(\w+)\s+\{/g) || [];
const models = modelMatches.map(m => m.replace(/model\s+/, '').replace(/\s+\{/, ''));

console.log('Total Prisma Models:', models.length);
const financialModels = models.filter(m => 
  /invoice|expense|payroll|account|voucher|journal|tax|payment|transaction|lead|deal|client|employee/i.test(m)
);
console.log('Financial / CRM / Business Models in Prisma:', financialModels);
