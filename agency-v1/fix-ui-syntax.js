const fs = require('fs');
const path = 'apps/web/app/(dashboard)/dashboard/(sales-and-finance)/accounting/costs/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /const MOCK_TREND = \[[\s\S]*?\];/,
    \const MOCK_TREND = [
    { month: "May", fijos: 31000000, variables: 12000000, cif: 4000000 },
    { month: "Jun", fijos: 31000000, variables: 14000000, cif: 4200000 },
    { month: "Jul", fijos: 32000000, variables: 11000000, cif: 4100000 },
    { month: "Ago", fijos: 32000000, variables: 18000000, cif: 4800000 },
    { month: "Sep", fijos: 32000000, variables: 16000000, cif: 4500000 },
    { month: "Oct", fijos: 32500000, variables: 15000000, cif: 5000000 },
];\
);

// Also fix the components properties where I passed 50M
content = content.replace(/budget=\{50M\}/g, 'budget={50}');
content = content.replace(/spent=\{39M\}/g, 'spent={39}');
content = content.replace(/budget=\{20M\}/g, 'budget={20}');
content = content.replace(/spent=\{14M\}/g, 'spent={14}');
content = content.replace(/budget=\{15M\}/g, 'budget={15}');
content = content.replace(/spent=\{16M\}/g, 'spent={16}');
content = content.replace(/budget=\{12M\}/g, 'budget={12}');
content = content.replace(/spent=\{8M\}/g, 'spent={8}');
content = content.replace(/budget=\{10M\}/g, 'budget={10}');
content = content.replace(/spent=\{9M\}/g, 'spent={9}');

fs.writeFileSync(path, content, 'utf8');
