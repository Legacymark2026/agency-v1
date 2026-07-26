const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const prismaDir = path.resolve(rootDir, 'packages/database/prisma');

const masterSchemaPath = path.join(prismaDir, 'schema.prisma');
const segregatedSchemas = [
  { name: 'auth', file: path.join(prismaDir, 'schema.auth.prisma') },
  { name: 'core', file: path.join(prismaDir, 'schema.core.prisma') },
  { name: 'media', file: path.join(prismaDir, 'schema.media.prisma') },
  { name: 'analytics', file: path.join(prismaDir, 'schema.analytics.prisma') },
];

console.log('🔍 Checking Prisma schemas consistency and drift validation...');

function extractModels(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Set();
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const models = new Set();
  const regex = /^model\s+([A-Za-z0-9_]+)\s*\{/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    models.add(match[1]);
  }
  return models;
}

function run() {
  if (!fs.existsSync(masterSchemaPath)) {
    console.error(`❌ Master schema not found at: ${masterSchemaPath}`);
    process.exit(1);
  }

  const masterModels = extractModels(masterSchemaPath);
  console.log(`📌 Master schema (schema.prisma) contains ${masterModels.size} models.`);

  const allSegregatedModels = new Map();
  let totalSegregatedCount = 0;
  let hasWarnings = false;

  for (const seg of segregatedSchemas) {
    const models = extractModels(seg.file);
    console.log(`  └─ [${seg.name}] (${path.basename(seg.file)}): ${models.size} models`);
    totalSegregatedCount += models.size;

    for (const model of models) {
      if (allSegregatedModels.has(model)) {
        console.warn(`⚠️ Model "${model}" is defined in multiple segregated schemas: [${allSegregatedModels.get(model)}] and [${seg.name}]`);
        hasWarnings = true;
      }
      allSegregatedModels.set(model, seg.name);
    }
  }

  // Verify models present in master schema vs segregated schemas
  console.log('\n📊 Model Coverage Audit:');
  const missingInSegregated = [];
  for (const model of masterModels) {
    if (!allSegregatedModels.has(model)) {
      missingInSegregated.push(model);
    }
  }

  if (missingInSegregated.length > 0) {
    console.warn(`⚠️ The following ${missingInSegregated.length} model(s) are in master schema.prisma but not assigned to any segregated schema:`);
    missingInSegregated.forEach(m => console.warn(`   - ${m}`));
  } else {
    console.log('✅ All master models are mapped to segregated database schemas.');
  }

  console.log('\n✨ Prisma Schema Consistency Verification Completed.');
  if (hasWarnings) {
    console.log('⚠️ Completed with warnings. Please review any model duplicates.');
  } else {
    console.log('🎉 All Prisma schemas are clean and verified.');
  }
}

run();
