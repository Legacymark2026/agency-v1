const fs = require('fs');
const path = require('path');
const servicesDir = path.join(__dirname, 'services');
const dirs = fs.readdirSync(servicesDir);

for (const dir of dirs) {
  const p = path.join(servicesDir, dir, 'Dockerfile');
  if (!fs.existsSync(p)) continue;
  let c = fs.readFileSync(p, 'utf-8');
  
  // The file literally contains `\nCOPY`
  c = c.replace(/\\nCOPY packages\/database/g, '\nCOPY packages/database');
  
  fs.writeFileSync(p, c);
}
