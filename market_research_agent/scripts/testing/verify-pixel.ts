// import { fetch } from 'undici';

async function verify() {
    const url = "http://localhost:3000";
    const pixelId = "838233299235602";

    console.log(`Testing URL: ${url}`);
    console.log(`Looking for Pixel ID: ${pixelId}`);

    try {
        const res = await fetch(url);
        const text = await res.text();

        if (text.includes(pixelId)) {
            console.log("✅ SUCCESS: Facebook Pixel ID found in homepage HTML.");

            // Check for init code
            if (text.includes("fbq('init'")) {
                console.log("✅ SUCCESS: Facebook Pixel init code found.");
            } else if (text.includes("react-facebook-pixel")) {
                console.log("✅ SUCCESS: React Facebook Pixel usage detected.");
            } else {
                console.log("⚠️ WARNING: Pixel ID found but init code pattern might vary.");
            }

        } else {
            console.error("❌ FAILURE: Facebook Pixel ID NOT found in homepage HTML.");
            console.log("Preview of HTML head (first 500 chars):");
            console.log(text.substring(0, 500));
        }

    } catch (error) {
        console.error("❌ ERROR: Could not fetch homepage.", error);
    }
}

verify();
