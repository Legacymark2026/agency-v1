const fs = require('fs');
const path = 'apps/web/components/dashboard/DashboardSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = '{ href: "/dashboard/admin/treasury/transactions/new", label: "Nueva Transacción", icon: <DollarSign size={14} />, code: "NEW" },';
const newStr = oldStr + '\n            { href: "/dashboard/accounting/costs", label: "Contabilidad de Costos", icon: <Activity size={14} />, code: "CST" },';

content = content.replace(oldStr, newStr);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated Sidebar");
