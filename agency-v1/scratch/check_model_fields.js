const fs = require('fs');

const content = fs.readFileSync('apps/coffee-web/prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
let print = false;
let printedLines = 0;
for (const line of lines) {
  if (line.trim().startsWith('model UserProfile')) {
    print = true;
  }
  if (print) {
    console.log(line);
    printedLines++;
    if (printedLines > 40) break;
    if (line.trim() === '}') break;
  }
}
