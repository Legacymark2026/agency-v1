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
      if (content.includes('text-xs') && (content.includes('ds-text-muted') || content.includes('text-muted') || content.includes('muted-foreground'))) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('text-xs') && (line.includes('ds-text-muted') || line.includes('text-muted') || line.includes('muted-foreground')) && line.includes('mt-0.5')) {
            console.log(`Found exact in: ${fullPath} (Line ${idx+1})`);
            console.log(`  ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('apps/web');
