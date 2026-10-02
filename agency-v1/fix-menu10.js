const fs = require('fs');

const oldContent = fs.readFileSync('old-sidebar.tsx', 'utf8');
const itemsMatch = [...oldContent.matchAll(/\{ href:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*icon:\s*([^,]+),\s*code:\s*"([^"]+)" \}/g)];

const uniqueItems = [];
const seenHrefs = new Set();
itemsMatch.forEach(m => {
    if (!seenHrefs.has(m[1])) {
        seenHrefs.add(m[1]);
        uniqueItems.push({ href: m[1], label: m[2], icon: m[3].trim(), code: m[4] });
    }
});

// 11 Independent Areas
const menu = {
    "CLIENT": { title: "Portal del Cliente", accent: "teal", icon: "<Briefcase size={20} />", items: [] },
    "SALES": { title: "Ventas & CRM", accent: "emerald", icon: "<TrendingUp size={20} />", items: [] },
    "FINANCE": { title: "Finanzas & Contabilidad", accent: "emerald", icon: "<DollarSign size={20} />", items: [] },
    "MARKETING": { title: "Marketing & Growth", accent: "rose", icon: "<Target size={20} />", items: [] },
    "OPS": { title: "Operaciones & Logística", accent: "blue", icon: "<Boxes size={20} />", items: [] },
    "HR": { title: "Recursos Humanos", accent: "blue", icon: "<Users size={20} />", items: [] },
    "SUPPORT": { title: "Soporte Omnicanal", accent: "violet", icon: "<MessageSquare size={20} />", items: [] },
    "MEDIA": { title: "Contenido & Media", accent: "violet", icon: "<Wand2 size={20} />", items: [] },
    "AI": { title: "Inteligencia Artificial", accent: "cyan", icon: "<Bot size={20} />", items: [] },
    "DEV": { title: "Desarrollo & APIs", accent: "cyan", icon: "<Terminal size={20} />", items: [] },
    "SYSTEM": { title: "Sistema & Auditoría", accent: "slate", icon: "<Settings size={20} />", items: [] }
};

uniqueItems.forEach(item => {
    // 1. Client
    if (item.href.includes('/dashboard/client')) {
        menu["CLIENT"].items.push(item);
    } 
    // 2. Sales & CRM
    else if (item.href.match(/pos|catalog|sales-forecast|proposals|admin\/sales|crm/)) {
        menu["SALES"].items.push(item);
    }
    // 3. Finance
    else if (item.href.match(/invoicing|dian|accounting|admin\/invoices|treasury/)) {
        menu["FINANCE"].items.push(item);
    }
    // 4. Marketing
    else if (item.href.match(/marketing|promotions|seo|affiliate/)) {
        menu["MARKETING"].items.push(item);
    }
    // 5. Operations
    else if (item.href.match(/kanban|projects|events|inventory|channels|calendar/)) {
        menu["OPS"].items.push(item);
    }
    // 6. HR
    else if (item.href.match(/payroll|team|hr|employees/)) {
        menu["HR"].items.push(item);
    }
    // 7. Support
    else if (item.href.match(/inbox|chat/)) {
        menu["SUPPORT"].items.push(item);
    }
    // 8. Media
    else if (item.href.match(/feed|posts|video|media|voice|creative-studio/)) {
        menu["MEDIA"].items.push(item);
    }
    // 9. AI
    else if (item.href.match(/agents|ai-insights/) || item.href === '/dashboard/tools/master-hub') {
        menu["AI"].items.push(item);
    }
    // 10. Dev
    else if (item.href.match(/architecture|automation|webhooks|api-docs/)) {
        menu["DEV"].items.push(item);
    }
    // 11. System
    else {
        menu["SYSTEM"].items.push(item);
    }
});

let newNavGroups = `const NAV_GROUPS: NavGroup[] = [\n`;

for (const [code, domain] of Object.entries(menu)) {
    if (domain.items.length > 0) {
        newNavGroups += `    {
        title: "${domain.title}", code: "${code}",
        accent: "${domain.accent}", icon: ${domain.icon},
        items: [\n`;
        domain.items.forEach(i => {
            newNavGroups += `            { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`;
        });
        newNavGroups += `        ]
    },\n`;
    }
}
newNavGroups += `];`;

const currentPath = 'apps/web/components/dashboard/DashboardSidebar.tsx';
let currentContent = fs.readFileSync(currentPath, 'utf8');

const startIdx = currentContent.indexOf('const NAV_GROUPS: NavGroup[] = [');
const endIdx = currentContent.indexOf('];', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
  currentContent = currentContent.substring(0, startIdx) + newNavGroups + currentContent.substring(endIdx);
  fs.writeFileSync(currentPath, currentContent, 'utf8');
  console.log("Done");
}
