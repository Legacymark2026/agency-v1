const fs = require('fs');
const path = 'apps/web/components/dashboard/DashboardSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the line with "/dashboard/admin/treasury/transactions/new" and inject banking after it.
const searchStr = '{ href: "/dashboard/admin/treasury/transactions/new", label: "Nueva Transacción", icon: <DollarSign size={14} />, code: "NEW" },';
const replaceStr = searchStr + '\n            { href: "/dashboard/admin/treasury/banking", label: "Bancos (Open Banking)", icon: <Landmark size={14} />, code: "BNK" },';

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content, 'utf8');
