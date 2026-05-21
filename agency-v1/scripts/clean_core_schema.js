const fs = require('fs');
const path = 'C:/Users/hboho/.gemini/antigravity/scratch/agency-v1/packages/database/prisma/schema.core.prisma';
let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);
// Remove lines 66 to 83 (0-indexed) which correspond to stray duplicate block
const start = 66; // line 67 in 1-indexed
const end = 83;   // line 84 in 1-indexed
lines.splice(start, end - start + 1);
fs.writeFileSync(path, lines.join('\n'));
console.log('✅ Cleaned stray duplicate block from schema.core.prisma');
