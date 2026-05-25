const fs = require('fs');
const path = require('path');

const credsPath = path.join(__dirname, '..', 'google-credentials.json');
const content = fs.readFileSync(credsPath, 'utf8');

const client_email_match = content.match(/"client_email":\s*"(.*?)"/);
const client_email = client_email_match ? client_email_match[1] : '';

// Matches private key up to the client_email key
const pk_match = content.match(/"private_key":\s*"([\s\S]*?)"\s*,\s*\r?\n\s*"client_email"/);
let private_key = '';
if (pk_match) {
  private_key = pk_match[1].replace(/\\n/g, '\n').replace(/\r?\n/g, '');
} else {
  const pk_match_simple = content.match(/"private_key":\s*"([\s\S]*?)"/);
  if (pk_match_simple) {
    private_key = pk_match_simple[1].replace(/\\n/g, '\n').replace(/\r?\n/g, '');
  }
}

console.log('Client Email:', client_email);
console.log('Private Key Start:', private_key.substring(0, 50));
console.log('Private Key End:', private_key.substring(private_key.length - 50));
console.log('Private Key Length:', private_key.length);
