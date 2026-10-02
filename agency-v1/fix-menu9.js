const fs = require('fs');

const oldContent = fs.readFileSync('old-sidebar.tsx', 'utf8');

// Use regex to find all items
const itemsMatch = [...oldContent.matchAll(/\{ href:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*icon:\s*([^,]+),\s*code:\s*"([^"]+)" \}/g)];

// Eliminate perfect duplicates
const uniqueItems = [];
const seenHrefs = new Set();
itemsMatch.forEach(m => {
    if (!seenHrefs.has(m[1])) {
        seenHrefs.add(m[1]);
        uniqueItems.push({ href: m[1], label: m[2], icon: m[3].trim(), code: m[4] });
    }
});

console.log("Found " + uniqueItems.length + " unique items.");

// 6 Master Domains with SubGroups
const menu = {
    "CLIENT_PORTAL": { title: "Portal del Cliente", subGroups: { "Resumen": [] } },
    "SALES_FIN": { 
        title: "Ventas & Finanzas", 
        subGroups: { 
            "Ventas y CRM": [],
            "Contabilidad y Facturación": [],
            "Tesorería": [] 
        } 
    },
    "MKT_CRM": { 
        title: "Marketing & Growth", 
        subGroups: { 
            "Marketing": [],
            "Red de Afiliados": []
        } 
    },
    "OPS_HR": { 
        title: "Operaciones & RRHH", 
        subGroups: { 
            "Operaciones y Logística": [],
            "Nómina y Equipo": []
        } 
    },
    "COM_MED": { 
        title: "Comunicación & Media", 
        subGroups: { 
            "Atención y Soporte": [],
            "Media y Contenido": []
        } 
    },
    "SYS_AI": { 
        title: "Sistema, IA & Seguridad", 
        subGroups: { 
            "Inteligencia Artificial": [],
            "Desarrollo y APIs": [],
            "Sistema y Auditoría": []
        } 
    }
};

uniqueItems.forEach(item => {
    // 1. Portal del Cliente
    if (item.href.includes('/dashboard/client')) {
        menu["CLIENT_PORTAL"].subGroups["Resumen"].push(item);
    } 
    
    // 2. Ventas & Finanzas
    else if (item.href.match(/pos|catalog|sales-forecast|proposals|admin\/sales/)) {
        menu["SALES_FIN"].subGroups["Ventas y CRM"].push(item);
    }
    else if (item.href.match(/invoicing|dian|accounting|admin\/invoices/)) {
        menu["SALES_FIN"].subGroups["Contabilidad y Facturación"].push(item);
    }
    else if (item.href.match(/treasury/)) {
        menu["SALES_FIN"].subGroups["Tesorería"].push(item);
    }
    
    // 3. Marketing & CRM (Wait, is CRM marketing or sales? Let's put CRM in Ventas and Marketing in Mkt)
    else if (item.href.match(/\/crm\//) || item.href === '/dashboard/admin/crm') {
        menu["SALES_FIN"].subGroups["Ventas y CRM"].push(item);
    }
    else if (item.href.match(/marketing|promotions|seo/)) {
        menu["MKT_CRM"].subGroups["Marketing"].push(item);
    }
    else if (item.href.match(/affiliate/)) {
        menu["MKT_CRM"].subGroups["Red de Afiliados"].push(item);
    }
    
    // 4. Operaciones & RRHH
    else if (item.href.match(/kanban|projects|events|inventory|channels|calendar/)) {
        menu["OPS_HR"].subGroups["Operaciones y Logística"].push(item);
    }
    else if (item.href.match(/payroll|team|hr|employees/)) {
        menu["OPS_HR"].subGroups["Nómina y Equipo"].push(item);
    }
    
    // 5. Comunicación & Media
    else if (item.href.match(/inbox|chat/)) {
        menu["COM_MED"].subGroups["Atención y Soporte"].push(item);
    }
    else if (item.href.match(/feed|posts|video|media|voice|creative-studio/)) {
        menu["COM_MED"].subGroups["Media y Contenido"].push(item);
    }
    
    // 6. Sistema, IA & Seguridad
    else if (item.href.match(/tools|agents|ai-insights/)) {
        menu["SYS_AI"].subGroups["Inteligencia Artificial"].push(item);
    }
    else if (item.href.match(/architecture|automation/)) {
        menu["SYS_AI"].subGroups["Desarrollo y APIs"].push(item);
    }
    else {
        // Anything else
        menu["SYS_AI"].subGroups["Sistema y Auditoría"].push(item);
    }
});

let newNavGroups = `const NAV_GROUPS: NavGroup[] = [\n`;

const icons = {
    "CLIENT_PORTAL": "<Briefcase size={20} />",
    "SALES_FIN": "<DollarSign size={20} />",
    "MKT_CRM": "<Target size={20} />",
    "OPS_HR": "<Layers size={20} />",
    "COM_MED": "<MessageSquare size={20} />",
    "SYS_AI": "<Settings size={20} />"
};
const accents = {
    "CLIENT_PORTAL": "teal",
    "SALES_FIN": "emerald",
    "MKT_CRM": "rose",
    "OPS_HR": "blue",
    "COM_MED": "violet",
    "SYS_AI": "cyan"
};

for (const [code, domain] of Object.entries(menu)) {
    newNavGroups += `    {
        title: "${domain.title}", code: "${code}",
        accent: "${accents[code]}", icon: ${icons[code]},
        subGroups: [\n`;
        
    for (const [sgTitle, items] of Object.entries(domain.subGroups)) {
        if (items.length > 0) {
            newNavGroups += `            {
                title: "${sgTitle}",
                items: [\n`;
            items.forEach(i => {
                newNavGroups += `                    { href: "${i.href}", label: "${i.label}", icon: ${i.icon}, code: "${i.code}" },\n`;
            });
            newNavGroups += `                ]
            },\n`;
        }
    }
    
    newNavGroups += `        ]
    },\n`;
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
