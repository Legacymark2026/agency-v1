import { getAnalyticsOverview } from "../apps/web/modules/analytics/actions/analytics";

async function main() {
  console.log("Calling getAnalyticsOverview...");
  try {
    const result = await getAnalyticsOverview(30);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("Failed to run getAnalyticsOverview:", error.message || error);
  }
}

main();
