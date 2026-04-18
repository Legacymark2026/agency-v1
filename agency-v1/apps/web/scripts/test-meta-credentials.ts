async function testCredentials() {
    const appId = "716753194854147";
    const appSecret = "25de04314905d8b123413037c695c2c9";
    
    console.log("Testing Meta App Credentials...");
    try {
        const url = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.error) {
            console.log("❌ CREDENTIALS ERROR:");
            console.log(data.error);
        } else {
            console.log("✅ Credentials are VALID!");
            console.log("App Access Token acquired:", (data.access_token as string).substring(0, 15) + "...");
        }
    } catch (e: any) {
        console.log("Request failed:", e.message);
    }
}
testCredentials();
