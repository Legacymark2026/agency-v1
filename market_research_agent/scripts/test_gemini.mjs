const apiKey = "AIzaSyCp_8cZ0fZ3xUbM3Kf-tt5hdmrTiSYaYVA";

async function testGemini() {
    console.log("Testing Gemini API with gemini-2.0-flash-lite...\n");
    
    const body = {
        contents: [
            { role: "user", parts: [{ text: "Responde con 3 palabras solamente: el agente funciona" }] }
        ],
        generationConfig: { maxOutputTokens: 50 }
    };

    // Test 1: non-streaming
    console.log("Test 1: gemini-2.0-flash-lite generateContent (non-streaming)...");
    const r1 = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    console.log(`  Status: ${r1.status}`);
    const t1 = await r1.text();
    console.log(`  Response: ${t1.slice(0, 500)}\n`);

    // Test 2: streaming SSE
    console.log("Test 2: gemini-2.0-flash-lite streamGenerateContent (SSE)...");
    const r2 = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    console.log(`  Status: ${r2.status}`);
    const reader = r2.body.getReader();
    const dec = new TextDecoder();
    let out = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
    }
    console.log(`  Stream response (first 600 chars): ${out.slice(0, 600)}\n`);
}

testGemini().catch(console.error);
