/**
 * rebuild_main_schema.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads the CLEAN original schema from temp_schemas/ and applies correct
 * naming conventions in one atomic pass:
 *
 *   1. Prefixes model names:  Company        → tbl_company
 *   2. Prefixes field names:  companyId      → col_company_id  (via @map)
 *   3. Updates ALL references:
 *      - relation type refs:  Company[]      → tbl_company[]
 *      - relation fields[]:   [companyId]    → [col_company_id]
 *      - @@index / @@unique:  [companyId]    → [col_company_id]
 *   4. Fixes generator keywords:  col_output → output
 *   5. Adds tbl_ prefix to @@map() values
 *   6. Adds col_schema_version + col_deleted_at to every model
 *   7. Appends the tbl_outbox_event model (Transactional Outbox Pattern)
 */

const fs = require('fs');
const path = require('path');

const SRC  = 'c:/Users/hboho/.gemini/antigravity/scratch/agency-v1/scratch/temp_schemas/schema.prisma';
const DEST = 'c:/Users/hboho/.gemini/antigravity/scratch/agency-v1/packages/database/prisma/schema.prisma';

// ─── helpers ─────────────────────────────────────────────────────────────────

function toSnake(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function toTableName(modelName) {
  const snake = toSnake(modelName);
  return snake.endsWith('s') ? snake : `${snake}s`;
}

// ─── pass 1: collect all model names ─────────────────────────────────────────

function collectModels(content) {
  const modelMap = {}; // PascalCase → tbl_snake
  const re = /^model\s+(\w+)\s*\{/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const original = m[1];
    if (!original.startsWith('tbl_')) {
      modelMap[original] = `tbl_${toTableName(original)}`;
    }
  }
  return modelMap;
}

// ─── pass 2: collect all fields per model ────────────────────────────────────

function collectFields(content, modelMap) {
  // Returns: { modelName: { camelField: col_snake_field, ... }, ... }
  const fieldMaps = {};

  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^}/gm;
  let mMatch;
  while ((mMatch = modelRe.exec(content)) !== null) {
    const modelName = mMatch[1];
    const body = mMatch[2];
    fieldMaps[modelName] = {};

    // Match field lines: "  fieldName  TypeOrRef ..."
    const fieldRe = /^\s{2}(\w+)\s+/gm;
    let fMatch;
    while ((fMatch = fieldRe.exec(body)) !== null) {
      const field = fMatch[1];
      // Skip Prisma block attributes (@@ lines) and already-prefixed
      if (field.startsWith('@@') || field.startsWith('@') || field.startsWith('col_')) continue;
      // Skip relation fields that start with UpperCase (they are virtual)
      // We keep them but rename only the scalar fields
      if (/^[A-Z]/.test(field)) continue; // uppercase = type/model reference
      fieldMaps[modelName][field] = `col_${toSnake(field)}`;
    }
  }
  return fieldMaps;
}

// ─── main transform ──────────────────────────────────────────────────────────

