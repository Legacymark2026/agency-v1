/**
 * fix_references_and_plurals.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Two targeted fixes on packages/database/prisma/schema.prisma:
 *
 *  1. The primary-key field `id` was renamed to `col_id` by the transform
 *     script, but Prisma relation `references: [id]` still points to `id`.
 *     Fix: revert `col_id` back to `id` on @id lines, and update every
 *     `references: [col_id]` back to `references: [id]`.
 *
 *  2. Naive plural (+s) produces `tbl_companys`, `tbl_post_seriess`, etc.
 *     Fix: apply a proper irregular-plural map for the model names in this schema.
 */

const fs = require('fs');
const DEST = 'c:/Users/hboho/.gemini/antigravity/scratch/agency-v1/packages/database/prisma/schema.prisma';

let content = fs.readFileSync(DEST, 'utf8');
const lines  = content.split('\n');

// ── 1. Irregular plural corrections ────────────────────────────────────────
// Map wrong tbl_ names → correct tbl_ names (wrong pluralisation or casing)
const PLURAL_FIXES = {
  'tbl_companys':                   'tbl_companies',
  'tbl_categorys':                  'tbl_categories',
  'tbl_industrys':                  'tbl_industries',
  'tbl_subsidiarys':                'tbl_subsidiaries',
  'tbl_propertys':                  'tbl_properties',
  'tbl_activitys':                  'tbl_activities',
  'tbl_librarys':                   'tbl_libraries',
  'tbl_deliverys':                  'tbl_deliveries',
  'tbl_discoverys':                 'tbl_discoveries',
  'tbl_post_seriess':               'tbl_post_series',
  'tbl_seriess':                    'tbl_series',
  'tbl_statuss':                    'tbl_statuses',
  'tbl_indexs':                     'tbl_indexes',
  'tbl_addresss':                   'tbl_addresses',
  'tbl_businesss':                  'tbl_businesses',
  'tbl_processs':                   'tbl_processes',
  'tbl_accesss':                    'tbl_accesses',
  'tbl_custom_object_definition':   'tbl_custom_object_definitions',
};

// Apply plural fixes everywhere in the file (model names and references)
for (const [wrong, correct] of Object.entries(PLURAL_FIXES)) {
  // Use regex with word boundary to avoid partial matches
  const re = new RegExp(wrong.replace(/_/g, '_'), 'g');
  content = content.replace(re, correct);
}

// ── 2. Revert col_id → id for primary key fields and references ─────────────
// Lines like: "  col_id  String  @id @default(uuid())"
// Revert: col_id → id
const fixedLines = content.split('\n').map(line => {
  // Fix PK field declarations
  if (/^\s+col_id\s+\S+\s+.*@id/.test(line)) {
    line = line.replace(/col_id(\s)/, 'id$1');
  }
  // Fix references: [col_id] → references: [id]
  if (/references:\s*\[col_id\]/.test(line)) {
    line = line.replace(/references:\s*\[col_id\]/, 'references: [id]');
  }
  // Fix @@id([col_id ...]) → @@id([id ...])  for composite PKs where id is involved
  if (/@@id\(.*col_id/.test(line)) {
    line = line.replace(/col_id/g, 'id');
  }
  return line;
});

content = fixedLines.join('\n');
fs.writeFileSync(DEST, content, 'utf8');
console.log('✅  Plural fixes + id reference fixes applied');
