const fs = require('fs');
const path = require('path');

const credsPath = path.join(__dirname, '..', 'google-credentials.json');
const content = fs.readFileSync(credsPath, 'utf8');

// 1. Fix the \Vh9 escape typo
const contentFixed = content.replace(/\\Vh9/g, '\\nVh9');

// 2. Clean the private key to remove literal line breaks and ensure proper \n escaping
const cleaned = contentFixed.replace(/"private_key":\s*"([\s\S]*?)"/, (match, p1) => {
  // Remove all literal line breaks (carriage return / newline) inside the private key
  const keyOnlyEscapes = p1.replace(/[\r\n]+/g, '');
  return `"private_key": "${keyOnlyEscapes}"`;
});

// 3. Try to parse to verify it is now valid JSON
try {
  const parsed = JSON.parse(cleaned);
  console.log('✅ Success! The credentials file is now valid JSON.');
  
  // Write the clean, formatted JSON back to the file
  fs.writeFileSync(credsPath, JSON.stringify(parsed, null, 2), 'utf8');
  console.log('✅ google-credentials.json has been corrected and saved successfully!');
} catch (err) {
  console.error('❌ Failed to parse cleaned credentials:', err.message);
}
