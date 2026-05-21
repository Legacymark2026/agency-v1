const fs = require('fs');
const path = require('path');

const prismaDir = 'C:/Users/hboho/.gemini/antigravity/scratch/agency-v1/packages/database/prisma';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace custom scalar aliases
  content = content.replace(/col_string/g, 'String');
  content = content.replace(/col_float/g, 'Float');
  content = content.replace(/col_date_time/g, 'DateTime');
  // Split merged field definitions (simple heuristic)
  // Look for pattern: <name> String <name2> ... (optional attributes after second name)
  const lines = content.split(/\r?\n/);
  const newLines = [];
  const fieldRegex = /^(\s*\w+)\s+(String|Int|Float|DateTime|Boolean|Json)(\s+\w+\s+(String|Int|Float|DateTime|Boolean|Json).*)$/;
  for (let line of lines) {
    const m = line.match(fieldRegex);
    if (m) {
      // keep first field, then split rest onto new line
      const first = `${m[1]} ${m[2]}`;
      const rest = m[3].trim();
      newLines.push(first);
      newLines.push('  ' + rest);
    } else {
      newLines.push(line);
    }
  }
  const fixed = newLines.join('\n');
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log(`Fixed ${filePath}`);
}

fs.readdirSync(prismaDir).forEach(file => {
  if (file.endsWith('.prisma')) {
    fixFile(path.join(prismaDir, file));
  }
});
