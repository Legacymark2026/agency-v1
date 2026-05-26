const fs = require('fs');
const content = fs.readFileSync('apps/web/components/inbox/conversation-list.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('<p') || line.includes('text-xs') || line.includes('mt-0.5') || line.includes('text-muted')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
