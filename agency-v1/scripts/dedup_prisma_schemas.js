// dedup_prisma_schemas.js
// This script scans all *.prisma files and removes duplicate schemaVersion, deletedAt, schema_version, deleted_at fields
// and ensures a single @@map with tbl_ prefix per model.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function findPrismaFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findPrismaFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.prisma')) files.push(full);
  }
  return files;
}

function toTableName(model) {
  const snake = model.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  return snake.endsWith('s') ? snake : `${snake}s`;
}

function processFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const out = [];
  let inside = false;
  let modelName = '';
  const fieldsSeen = new Set();
  let mapSeen = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    const modelMatch = trimmed.match(/^model\s+(\w+)\s+\{\s*$/);
    if (modelMatch) {
      inside = true;
      modelName = modelMatch[1];
      fieldsSeen.clear();
      mapSeen = false;
      out.push(line);
      continue;
    }
    if (inside && trimmed === '}') {
      if (!fieldsSeen.has('schema_version')) {
        out.push('  schemaVersion Int @default(0) @map("col_schema_version")');
      }
      if (!fieldsSeen.has('deleted_at')) {
        out.push('  deletedAt DateTime? @map("col_deleted_at")');
      }
      if (!mapSeen) {
        const tbl = `tbl_${toTableName(modelName)}`;
        out.push(`  @@map("${tbl}")`);
      }
      out.push(line);
      inside = false;
      continue;
    }
    if (inside) {
      if (/schemaVersion\s+Int/.test(trimmed) || /deletedAt\s+DateTime\?/.test(trimmed) || /schema_version\s+Int/.test(trimmed) || /deleted_at\s+DateTime\?/.test(trimmed)) {
        if (/schemaVersion/.test(trimmed) || /schema_version/.test(trimmed)) fieldsSeen.add('schema_version');
        if (/deletedAt/.test(trimmed) || /deleted_at/.test(trimmed)) fieldsSeen.add('deleted_at');
        continue;
      }
      if (/@@map\(/.test(trimmed)) {
        if (!mapSeen) {
          const match = trimmed.match(/@@map\("([^"]+)"\)/);
          let current = match ? match[1] : '';
          if (!current.startsWith('tbl_')) current = `tbl_${current}`;
          out.push(`  @@map("${current}")`);
          mapSeen = true;
        }
        continue;
      }
    }
    out.push(line);
  }
  fs.writeFileSync(filePath, out.join('\n'), 'utf8');
  console.log(`✅ Cleaned ${path.relative(ROOT, filePath)}`);
}

function main() {
  const files = findPrismaFiles(ROOT);
  console.log(`Found ${files.length} Prisma files for cleanup.`);
  files.forEach(processFile);
}

main();
