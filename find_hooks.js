const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
                results = results.concat(walk(fullPath));
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'agency-v1/apps/web'));
console.log(`Scanning ${files.length} files...`);

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('use')) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Match hooks: useState, useEffect, etc. (words starting with 'use' followed by uppercase letter)
        const hookMatch = line.match(/\b(use[A-Z][a-zA-Z0-9_]*)\(/);
        if (hookMatch) {
            const hookName = hookMatch[1];
            // Simple heuristic: if the hook is on a line that contains 'if', 'for', 'while', '&&', '?', etc.
            // or if we can see conditional keywords nearby.
            const isConditional = line.includes('if ') || line.includes('if(') || line.includes('&&') || line.includes('?') || line.includes('map(');
            if (isConditional) {
                console.log(`Potential issue in ${path.relative(__dirname, file)} line ${i+1}:`);
                console.log(`  ${line.trim()}`);
            }
        }
    }
}
console.log('Scan complete.');
