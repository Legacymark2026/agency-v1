const fs = require('fs');

const content = fs.readFileSync('apps/coffee-web/prisma/schema.prisma', 'utf8');
const models = [];
const lines = content.split('\n');
for (const line of lines) {
  const match = line.match(/^model\s+(\w+)\s+\{/);
  if (match) {
    models.push(match[1]);
  }
}
console.log("Total models:", models.length);
console.log(models.sort().join(", "));