function transform(content) {
  const modelMap   = collectModels(content);
  const fieldMaps  = collectFields(content, modelMap);

  // Build a reverse lookup: for any field name that exists anywhere,
  // give us the col_ version. We use a global map for index/relation fixes.
  const globalFieldRename = {};
  for (const [, fmap] of Object.entries(fieldMaps)) {
    for (const [orig, renamed] of Object.entries(fmap)) {
      globalFieldRename[orig] = renamed;
    }
  }

  const lines = content.split('\n');
  const out   = [];

  let insideModel   = false;
  let modelName     = '';
  let hasSchemaVer  = false;
  let hasDeletedAt  = false;
  let hasMapLine    = false;

  for (let i = 0; i < lines.length; i++) {
    let line    = lines[i];
    const trimmed = line.trim();

    // ── generator / datasource keyword cleanup ───────────────────────────────
    // Fix "col_output" → "output" inside generator blocks
    if (/col_output\s*=/.test(line)) {
      line = line.replace('col_output', 'output');
    }

    // ── model start ──────────────────────────────────────────────────────────
    const modelStart = trimmed.match(/^model\s+(\w+)\s*\{$/);
    if (modelStart) {
      insideModel  = true;
      modelName    = modelStart[1];
      hasSchemaVer = false;
      hasDeletedAt = false;
      hasMapLine   = false;

      const newName = modelMap[modelName] || modelName;
      line = line.replace(/^(\s*model\s+)\w+/, `$1${newName}`);
      out.push(line);
      continue;
    }

    // ── model end ────────────────────────────────────────────────────────────
    if (insideModel && trimmed === '}') {
      // inject missing columns before closing brace
      if (!hasSchemaVer) {
        out.push('  col_schema_version Int @default(0) @map("col_schema_version")');
      }
      if (!hasDeletedAt) {
        out.push('  col_deleted_at DateTime? @map("col_deleted_at")');
      }
      // inject @@map with tbl_ prefix if missing
      if (!hasMapLine) {
        const tblName = modelMap[modelName]
          ? `tbl_${toTableName(modelName)}`
          : `tbl_${toTableName(modelName)}`;
        out.push(`  @@map("${tblName}")`);
      }
      out.push(line);
      insideModel = false;
      continue;
    }

    if (insideModel) {
      const fmap = fieldMaps[modelName] || {};

      // track existing schema_version / deleted_at
      if (/schema_version/.test(trimmed)) hasSchemaVer = true;
      if (/deleted_at/.test(trimmed))     hasDeletedAt = true;

      // ── @@map line ────────────────────────────────────────────────────────
      if (/^\s*@@map\(/.test(line)) {
        hasMapLine = true;
        // ensure tbl_ prefix on the mapped value
        line = line.replace(/@@map\("([^"]+)"\)/, (_, v) => {
          const prefixed = v.startsWith('tbl_') ? v : `tbl_${v}`;
          return `@@map("${prefixed}")`;
        });
        out.push(line);
        continue;
      }

      // ── @@index / @@unique ────────────────────────────────────────────────
      if (/^\s*@@(?:index|unique)\(/.test(line)) {
        // Replace field names inside [...] with their col_ equivalents
        line = line.replace(/\[([^\]]+)\]/, (_, inner) => {
          const fields = inner.split(',').map(f => {
            const trimF = f.trim();
            // strip any map: "..." argument to leave bare field refs
            if (trimF.startsWith('map:')) return f; // keep as-is
            return globalFieldRename[trimF] ? ` ${globalFieldRename[trimF]}` : f;
          });
          return `[${fields.join(',')}]`;
        });
        out.push(line);
        continue;
      }

      // ── @@id line ────────────────────────────────────────────────────────
      if (/^\s*@@id\(/.test(line)) {
        line = line.replace(/\[([^\]]+)\]/, (_, inner) => {
          const fields = inner.split(',').map(f => {
            const trimF = f.trim();
            return globalFieldRename[trimF] ? ` ${globalFieldRename[trimF]}` : f;
          });
          return `[${fields.join(',')}]`;
        });
        out.push(line);
        continue;
      }

      // ── field lines ───────────────────────────────────────────────────────
      const fieldMatch = line.match(/^(\s{2})(\w+)(\s+)(.+)$/);
      if (fieldMatch) {
        const [, indent, field, space, rest] = fieldMatch;

        // Skip block attribute lines
        if (field.startsWith('@@') || field.startsWith('@')) {
          out.push(line);
          continue;
        }

        // Rename scalar fields
        const newField = fmap[field] || field;

        // If field is a relation TYPE (starts with uppercase or is a model name)
        // update the referenced model name
        let newRest = rest;

        // Update relation type references: ModelName → tbl_model_names
        for (const [oldModel, newModel] of Object.entries(modelMap)) {
          // Match type references like: Company @relation...  or Company[] ...
          const typeRe = new RegExp(`\\b${oldModel}(\\[\\]|\\?)?\\b`, 'g');
          newRest = newRest.replace(typeRe, `${newModel}$1`);
        }

        // Update fields: [...] in @relation(fields: [...], ...)
        newRest = newRest.replace(/fields:\s*\[([^\]]+)\]/, (_, inner) => {
          const renamedFields = inner.split(',').map(f => {
            const trimF = f.trim();
            return globalFieldRename[trimF] ? globalFieldRename[trimF] : trimF;
          });
          return `fields: [${renamedFields.join(', ')}]`;
        });

        // Add @map() for renamed scalar fields (that don't already have one)
        const isVirtualRelation = /^\s*(tbl_\w+|\w+\[\]|\w+\?)\s/.test(rest) &&
          !rest.includes('@default') && !rest.includes('@map') &&
          !rest.includes('String') && !rest.includes('Int') &&
          !rest.includes('Boolean') && !rest.includes('Float') &&
          !rest.includes('DateTime') && !rest.includes('Json') &&
          !rest.includes('Bytes');

        // For actual scalar fields that were renamed, add @map if missing
        let finalRest = newRest;
        if (newField !== field && !isVirtualRelation && !newRest.includes('@map(')) {
          // derive DB column name from original field name
          const dbCol = `col_${toSnake(field)}`;
          // insert @map before end of line (before any trailing @@ or newline)
          finalRest = finalRest.trimEnd() + ` @map("${dbCol}")`;
        }

        out.push(`${indent}${newField}${space}${finalRest}`);
        continue;
      }

      out.push(line);
      continue;
    }

    // outside model: still rename any stray model references (enum values, etc.)
    out.push(line);
  }

  return out.join('\n');
}

// ─── outbox model ────────────────────────────────────────────────────────────

const OUTBOX_MODEL = `
// ══════════════════════════════════════════════════════════════
// TRANSACTIONAL OUTBOX — Garantía de Consistencia Eventual
// (Netflix / Google Dapper Pattern)
// ══════════════════════════════════════════════════════════════

model tbl_outbox_event {
  id                 String    @id @default(uuid()) @map("col_id")
  col_event_name     String    @map("col_event_name")
  col_payload        Json      @map("col_payload")
  col_status         String    @default("PENDING") @map("col_status")
  col_attempts       Int       @default(0) @map("col_attempts")
  col_correlation_id String    @map("col_correlation_id")
  col_created_at     DateTime  @default(now()) @map("col_created_at")
  col_processed_at   DateTime? @map("col_processed_at")
  col_schema_version Int       @default(1) @map("col_schema_version")
  col_deleted_at     DateTime? @map("col_deleted_at")

  @@index([col_status])
  @@index([col_correlation_id])
  @@map("tbl_outbox_events")
}
`;

// ─── run ─────────────────────────────────────────────────────────────────────

const original = fs.readFileSync(SRC, 'utf8');
let transformed = transform(original);

// Append outbox model if not already present
if (!transformed.includes('tbl_outbox_event')) {
  transformed += OUTBOX_MODEL;
}

fs.writeFileSync(DEST, transformed, 'utf8');
console.log(`✅  Transformed schema written to: ${DEST}`);
console.log(`    Original lines: ${original.split('\n').length}`);
console.log(`    Output lines  : ${transformed.split('\n').length}`);
