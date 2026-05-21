// generate_sql.js
const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../packages/database/prisma/schema.prisma');
const sqlPath = path.resolve(__dirname, 'rename_and_version.sql');

const schema = fs.readFileSync(schemaPath, 'utf8');

// Simple regex to capture model definitions
const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
let match;
let statements = [];
while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1];
  const body = match[2];
  const tableName = `tbl_${modelName}`;
  // Rename table if not already prefixed
  if (!modelName.startsWith('tbl_')) {
    statements.push(`ALTER TABLE "${modelName}" RENAME TO "${tableName}";`);
  }
  // Process fields
  const fieldLines = body.split('\n');
  fieldLines.forEach(line => {
    const fieldMatch = line.match(/^\s*(\w+)\s+([\w\[\]\(\)]+)(.*)$/);
    if (!fieldMatch) return;
    const fieldName = fieldMatch[1];
    const fieldType = fieldMatch[2];
    const rest = fieldMatch[3];
    // Skip relation fields (type starts with uppercase letter)
    if (fieldType[0] === fieldType[0].toUpperCase()) return;
    if (fieldName.startsWith('col_')) return;
    const newField = `col_${fieldName}`;
    statements.push(`ALTER TABLE "${tableName}" RENAME COLUMN "${fieldName}" TO "${newField}";`);
  });
  // Add schema_version column if missing
  if (!/col_schema_version\s+Int/.test(body)) {
    statements.push(`ALTER TABLE "${tableName}" ADD COLUMN "col_schema_version" INT DEFAULT 1;`);
  }
}
// Ensure refresh token table exists
statements.push(`CREATE TABLE IF NOT EXISTS "tbl_auth_refresh_tokens" (
  "col_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "col_user_id" UUID NOT NULL,
  "col_refresh_token_encrypted" TEXT NOT NULL UNIQUE,
  "col_expires_at" TIMESTAMP NOT NULL,
  "col_used" BOOLEAN DEFAULT FALSE,
  "col_created_at" TIMESTAMP DEFAULT now(),
  "col_schema_version" INT DEFAULT 1
);`);

fs.writeFileSync(sqlPath, statements.join('\n'), 'utf8');
console.log('SQL script generated at', sqlPath);
