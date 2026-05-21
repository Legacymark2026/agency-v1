// transform_schema.js
const fs = require('fs');
const path = require('path');

// Path to the shared Prisma schema (used by all services)
const schemaPath = path.resolve(__dirname, '../packages/database/prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Helper to prefix model names with tbl_
content = content.replace(/^model\s+(\w+)\s+\{/gm, (match, name) => {
  // Skip if already prefixed
  if (name.startsWith('tbl_')) return match;
  return `model tbl_${name} {`;
});

// Prefix fields with col_ (excluding attributes like @@map, @@index, etc.)
content = content.replace(/^(\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s+([^\n]*?)(?:(\s+@|\s*$))/gm, (match, indent, field, rest, atSign) => {
  // Do not touch relation fields (they start with a capital letter) or @ directives
  if (field[0] === field[0].toUpperCase()) return match;
  // Skip already prefixed
  if (field.startsWith('col_')) return match;
  return `${indent}col_${field} ${rest}${atSign || ''}`;
});

// Add col_schema_version field to each model if missing
content = content.replace(/model\s+tbl_(\w+)\s+\{([^}]*)\}/gm, (match, modelName, body) => {
  if (/col_schema_version\s+Int/.test(body)) return match; // already present
  const newField = '\n  col_schema_version Int @default(1)';
  const newBody = body + newField;
  return `model tbl_${modelName} {${newBody}\n}`;
});

// Ensure refresh token table exists (add if not present)
if (!/model\s+tbl_auth_refresh_tokens\b/.test(content)) {
  const refreshModel = `\nmodel tbl_auth_refresh_tokens {\n  col_id                String   @id @default(uuid())\n  col_user_id           String\n  col_refresh_token_encrypted String   @unique\n  col_expires_at       DateTime\n  col_used             Boolean  @default(false)\n  col_created_at       DateTime @default(now())\n  col_schema_version   Int      @default(1)\n}\n`;
  content += refreshModel;
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Schema transformation complete.');
