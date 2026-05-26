const fs = require('fs');
const content = fs.readFileSync('docker-compose.yml', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('PathPrefix')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
