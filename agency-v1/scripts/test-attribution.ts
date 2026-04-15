import { calculateAttribution } from '../lib/services/ml/attribution';
import { prisma } from '../lib/prisma';

async function runTest() {
  console.log('--- STARTING MULTI-TOUCH ATTRIBUTION TEST (MARKOV CHAINS) ---');
  
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("No company found.");
    process.exit(1);
  }
  
  await calculateAttribution(company.id);
  
  console.log('--- TEST COMPLETED ---');
}

runTest().catch(console.error).finally(() => process.exit(0));
