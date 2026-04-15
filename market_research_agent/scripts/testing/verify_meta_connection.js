
const https = require('https');
require('dotenv').config({ path: '.env' });

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET) {
    console.error('❌ Missing FACEBOOK_CLIENT_ID or FACEBOOK_CLIENT_SECRET in .env');
    process.exit(1);
}

console.log(`🔍 Testing Credentials for App ID: ${FACEBOOK_CLIENT_ID}`);

const url = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&grant_type=client_credentials`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);

            if (res.statusCode === 200 && json.access_token) {
                console.log('✅ SUCCESS: App Credentials are VALID!');
                console.log(`🔑 App Access Token received: ${json.access_token.substring(0, 10)}... (masked)`);
                console.log('📝 Next Step: Try connecting via the Dashboard UI.');
            } else {
                console.error('❌ FAILED: Invalid Credentials or API Error');
                console.error(JSON.stringify(json, null, 2));

                if (json.error && json.error.message) {
                    console.log(`\n💡 Hint: ${json.error.message}`);
                }
            }
        } catch (e) {
            console.error('❌ Error parsing response:', e.message);
        }
    });

}).on('error', (err) => {
    console.error('❌ Network Error:', err.message);
});
