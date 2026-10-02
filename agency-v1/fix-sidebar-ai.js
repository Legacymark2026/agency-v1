const fs = require('fs');
const path = 'apps/web/components/dashboard/DashboardSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchStr = '{ href: "/dashboard/settings/agents", label: "Agentes Autónomos IA", icon: <Bot size={14} />, code: "AGT" },';
const replaceStr = searchStr + '\n            { href: "/dashboard/settings/agents/delegation", label: "Delegación & Permisos (RBA)", icon: <ShieldCheck size={14} />, code: "DEL" },';

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content, 'utf8');
