const fs = require('fs');
const path = 'apps/web/app/(dashboard)/dashboard/(sales-and-finance)/accounting/costs/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    'initialExpenses={expenses}',
    'initialExpenses={JSON.parse(JSON.stringify(expenses))}'
);

content = content.replace(
    'initialCostCenters={costCenters}',
    'initialCostCenters={JSON.parse(JSON.stringify(costCenters))}'
);

fs.writeFileSync(path, content, 'utf8');
