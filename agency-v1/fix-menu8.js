const fs = require('fs');

const oldContent = fs.readFileSync('old-sidebar.tsx', 'utf8');

// Use regex to find all items
const itemsMatch = [...oldContent.matchAll(/\{ href:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*icon:\s*([^,]+),\s*code:\s*"([^"]+)" \}/g)];

const allItems = itemsMatch.map(m => {
    return { href: m[1], label: m[2], icon: m[3].trim(), code: m[4] };
});

const grouped = {
    PORTAL: [],
    VENTAS: [],
    MKT: [],
    OPS: [],
    COMMS: [],
    SYS: []
};

allItems.forEach(item => {
    if (item.href.includes('/dashboard/client')) {
        grouped.PORTAL.push(item);
    } else if (item.href.match(/pos|catalog|invoicing|dian|treasury|sales-forecast|invoices/)) {
        grouped.VENTAS.push(item);
    } else if (item.href.match(/marketing|crm|promotions|seo|affiliate/)) {
        grouped.MKT.push(item);
    } else if (item.href.match(/kanban|projects|events|payroll|team|hr|inventory/)) {
        grouped.OPS.push(item);
    } else if (item.href.match(/inbox|chat|feed|posts|video|media|voice|creative-studio/)) {
        grouped.COMMS.push(item);
    } else {
        grouped.SYS.push(item);
    }
});

let newNavGroups = `const NAV_GROUPS: NavGroup[] = [
    {
        title: "Portal del Cliente", code: "CLIENT_PORTAL",
        accent: "teal", icon: <Briefcase size={20} />,
        items: [\n`;
grouped.PORTAL.forEach(i => newNavGroups += `            { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `        ]
    },
    {
        title: "Ventas & Finanzas", code: "SALES_FIN",
        accent: "emerald", icon: <DollarSign size={20} />,
        subGroups: [
            {
                title: "Ventas y Catálogo",
                items: [\n`;
grouped.VENTAS.filter(i => i.href.match(/pos|catalog|sales-forecast/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            },
            {
                title: "Facturación & Finanzas",
                items: [\n`;
grouped.VENTAS.filter(i => !i.href.match(/pos|catalog|sales-forecast/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            }
        ]
    },
    {
        title: "Marketing & CRM", code: "MKT_CRM",
        accent: "rose", icon: <Target size={20} />,
        subGroups: [
            {
                title: "CRM & Embudos",
                items: [\n`;
grouped.MKT.filter(i => i.href.match(/crm|leads|deals/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            },
            {
                title: "Campañas y Performance",
                items: [\n`;
grouped.MKT.filter(i => !i.href.match(/crm|leads|deals|affiliate/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            },
            {
                title: "Red de Afiliados",
                items: [\n`;
grouped.MKT.filter(i => i.href.match(/affiliate/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            }
        ]
    },
    {
        title: "Operaciones & RRHH", code: "OPS_HR",
        accent: "blue", icon: <Layers size={20} />,
        subGroups: [
            {
                title: "Operaciones",
                items: [\n`;
grouped.OPS.filter(i => i.href.match(/kanban|projects|events|inventory/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            },
            {
                title: "Recursos Humanos",
                items: [\n`;
grouped.OPS.filter(i => !i.href.match(/kanban|projects|events|inventory/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            }
        ]
    },
    {
        title: "Comunicación & Media", code: "COM_MED",
        accent: "violet", icon: <MessageSquare size={20} />,
        subGroups: [
            {
                title: "Atención y Soporte",
                items: [\n`;
grouped.COMMS.filter(i => i.href.match(/inbox|chat/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            },
            {
                title: "Contenido y Media",
                items: [\n`;
grouped.COMMS.filter(i => !i.href.match(/inbox|chat/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            }
        ]
    },
    {
        title: "Sistema, IA & Seguridad", code: "SYS_AI",
        accent: "cyan", icon: <Settings size={20} />,
        subGroups: [
            {
                title: "Inteligencia Artificial",
                items: [\n`;
grouped.SYS.filter(i => i.href.match(/tools|agents|ai-insights/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            },
            {
                title: "Desarrollo y APIs",
                items: [\n`;
grouped.SYS.filter(i => i.href.match(/architecture|automation/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            },
            {
                title: "Sistema y Auditoría",
                items: [\n`;
grouped.SYS.filter(i => !i.href.match(/tools|agents|ai-insights|architecture|automation/)).forEach(i => newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`);
newNavGroups += `                ]
            }
        ]
    }
];`;

const currentPath = 'apps/web/components/dashboard/DashboardSidebar.tsx';
let currentContent = fs.readFileSync(currentPath, 'utf8');

const startIdx = currentContent.indexOf('const NAV_GROUPS: NavGroup[] = [');
const endIdx = currentContent.indexOf('];', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
  currentContent = currentContent.substring(0, startIdx) + newNavGroups + currentContent.substring(endIdx);
  fs.writeFileSync(currentPath, currentContent, 'utf8');
  console.log("Replaced exactly " + allItems.length + " items successfully!");
} else {
  console.log("Could not find NAV_GROUPS");
}
