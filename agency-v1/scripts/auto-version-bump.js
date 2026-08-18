/**
 * Auto-Version Bump Script
 * Run automatically during build or git commit to keep platform version and build metadata fresh.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionFilePath = path.join(__dirname, '../apps/web/lib/version.ts');

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'release';
  }
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}-${hh}${min}`;
}

const commitHash = getGitCommit();
const now = new Date();
const buildNumber = `${formatDate(now)}-${commitHash}`;
const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} COT`;

let content = fs.readFileSync(versionFilePath, 'utf8');

// Update buildNumber and buildDate
content = content.replace(/buildNumber:\s*"[^"]*"/, `buildNumber: "${buildNumber}"`);
content = content.replace(/buildDate:\s*"[^"]*"/, `buildDate: "${formattedDate}"`);

fs.writeFileSync(versionFilePath, content, 'utf8');
console.log(`[VersionSync] Updated version metadata: ${buildNumber} (${formattedDate})`);
