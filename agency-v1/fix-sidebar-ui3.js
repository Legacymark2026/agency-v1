const fs = require('fs');
const path = 'apps/web/components/dashboard/sidebar-client-content.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update Interface
content = content.replace(
  'interface NavGroup { title: string; code: string; accent?: string; icon?: React.ReactNode; items: NavItem[]; }',
  'interface NavGroup { title: string; code: string; accent?: string; icon?: React.ReactNode; items?: NavItem[]; subGroups?: { title: string; items: NavItem[] }[]; }'
);

// 2. Update Memo (filtering accessible routes)
const oldMemo = `    const accessibleGroups = useMemo(() => {
        const accessibleSet = new Set(accessibleRoutes);
        return navGroups.map(group => ({
            ...group,
            items: group.items.filter(item => accessibleSet.has(item.href))
        })).filter(group => group.items.length > 0);
    }, [navGroups, accessibleRoutes]);`;

const newMemo = `    const accessibleGroups = useMemo(() => {
        const accessibleSet = new Set(accessibleRoutes);
        return navGroups.map(group => {
            const items = group.items ? group.items.filter(item => accessibleSet.has(item.href)) : [];
            const subGroups = group.subGroups 
                ? group.subGroups.map(sg => ({ ...sg, items: sg.items.filter(item => accessibleSet.has(item.href)) })).filter(sg => sg.items.length > 0)
                : [];
            return { ...group, items, subGroups };
        }).filter(group => (group.items && group.items.length > 0) || (group.subGroups && group.subGroups.length > 0));
    }, [navGroups, accessibleRoutes]);`;

content = content.replace(oldMemo, newMemo);

const oldActiveLogic = `            g.items.some(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/')))`;
const newActiveLogic = `            (g.items && g.items.some(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/')))) ||
            (g.subGroups && g.subGroups.some(sg => sg.items.some(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/')))))`;
content = content.replace(oldActiveLogic, newActiveLogic);
content = content.replace(oldActiveLogic, newActiveLogic); 

const newRender = `
{activeGroup.items && activeGroup.items.map((item) => {
    const isCurrent = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
    return (
        <Link
            key={item.href}
            href={item.href}
            className={\`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group \${isCurrent ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}\`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <span className={\`shrink-0 \${isCurrent ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}\`}>
                    {item.icon}
                </span>
                <span className="truncate leading-tight">{item.label}</span>
            </div>
            {item.code && <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">{item.code}</span>}
        </Link>
    );
})}
{activeGroup.subGroups && activeGroup.subGroups.map(subGroup => (
    <div key={subGroup.title} className="mt-5 mb-2">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50"></span>
            {subGroup.title}
        </h4>
        <div className="space-y-1">
            {subGroup.items.map((item) => {
                const isCurrent = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={\`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group \${isCurrent ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}\`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className={\`shrink-0 \${isCurrent ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}\`}>
                                {item.icon}
                            </span>
                            <span className="truncate leading-tight">{item.label}</span>
                        </div>
                        {item.code && <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">{item.code}</span>}
                    </Link>
                );
            })}
        </div>
    </div>
))}
`;

const renderStart = content.indexOf('{activeGroup.items.map((item) => {');
const renderEnd = content.indexOf('})}', renderStart) + 3;

if (renderStart !== -1 && renderEnd > renderStart) {
   content = content.substring(0, renderStart) + newRender + content.substring(renderEnd);
   fs.writeFileSync(path, content, 'utf8');
   console.log("Updated SidebarClientContent successfully");
} else {
    console.log("Could not find start or end of render");
}
