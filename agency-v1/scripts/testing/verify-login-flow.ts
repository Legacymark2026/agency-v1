
import { loadEnvConfig } from '@next/env';
// Try to load env if possible, though local server already running
// loadEnvConfig(process.cwd()); 

const BASE_URL = 'http://localhost:3000';

async function main() {
    console.log("1. Fetching CSRF Token...");
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    if (!csrfRes.ok) {
        console.error("Failed to fetch CSRF token");
        return;
    }
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const csrfCookie = csrfRes.headers.get('set-cookie');

    console.log(`   CSRF Token: ${csrfToken?.substring(0, 10)}...`);

    console.log("2. Attempting Login (POST /api/auth/callback/credentials)...");
    const params = new URLSearchParams();
    params.append('csrfToken', csrfToken);
    params.append('email', 'enriquebohorque02@gmail.com');
    params.append('password', 'Rebyeh2620..');

    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': csrfCookie || ''
        },
        body: params,
        redirect: 'manual'
    });

    console.log(`   Login Response Status: ${loginRes.status}`);
    const setCookie = loginRes.headers.get('set-cookie');

    // In many NextAuth setups, a successful login redirects (302) AND sets the session cookie.
    if (!setCookie || !setCookie.includes('authjs.session-token') && !setCookie.includes('next-auth.session-token')) {
        console.log("   ⚠️ No obvious session token in Set-Cookie. Response headers:");
        // console.log(loginRes.headers);
    } else {
        console.log("   ✅ Session Token Cookie received.");
    }

    // Combine cookies
    const allCookies = [csrfCookie, setCookie].filter(Boolean).join('; ');

    console.log("3. Accessing Protected Route (/dashboard)...");
    const dbRes = await fetch(`${BASE_URL}/dashboard`, {
        headers: {
            'Cookie': allCookies
        },
        redirect: 'manual'
    });

    console.log(`   Dashboard Response Status: ${dbRes.status}`);

    if (dbRes.status === 200) {
        console.log("✅ SUCCESS: Authenticated access to /dashboard granted.");
    } else if (dbRes.status === 307 || dbRes.status === 302) {
        const location = dbRes.headers.get('location');
        console.error(`❌ FAILED: Redirected to ${location}`);
        if (location?.includes('/auth/login')) {
            console.error("   Reason: Session not recognized or rejected.");
        }
    } else {
        console.error(`❌ FAILED: Unexpected status ${dbRes.status}`);
    }
}

main().catch(console.error);
