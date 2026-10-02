const fs = require('fs');
const path = 'packages/database/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('@@map("tbl_companies")', 'costCenters CostCenter[]\n  @@map("tbl_companies")');

fs.writeFileSync(path, content, 'utf8');
