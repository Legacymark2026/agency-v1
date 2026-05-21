const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = 'c:/Users/hboho/.gemini/antigravity/scratch/agency-v1/scratch/temp_schemas';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const schemas = [
  'schema.prisma',
  'schema.auth.prisma',
  'schema.core.prisma',
  'schema.media.prisma',
  'schema.analytics.prisma'
];

schemas.forEach(schema => {
  const gitPath = `ce9e6b51330481a53fa4cf2a01bab079b58be440:agency-v1/packages/database/prisma/${schema}`;
  console.log(`Extracting ${gitPath}...`);
  try {
    const buffer = execSync(`git show ${gitPath}`);
    const destPath = path.join(targetDir, schema);
    fs.writeFileSync(destPath, buffer);
    console.log(`Saved to ${destPath}`);
  } catch (err) {
    console.error(`Failed to extract ${schema}:`, err.message);
  }
});
