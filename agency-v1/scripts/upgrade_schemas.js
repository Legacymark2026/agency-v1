// upgrade_schemas.js
const fs = require('fs');
const path = require('path');

// Directory containing prisma schemas
const prismaDir = path.resolve(__dirname, '../packages/database/prisma');

// Helper to convert CamelCase to snake_case
function toSnake(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

// Process a single schema file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Rename models
  content = content.replace(/model\s+(\w+)\s+{\n/g, (match, modelName) => {
    const newModel = 'tbl_' + toSnake(modelName);
    return `model ${newModel} {\n`;
  });
  // Rename fields and add prefixes
  content = content.replace(/(\s+)(\w+)\s+([^@\n]*)(@\w+|$)/g, (m, ws, field, after, attr) => {
    // Skip already prefixed fields
    if (field.startsWith('col_') || field === 'id') return m;
    const newField = 'col_' + toSnake(field);
    return `${ws}${newField} ${after}${attr}`;
  });
  // Add version column if missing
  const lines = content.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);
    if (line.trim().startsWith('model ')) {
      // after opening brace, ensure version column exists before closing brace
      let j = i + 1;
      let hasVersion = false;
      while (j < lines.length && !lines[j].includes('}')) {
        if (lines[j].includes('col_schema_version')) { hasVersion = true; break; }
        j++;
      }
      if (!hasVersion) {
        newLines.splice(j, 0, '  col_schema_version Int @default(1) @map("col_schema_version")');
      }
    }
  }
  content = newLines.join('\n');
  // Add refresh token model only in auth service schema
  if (path.basename(filePath).includes('auth')) {
    if (!content.includes('tbl_auth_refresh_tokens')) {
      content += `\nmodel tbl_auth_refresh_tokens {\n  col_id                     Int      @id @default(autoincrement())\n  col_user_id                Int\n  col_refresh_token_encrypted String   @default(\"\")\n  col_expires_at             DateTime\n  col_schema_version         Int      @default(1) @map(\"col_schema_version\")\n  @@map(\"tbl_auth_refresh_tokens\")\n}\n`;
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Processed ${path.basename(filePath)}`);
}

fs.readdirSync(prismaDir).forEach(f => {
  if (f.endsWith('.prisma')) processFile(path.join(prismaDir, f));
});
