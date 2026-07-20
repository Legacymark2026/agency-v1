const fs = require('fs');
const path = require('path');
const prismaDir = path.join(__dirname, '../packages/database/prisma');

const files = fs.readdirSync(prismaDir);
for (const file of files) {
  if (file.endsWith('.prisma')) {
    const filePath = path.join(prismaDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('goldneez')) {
        matches.push(`${idx + 1}: ${line.trim()}`);
      }
    });
    if (matches.length > 0) {
      console.log(`File: ${file}`);
      matches.forEach(m => console.log(`  ${m}`));
    }
  }
}
