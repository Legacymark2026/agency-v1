const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const credsPath = path.join(__dirname, '..', 'google-credentials.json');
const content = fs.readFileSync(credsPath, 'utf8');

// Replace the invalid escape \V with \nV
const contentWithFix = content.replace(/\\Vh9/g, '\\nVh9');

// Now parse
const cleanedContent = contentWithFix.replace(/"private_key":\s*"([\s\S]*?)"/, (match, p1) => {
  const cleanedKey = p1.replace(/[\r\n]+/g, ''); // Remove literal newlines
  return `"private_key": "${cleanedKey}"`;
});

try {
  const creds = JSON.parse(cleanedContent);
  console.log('✅ JSON.parse Success!');
  
  // Format the key properly for OpenSSL
  const privateKey = creds.private_key.replace(/\\n/g, '\n');
  
  try {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update('test');
    const signature = signer.sign(privateKey);
    console.log('✅ Signing Success! The private key is valid!');
  } catch (err) {
    console.log('❌ Signing Failed:', err.message);
  }
} catch (err) {
  console.log('❌ JSON.parse Failed:', err.message);
}
