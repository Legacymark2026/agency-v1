import { processLTVClusters } from '../lib/services/ml/ltv-cluster';
import { prisma } from '../lib/prisma';

async function run() {
  console.log("--- STARTING LTV CLUSTER TEST ---");
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found.");
    process.exit(0);
  }

  await processLTVClusters(company.id);
  console.log("--- TEST COMPLETE ---");
}

run().catch(console.error).finally(() => process.exit(0));
