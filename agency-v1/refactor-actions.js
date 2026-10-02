const fs = require('fs');
const path = 'apps/web/actions/costs.actions.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace the getCompanyId function and use requireTenant
content = content.replace(
    /async function getCompanyId\(\) \{[\s\S]*?\}/,
    'import { requireTenant } from "@/lib/tenant";'
);

content = content.replace(/const \{ companyId \} = await getCompanyId\(\);/g, 'const { companyId } = await requireTenant(false);');
content = content.replace(/const \{ companyId, userId \} = await getCompanyId\(\);/g, 'const { companyId, userId } = await requireTenant(false);');

fs.writeFileSync(path, content, 'utf8');
