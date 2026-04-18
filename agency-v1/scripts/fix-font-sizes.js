const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(/text-\[(8|9|10|11)px\]/g, 'text-xs');
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed: ${filePath}`);
    }
}

function walkAndFix(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walkAndFix(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    });
}

walkAndFix('.');
