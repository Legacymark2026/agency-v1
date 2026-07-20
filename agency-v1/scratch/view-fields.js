const fs = require('fs');
const path = require('path');
const schemaPath = path.join(__dirname, '../apps/coffee-web/prisma/schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf8');

function printModel(modelName) {
  const regex = new RegExp(`model\\s+${modelName}\\s+\\{([^}]*)\\}`, 'g');
  const match = regex.exec(content);
  if (match) {
    console.log(`Fields for ${modelName}:`);
    console.log(match[1].trim().split('\n').map(l => '  ' + l.trim()).join('\n'));
  } else {
    console.log(`Model ${modelName} not found.`);
  }
}

printModel('Deal');
printModel('Invoice');
