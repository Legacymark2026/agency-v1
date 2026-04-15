import { GET } from "../app/api/diagnostics/automation/route";

async function run() {
  console.log("=========================================");
  console.log("   AUTOMATION ENGINE DAG DIAGNOSTICS");
  console.log("=========================================");
  
  // Mock request object
  const req = new Request("http://localhost:3000/api/diagnostics/automation");
  
  try {
    const response = await GET(req);
    const data = await response.json();
    if (!data.success) {
      console.error("DIAGNOSTICS FAILED:", data.error);
      return;
    }
    console.log("\n==== DIAGNOSTIC FINAL LOGS ====");
    data.logs.forEach((log: string) => console.log(log));
  } catch (error) {
    console.error("Test execution crashed:", error);
  }
}

run();
