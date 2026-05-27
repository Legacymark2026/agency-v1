import json
import re

transcript_path = r"C:\Users\hboho\.gemini\antigravity\brain\ec9b77bd-39d5-494d-8f8b-194c5f9d6cd7\.system_generated\logs\transcript.jsonl"

print("Scanning transcript for phases...")
with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("source") == "MODEL" or data.get("type") == "PLANNER_RESPONSE":
                content = data.get("content", "")
                if not content:
                    continue
                # Search for mentions of Phase, Fase, or list of services
                if re.search(r"(fase|phase|workload|separaci|bloque)", content, re.IGNORECASE):
                    # print step index and a snippet of content
                    print(f"\n--- STEP {data.get('step_index')} ({data.get('type')}) ---")
                    # print first 500 chars or lines that contain the match
                    for l in content.split("\n"):
                        if re.search(r"(fase|phase|workload|separaci|bloque|crm|finance|inbox|chat|leads)", l, re.IGNORECASE):
                            print(f"  {l[:120]}")
        except Exception as e:
            pass
