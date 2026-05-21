// fix_generator_blocks.js
// Scans all *.prisma files under the repo and ensures the generator block has
// provider, output, and previewFeatures (postgresqlExtensions).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // repo root (scratch/agency-v1)

function fixGenerator(content, relPath) {
  // Detect generator block (first occurrence)
  const lines = content.split(/\r?\n/);
  let inGen = false;
  let genStart = -1;
  let genEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!inGen && lines[i].trim().startsWith('generator')) {
      inGen = true;
      genStart = i;
    }
    if (inGen && lines[i].includes('}')) {
      genEnd = i;
      break;
    }
  }
  if (genStart === -1 || genEnd === -1) return content; // no generator found

  // Determine service name from file location
  // e.g., packages/database/prisma/schema.core.prisma -> core
  const match = relPath.match(/schema\.(\w+)\.prisma$/);
  const service = match ? match[1] : 'core';

  const newBlock = [
    'generator client {',
    '  provider = "prisma-client-js"',
    `  output   = "../node_modules/@prisma/client/${service}"`,
    '  previewFeatures = ["postgresqlExtensions"]',
    '}'
  ];

  const before = lines.slice(0, genStart);
  const after = lines.slice(genEnd + 1);
  return [...before, ...newBlock, ...after].join('\n');
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules to avoid heavy recursion
      if (entry.name === 'node_modules') continue;
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.prisma')) {
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      const original = fs.readFileSync(full, 'utf8');
      const fixed = fixGenerator(original, rel);
      if (fixed !== original) {
        fs.writeFileSync(full, fixed, 'utf8');
        console.log(`Fixed generator in ${rel}`);
      }
    }
  }
}

walk(ROOT);
console.log('All generator blocks fixed.');
