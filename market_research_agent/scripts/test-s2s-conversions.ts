import { dispatchConversion, ConversionEvent } from '../lib/services/conversions/dispatcher';
import { prisma } from '../lib/prisma';

async function runTest() {
  console.log('--- STARTING S2S CONVERSIONS TEST ---');
  
  // 1. Get first company id (or pass via args)
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("No company found in DB to test.");
    process.exit(1);
  }
  
  console.log(`Using Company: ${company.name} (${company.id})`);

  // 2. Mock a Conversion Event based on real payload structure
  const testEvent: ConversionEvent = {
    leadId: `test-lead-${Date.now()}`,
    eventName: 'Lead',
    value: 150,
    currency: 'USD',
    timestamp: Date.now(),
    userData: {
      email: 'test-s2s@example.com',
      phone: '573000000000',
      ip: '190.1.2.3',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Test/1.0',
      gclid: 'TestGclid12345',
      fbclid: 'TestFbclid12345',
      li_fat_id: 'TestLiFatId',
      ttclid: 'TestTtclid12345',
      fbp: 'fb.1.1234567890.1234567',
      fbc: 'fb.1.1234567890.TestFbclid12345'
    }
  };

  console.log('Dispatching Event Payload:', JSON.stringify(testEvent, null, 2));
  
  // 3. Dispatch conversions
  await dispatchConversion(testEvent, company.id);
  
  console.log('--- S2S CONVERSIONS TEST COMPLETED ---');
  console.log('Check the console output above to see any platform failures.');
  console.log('If no error was thrown, it means the HTTP requests were executed (but the APIs might still reject invalid testing tokens/data). Check your respective Ad Managers.');
}

runTest().catch(console.error).finally(() => process.exit(0));
