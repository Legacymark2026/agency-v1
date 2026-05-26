const fs = require('fs');
const content = fs.readFileSync('apps/web/components/inbox/conversation-list.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('<p') || line.includes('<span') || line.includes('className=') || line.includes('mt-')) {
    if (idx > 200 && idx < 450) { // Look specifically at the rendering part
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
