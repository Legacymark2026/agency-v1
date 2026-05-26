const fs = require('fs');
const content = fs.readFileSync('docker-compose.yml', 'utf8');
const lines = content.split('\n');
for (let i = 250; i < 451; i++) {
  if (i < lines.length) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
