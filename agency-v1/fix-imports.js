const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('apps/web/app/(dashboard)/dashboard');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace ../../.../components/ with @/components/
  content = content.replace(/(['"])(?:\.\.\/)+components\//g, '@/components/');
  content = content.replace(/(['"])(?:\.\.\/)+hooks\//g, '@/hooks/');
  content = content.replace(/(['"])(?:\.\.\/)+actions\//g, '@/actions/');
  content = content.replace(/(['"])(?:\.\.\/)+lib\//g, '@/lib/');
  content = content.replace(/(['"])(?:\.\.\/)+stores\//g, '@/stores/');
  content = content.replace(/(['"])(?:\.\.\/)+types\//g, '@/types/');
  content = content.replace(/(['"])(?:\.\.\/)+config\//g, '@/config/');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});

console.log('Fixed imports in ' + count + ' files.');
