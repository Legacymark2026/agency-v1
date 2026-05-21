const fs = require('fs');
const path = require('path');

const prismaDir = 'c:/Users/hboho/.gemini/antigravity/scratch/agency-v1/packages/database/prisma';

// 1. Fix schema.analytics.prisma
function fixAnalytics() {
  const filePath = path.join(prismaDir, 'schema.analytics.prisma');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('col_output = "../node_modules/@prisma/client/analytics"', 'output = "../node_modules/@prisma/client/analytics"');
  content = content.replace(/@@index\(\[createdAt\]\)/g, '@@index([col_created_at])');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed schema.analytics.prisma');
}

// 2. Fix schema.auth.prisma
function fixAuth() {
  const filePath = path.join(prismaDir, 'schema.auth.prisma');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('col_output = "../node_modules/@prisma/client/auth"', 'output = "../node_modules/@prisma/client/auth"');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed schema.auth.prisma');
}

// 3. Fix schema.core.prisma
function fixCore() {
  const filePath = path.join(prismaDir, 'schema.core.prisma');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('col_output = "../node_modules/@prisma/client/core"', 'output = "../node_modules/@prisma/client/core"');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed schema.core.prisma');
}

// 4. Fix schema.media.prisma
function fixMedia() {
  const filePath = path.join(prismaDir, 'schema.media.prisma');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('col_output = "../node_modules/@prisma/client/media"', 'output = "../node_modules/@prisma/client/media"');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed schema.media.prisma');
}

fixAnalytics();
fixAuth();
fixCore();
fixMedia();
console.log('Individual schemas fixed!');
