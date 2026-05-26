const fs = require('fs');
const content = fs.readFileSync('apps/web/components/inbox/right-sidebar.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('<p') || line.includes('text-xs') || line.includes('mt-') || line.includes('muted')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
