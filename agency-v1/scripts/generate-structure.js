import { readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const EXCLUDE = ['node_modules', '.git', '.turbo', '.unlighthouse', '.vscode', '.next', 'dist', 'build', '.cache'];

function getTree(dir, prefix = '', isLast = true) {
  const lines = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return lines;
  }

  const filtered = entries.filter(e => !EXCLUDE.some(ex => e.includes(ex)));

  filtered.forEach((entry, i) => {
    const isLastEntry = i === filtered.length - 1;
    const branch = isLastEntry ? '└── ' : '├── ';
    const fullPath = join(dir, entry);
    lines.push(`${prefix}${branch}${entry}`);

    try {
      if (statSync(fullPath).isDirectory()) {
        lines.push(...getTree(fullPath, prefix + (isLastEntry ? '    ' : '│   '), isLastEntry));
      }
    } catch {}
  });

  return lines;
}

const structure = getTree(ROOT).join('\n');
const timestamp = new Date().toISOString();
const content = `# Agency-v1 Project Structure

Generated at: ${timestamp}

\`\`\`
${structure}
\`\`\`

---
*Auto-generated file. Run \`npm run generate-structure\` to update.*
`;

writeFileSync(join(ROOT, 'PROJECT_STRUCTURE.md'), content);
console.log('✓ Project structure generated: PROJECT_STRUCTURE.md');
