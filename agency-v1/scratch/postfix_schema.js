/**
 * postfix_schema.js
 * Removes invalid @map() decorators from relation fields.
 * A relation field is identified by having @relation(...) on the same line.
 * Also removes @map() from lines that have relation-type-only fields
 * (e.g., "col_company  tbl_company[]" without @relation but still a model ref).
 */

const fs = require('fs');

const DEST = 'c:/Users/hboho/.gemini/antigravity/scratch/agency-v1/packages/database/prisma/schema.prisma';

let content = fs.readFileSync(DEST, 'utf8');
const lines = content.split('\n');

// Collect all model names (tbl_xxx) so we can detect relation fields by type
const modelNames = new Set();
lines.forEach(line => {
  const m = line.match(/^model\s+(\w+)\s*\{/);
  if (m) modelNames.add(m[1]);
});

const SCALAR_TYPES = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'BigInt', 'Decimal']);

function isRelationLine(line) {
  const trimmed = line.trim();
  // Explicit @relation decorator
  if (trimmed.includes('@relation')) return true;
  // Match field lines: "  col_xxx  SomeType[]? ..."
  const fm = trimmed.match(/^\w+\s+(\w+)(\[\])?(\?)?(\s|$)/);
  if (fm) {
    const typeName = fm[1];
    // If the type is a known model name, it's a relation
    if (modelNames.has(typeName)) return true;
    // If the type is not a scalar, treat as relation
    if (!SCALAR_TYPES.has(typeName)) return true;
  }
  return false;
}

const fixed = lines.map(line => {
  // Only touch field lines inside models (indented with 2 spaces)
  if (!line.startsWith('  ') || line.startsWith('   ') === false && line.startsWith('    ')) {
    // Actually, just check if it has @map and is a relation
  }
  if (line.includes('@map(') && isRelationLine(line)) {
    // Remove the trailing @map("...") 
    return line.replace(/\s*@map\("[^"]*"\)/, '');
  }
  return line;
});

fs.writeFileSync(DEST, fixed.join('\n'), 'utf8');
console.log('✅ Post-fix done: removed @map from relation fields');
