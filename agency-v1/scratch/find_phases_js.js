const fs = require('fs');

const transcriptPath = "C:\\Users\\hboho\\.gemini\\antigravity\\brain\\ec9b77bd-39d5-494d-8f8b-194c5f9d6cd7\\.system_generated\\logs\\transcript.jsonl";

console.log("Scanning transcript for early MODEL content describing phases...");
try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (!line.trim()) return;
        try {
            const data = JSON.parse(line);
            if (data.source === 'MODEL' && data.step_index < 20) {
                console.log(`\n======================================================`);
                console.log(`STEP ${data.step_index}:`);
                console.log(data.content);
                console.log(`======================================================\n`);
            }
        } catch (err) {
            // ignore
        }
    });
} catch (e) {
    console.error("Error reading file:", e);
}
