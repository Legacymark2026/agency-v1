const fs = require('fs');
const path = 'apps/web/components/dashboard/sidebar-client-content.tsx';
let content = fs.readFileSync(path, 'utf8');

const startIdx = content.indexOf('const accessibleGroups = useMemo(() => {');
const endIdx = content.indexOf('}, [navGroups, accessibleRoutes]);', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newMemo = `const accessibleGroups = useMemo(() => {
        const accessibleSet = new Set(accessibleRoutes);
        return navGroups.map(group => {
            const items = group.items ? group.items.filter(item => accessibleSet.has(item.href)) : [];
            const subGroups = group.subGroups 
                ? group.subGroups.map(sg => ({ ...sg, items: sg.items.filter(item => accessibleSet.has(item.href)) })).filter(sg => sg.items.length > 0)
                : [];
            return { ...group, items, subGroups };
        }).filter(group => (group.items && group.items.length > 0) || (group.subGroups && group.subGroups.length > 0));
    `;
    
    content = content.substring(0, startIdx) + newMemo + content.substring(endIdx);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Updated Memo successfully!");
} else {
    console.log("Could not find memo block");
}
