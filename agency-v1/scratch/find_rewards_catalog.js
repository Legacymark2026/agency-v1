const fs = require('fs');
const content = fs.readFileSync('apps/coffee-web/components/sections/UserDashboard.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('REWARDS_CATALOG')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
