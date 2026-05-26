const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('mt-0.5')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('mt-0.5') && (line.includes('text-xs') || line.includes('muted') || line.includes('text-slate') || line.includes('text-gray'))) {
            console.log(`Found in: ${fullPath} (Line ${idx+1})`);
            console.log(`  ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('apps/web');
