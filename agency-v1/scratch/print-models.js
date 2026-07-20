const fs = require('fs');
const path = require('path');
const schemaPath = path.join(__dirname, '../apps/coffee-web/prisma/schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf8');

const modelRegex = /model\s+(\w+)\s+{/g;
let match;
const models = [];
while ((match = modelRegex.exec(content)) !== null) {
  models.push(match[1]);
}
console.log("Total models in coffee-web/prisma/schema.prisma:", models.length);
console.log("Models matching goldneez:", models.filter(m => m.toLowerCase().includes('goldneez')));
