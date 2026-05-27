const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'packages', 'database', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

function extractModel(modelName) {
  const regex = new RegExp(`model ${modelName} \\{[\\s\\S]*?\\}`, 'g');
  const match = schemaContent.match(regex);
  if (match) {
    console.log(`=== ${modelName} ===`);
    console.log(match[0]);
  } else {
    console.log(`=== ${modelName} Not Found ===`);
  }
}

extractModel('Role');
extractModel('CompanyUser');
extractModel('User');
