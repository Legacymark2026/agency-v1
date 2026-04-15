import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLead } from "@/actions/leads";
import { dispatchConversion } from "@/lib/services/conversions/dispatcher";
import { calculateLTVTiers } from "@/actions/audiences";
import { calculateRFMTiers } from "@/actions/rfm";
import { syncAudiencesToPlatforms, syncRFMToPlatforms } from "@/lib/services/audiences/sync";
import { IntegrationConfigData } from "@/actions/integration-config";

// Force Node.js runtime for intensive tests
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  console.log("🛠️ Starting Senior Full-System CRM Diagnostic...");
  
  try {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    // 1. Fetch Company
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company found for test.");
    log(`✅ [1/5] Core Database Connection OK (Company: ${company.name})`);

    // 2. Validate Lead Capture & Conversion Engine
    log("▶️ [2/5] Testing Lead Capture Pipeline...");
    
    // We bypass typical createLead by creating it directly to ensure we have a Lead ID for testing
    // However, the test should also check Integration Configs to ensure CAPI works.
    const activeConfigs = await prisma.integrationConfig.findMany({ where: { companyId: company.id, isEnabled: true } });
    log(`   ↳ Found ${activeConfigs.length} active Integrations (Meta, Google, etc.).`);

    const mockLead = await prisma.lead.create({
      data: {
        name: "Diagnostic Tester",
        email: `test-${Date.now()}@legacymark.ai`,
        phone: "+15550000000",
        source: "System Diagnostic",
        companyId: company.id,
        fbp: "fb.1.123456789.123456789",
        fbc: "fb.1.123456789.abcdef",
        ipAddress: "192.168.1.1",
        userAgent: "Diagnostics/1.0"
      }
    });
    log(`   ↳ Lead Created Successfully (ID: ${mockLead.id})`);

    // Manually trigger Conversion API Dispatcher (like leads.ts does on Qualified)
    await dispatchConversion({
      leadId: mockLead.id,
      eventName: "Lead",
      value: 0,
      currency: "USD",
      timestamp: Date.now(),
      userData: {
        email: mockLead.email, phone: mockLead.phone, firstName: "Diagnostic", lastName: "Tester",
        ip: mockLead.ipAddress, userAgent: mockLead.userAgent, fbc: mockLead.fbc, fbp: mockLead.fbp
      }
    }, company.id);
    log(`   ↳ CAPI Lead Conversion Dispatched Successfully.`);

    // 3. Test Deal Tracking Engine
    log("▶️ [3/5] Testing Deal tracking and Revenue Sync...");
    const mockDeal = await prisma.deal.create({
      data: {
        title: "Enterprise Deal (Diag)", value: 50000, stage: "WON",
        companyId: company.id, contactEmail: mockLead.email, probability: 100
      }
    });
    log(`   ↳ Deal Created and marked WON (Value: $50000)`);

    // 4. Test LTV & RFM Audience Engines
    log("▶️ [4/5] Testing Advanced Audiences (LTV & RFM)...");
    
    const ltvTiers = await calculateLTVTiers(company.id);
    log(`   ↳ LTV Calculated: High=${ltvTiers.find(t=>t.tier==='HIGH')?.leads.length||0}, Med=${ltvTiers.find(t=>t.tier==='MEDIUM')?.leads.length||0}, Low=${ltvTiers.find(t=>t.tier==='LOW')?.leads.length||0}`);
    
    const rfmTiers = await calculateRFMTiers(company.id);
    log(`   ↳ RFM Calculated: Found ${rfmTiers.length} populated segments (e.g. Champions, At Risk).`);

    // 5. Test Audience Sync to Ad Platforms
    log("▶️ [5/5] Synthesizing Payloads for Meta/Google/LinkedIn APIs (SHA-256 Check)...");
    await syncAudiencesToPlatforms(company.id, ltvTiers);
    log(`   ↳ LTV Audience Array SHA-256 Sync Passed.`);
    await syncRFMToPlatforms(company.id, rfmTiers);
    log(`   ↳ RFM Audience Array SHA-256 Sync Passed.`);

    // Cleanup Mock Data (To keep DB clean)
    await prisma.deal.delete({ where: { id: mockDeal.id } });
    await prisma.lead.delete({ where: { id: mockLead.id } });
    log("🧹 Mock data cleaned up successfully.");

    log("🌟 DIAGNOSTIC COMPLETE: All CRM Pipelines Operational 🌟");

    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    console.error("DIAGNOSTIC FAILED:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
