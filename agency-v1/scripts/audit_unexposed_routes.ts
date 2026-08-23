import fs from 'fs';
import path from 'path';

const dashboardRoot = path.join(__dirname, '../apps/web/app/(dashboard)');
const sidebarFile = path.join(__dirname, '../apps/web/components/dashboard/DashboardSidebar.tsx');

// Read all page.tsx
function getPages(dir: string, baseDir: string): string[] {
  let pages: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      pages = pages.concat(getPages(fullPath, baseDir));
    } else if (entry.name === 'page.tsx') {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const route = '/' + relPath.replace(/\/page\.tsx$/, '').replace(/^dashboard/, 'dashboard');
      pages.push(route === '/dashboard' ? '/dashboard' : route);
    }
  }
  return pages;
}

const allPages = getPages(dashboardRoot, dashboardRoot);
const sidebarContent = fs.readFileSync(sidebarFile, 'utf8');

// Extract all hrefs from sidebar
const hrefMatches = sidebarContent.match(/href:\s*["']([^"']+)["']/g) || [];
const sidebarHrefs = new Set(hrefMatches.map(m => m.replace(/href:\s*["']/, '').replace(/["']/, '')));

console.log('=== TOTAL PAGES FOUND IN DASHBOARD APP ROUTER ===', allPages.length);
console.log('=== TOTAL HREF LINKS IN SIDEBAR ===', sidebarHrefs.size);

const unexposed: string[] = [];
for (const p of allPages) {
  // Ignore dynamic parameter routes like [id], [slug], [agentId]
  if (p.includes('[') || p.includes(']')) continue;
  // Ignore sub-action routes like /new, /create if parent exists
  if (sidebarHrefs.has(p)) continue;
  unexposed.push(p);
}

console.log('\n=== UNEXPOSED TOP-LEVEL / WORKSPACE ROUTES ===');
console.log(JSON.stringify(unexposed, null, 2));
