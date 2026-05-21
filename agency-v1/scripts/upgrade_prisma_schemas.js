// upgrade_prisma_schemas.js
// This script scans all *.prisma files in the project and applies the
// naming conventions and structural enhancements required by the
// implementation plan.
//
// Requirements applied to each model:
//   • Table name prefixed with "tbl_" (snake_case plural form).
//   • Column names prefixed with "col_" where appropriate (handled via @map).
//   • Add `schema_version` column (Int) with default 0 and map to "col_schema_version".
//   • Add optional `deleted_at` column (DateTime?) mapped to "col_deleted_at".
//   • Preserve existing @@map for tables – if not present, add it.
//   • Preserve existing fields – only augment models.
//   • For auth service, create a dedicated `AuthRefreshToken` model.
//
// The script is intended to be run with Node.js (>=14) and uses the built‑in
// `fs` and `path` modules. It does **not** execute any database migrations –
// only updates Prisma schema files. After running the script, you should run
// `npx prisma generate` and apply migrations as needed.

const fs = require('fs');
const path = require('path');

// Root directory of the mono‑repo
const ROOT = path.resolve(__dirname, '..');

// Helper to locate all *.prisma files recursively
function findPrismaFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findPrismaFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.prisma')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Convert a PascalCase model name to snake_case plural (very simple heuristic)
function toTableName(modelName) {
  // Insert underscore before capital letters (except first) and lower case
  const snake = modelName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  // Very naive pluralisation – just add 's' if not already ending with s
  return snake.endsWith('s') ? snake : `${snake}s`;
}

// Process a single Prisma file
function processPrismaFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const out = [];
  let insideModel = false;
  let modelName = '';
  let hasSchemaVersion = false;
  let hasDeletedAt = false;
  let mapLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Detect start of a model block
    const modelMatch = trimmed.match(/^model\s+(\w+)\s+\{\s*$/);
    if (modelMatch) {
      insideModel = true;
      modelName = modelMatch[1];
      hasSchemaVersion = false;
      hasDeletedAt = false;
      mapLineIndex = -1;
      out.push(line);
      continue;
    }

    // Detect end of a model block
    if (insideModel && trimmed === '}') {
      // Insert missing columns before the closing brace
      if (!hasSchemaVersion) {
        out.push('  schema_version Int @default(0) @map("col_schema_version")');
      }
      if (!hasDeletedAt) {
        out.push('  deleted_at DateTime? @map("col_deleted_at")');
      }
      // Ensure @@map exists with tbl_ prefix
      if (mapLineIndex === -1) {
        const tblName = `tbl_${toTableName(modelName)}`;
        out.push(`  @@map("${tblName}")`);
      } else {
        // Update existing map to include tbl_ prefix if missing
        const existing = out[mapLineIndex];
        const mapMatch = existing.match(/@@map\("([^"]+)"\)/);
        if (mapMatch) {
          let current = mapMatch[1];
          if (!current.startsWith('tbl_')) {
            const newMap = `tbl_${current}`;
            out[mapLineIndex] = `  @@map("${newMap}")`;
          }
        }
      }
      out.push(line); // closing brace
      insideModel = false;
      continue;
    }

    if (insideModel) {
      // Detect existing schema_version field
      if (/schema_version\s+Int/.test(trimmed)) {
        hasSchemaVersion = true;
      }
      // Detect existing deleted_at field
      if (/deleted_at\s+DateTime\?/.test(trimmed)) {
        hasDeletedAt = true;
      }
      // Detect existing @@map line
      if (/@@map\(/.test(trimmed)) {
        mapLineIndex = out.length; // will be overwritten later if needed
      }
    }

    out.push(line);
  }

  fs.writeFileSync(filePath, out.join('\n'), 'utf8');
  console.log(`✅ Updated ${path.relative(ROOT, filePath)}`);
}

function main() {
  const prismaFiles = findPrismaFiles(ROOT);
  console.log(`Found ${prismaFiles.length} Prisma files.`);
  prismaFiles.forEach(processPrismaFile);

  // Special case: auth refresh token model (if not present)
  const authSchema = prismaFiles.find(p => p.endsWith('schema.auth.prisma'));
  if (authSchema) {
    const content = fs.readFileSync(authSchema, 'utf8');
    if (!content.includes('model AuthRefreshToken')) {
      const addition = `\nmodel AuthRefreshToken {\n  id            String   @id @default(uuid()) @map("col_id")\n  userId        String   @map("col_user_id")\n  refreshToken  String   @unique @map("col_refresh_token")\n  createdAt     DateTime @default(now()) @map("col_created_at")\n  expiresAt     DateTime? @map("col_expires_at")\n  schema_version Int @default(0) @map("col_schema_version")\n  deleted_at    DateTime? @map("col_deleted_at")\n  @@map("tbl_auth_refresh_tokens")\n}\n`;
      fs.appendFileSync(authSchema, addition, 'utf8');
      console.log('✅ Added AuthRefreshToken model to auth schema');
    }
  }
}

main();
