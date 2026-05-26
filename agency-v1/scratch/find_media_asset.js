const fs = require('fs');
const path = require('path');

const prismaDir = 'packages/database/prisma';
const files = fs.readdirSync(prismaDir);

for (const file of files) {
  if (file.endsWith('.prisma')) {
    const filePath = path.join(prismaDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all "model X" declarations
    const modelMatches = content.match(/model\s+(\w+)/g);
    if (modelMatches) {
      console.log(`--- Models in ${file} ---`);
      modelMatches.forEach(m => {
        console.log(m);
      });
    }
  }
}
