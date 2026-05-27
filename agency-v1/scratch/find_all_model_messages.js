const fs = require('fs');

const transcriptPath = "C:\\Users\\hboho\\.gemini\\antigravity\\brain\\ec9b77bd-39d5-494d-8f8b-194c5f9d6cd7\\.system_generated\\logs\\transcript.jsonl";

console.log("Scanning transcript...");
try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (!line.trim()) return;
        try {
            const data = JSON.parse(line);
            if (data.source === 'MODEL' || data.type === 'PLANNER_RESPONSE') {
                const text = data.content || '';
                if (text.includes('Fase ') || text.includes('Phase ') || text.includes('Bloque ')) {
                    console.log(`\n======================================================`);
                    console.log(`STEP ${data.step_index}:`);
                    // print first 1000 characters
                    console.log(text.substring(0, 1500));
                    console.log(`======================================================\n`);
                }
            }
        } catch (err) {
            // ignore
        }
    });
} catch (e) {
    console.error("Error reading file:", e);
}
