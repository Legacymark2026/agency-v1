const fs = require('fs');

const transcriptPath = "C:\\Users\\hboho\\.gemini\\antigravity\\brain\\ec9b77bd-39d5-494d-8f8b-194c5f9d6cd7\\.system_generated\\logs\\transcript.jsonl";

console.log("Scanning transcript for implementation_plan.md writes...");
try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (!line.trim()) return;
        try {
            const data = JSON.parse(line);
            const toolCalls = data.tool_calls || [];
            toolCalls.forEach(tc => {
                if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
                    const args = tc.args || {};
                    const targetFile = args.TargetFile || '';
                    if (targetFile.includes('implementation_plan.md')) {
                        console.log(`\n--- STEP ${data.step_index} (${data.type}) wrote implementation_plan.md ---`);
                        const code = args.CodeContent || args.ReplacementContent || '';
                        // print the title and first few lines of changes
                        const codeLines = code.split('\n');
                        console.log(codeLines.slice(0, 10).join('\n'));
                    }
                }
            });
        } catch (err) {
            // ignore
        }
    });
} catch (e) {
    console.error("Error reading file:", e);
}
