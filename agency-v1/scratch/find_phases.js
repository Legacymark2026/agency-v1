const fs = require('fs');

const transcriptPath = "C:\\Users\\hboho\\.gemini\\antigravity\\brain\\ec9b77bd-39d5-494d-8f8b-194c5f9d6cd7\\.system_generated\\logs\\transcript.jsonl";

console.log("Scanning early steps for full phase plan...");
try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (!line.trim()) return;
        try {
            const data = JSON.parse(line);
            if (data.step_index < 200) {
                if (data.source === 'MODEL' || data.type === 'PLANNER_RESPONSE') {
                    const text = data.content || '';
                    if (/fase\s*\d|phase\s*\d|roadmap|plan/i.test(text)) {
                        console.log(`\n--- STEP ${data.step_index} (${data.type}) ---`);
                        const textLines = text.split('\n');
                        textLines.forEach(l => {
                            if (/fase|phase|roadmap|plan|workload|separaci/i.test(l)) {
                                console.log(`  ${l.substring(0, 150).trim()}`);
                            }
                        });
                    }
                }
            }
        } catch (err) {
            // ignore
        }
    });
} catch (e) {
    console.error("Error reading file:", e);
}
