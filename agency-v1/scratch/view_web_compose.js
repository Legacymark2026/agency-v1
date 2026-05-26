const fs = require('fs');
const content = fs.readFileSync('docker-compose.yml', 'utf8');
const lines = content.split('\n');
let start = -1;
let end = -1;
lines.forEach((line, idx) => {
  if (line.trim() === 'web:') {
    start = idx;
  }
  if (start !== -1 && idx > start) {
    if (line.search(/\S/) <= 2 && line.trim().length > 0 && !line.trim().startsWith('#')) {
      if (end === -1) end = idx;
    }
  }
});
if (start !== -1) {
  for (let i = start; i < (end === -1 ? lines.length : end); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
