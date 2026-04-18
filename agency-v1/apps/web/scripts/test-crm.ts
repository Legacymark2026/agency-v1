import { GET } from "../app/api/diagnostics/crm/route";

async function run() {
  console.log("🚀 Executing Standalone CRM Diagnostic Test");
  
  // Mock request object
  const req = new Request("http://localhost:3000/api/diagnostics/crm");
  
  try {
    const response = await GET(req);
    const data = await response.json();
    console.log("\n====== DIAGNOSTIC RESULTS ======");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();
