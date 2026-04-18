import { hashData, hashPhone } from '@/lib/utils/crypto-hasher';
import { prisma } from '@/lib/prisma';
import { LTVTier } from '@/actions/audiences';

export async function syncAudiencesToPlatforms(companyId: string, ltvData: LTVTier[]) {
  // 1. Fetch Integration Configurations
  const configs = await prisma.integrationConfig.findMany({
    where: { companyId, isEnabled: true }
  });

  const configMap: Record<string, any> = {};
  configs.forEach(c => { configMap[c.provider] = c.config; });

  const promises: Promise<any>[] = [];

  // Iterate over each segment (HIGH, MEDIUM, LOW)
  for (const tierData of ltvData) {
    if (tierData.leads.length === 0) continue;

    // Hash the contacts for this tier
    const hashedAudience = tierData.leads.map(lead => ({
      email: hashData(lead.email?.toLowerCase().trim()),
      phone: hashPhone(lead.phone),
      fn: hashData(lead.name?.split(' ')[0]?.toLowerCase().trim()),
      ln: hashData(lead.name?.split(' ').slice(1).join(' ')?.toLowerCase().trim()),
      extern_id: hashData(lead.id)
    }));

    // Dispatch to Meta
    if (configMap['facebook-pixel']?.accessToken) {
      promises.push(syncToMetaCustomAudience(tierData.tier, hashedAudience, configMap['facebook-pixel']));
    }

    // Dispatch to Google Ads
    if (configMap['google-ads']?.developerToken) {
      promises.push(syncToGoogleCustomerMatch(tierData.tier, hashedAudience, configMap['google-ads']));
    }

    // Dispatch to LinkedIn
    if (configMap['linkedin-insight']?.accessToken) {
      promises.push(syncToLinkedInDMP(tierData.tier, hashedAudience, configMap['linkedin-insight']));
    }
  }

  // Await all parallel syncing jobs
  const results = await Promise.allSettled(promises);
  
  // Minimal logging
  results.forEach(res => {
    if (res.status === 'rejected') {
      console.error("[Audience Sync Error]:", res.reason);
    }
  });

  return results;
}

import { RFMTier } from "@/actions/rfm";

export async function syncRFMToPlatforms(companyId: string, rfmData: RFMTier[]) {
  const configs = await prisma.integrationConfig.findMany({
    where: { companyId, isEnabled: true }
  });

  const configMap: Record<string, any> = {};
  configs.forEach(c => { configMap[c.provider] = c.config; });
  const promises: Promise<any>[] = [];

  for (const tierData of rfmData) {
    if (tierData.leads.length === 0) continue;

    const hashedAudience = tierData.leads.map((lead: any) => ({
      email: hashData(lead.email?.toLowerCase().trim()),
      phone: hashPhone(lead.phone),
      fn: hashData(lead.name?.split(' ')[0]?.toLowerCase().trim()),
      ln: hashData(lead.name?.split(' ').slice(1).join(' ')?.toLowerCase().trim()),
      extern_id: hashData(lead.id)
    }));

    if (configMap['facebook-pixel']?.accessToken) {
      promises.push(syncToMetaCustomAudience(`RFM ${tierData.segment}`, hashedAudience, configMap['facebook-pixel']));
    }
    if (configMap['google-ads']?.developerToken) {
      promises.push(syncToGoogleCustomerMatch(`RFM ${tierData.segment}`, hashedAudience, configMap['google-ads']));
    }
    if (configMap['linkedin-insight']?.accessToken) {
      promises.push(syncToLinkedInDMP(`RFM ${tierData.segment}`, hashedAudience, configMap['linkedin-insight']));
    }
  }

  return await Promise.allSettled(promises);
}

// --- Platform Specific Subroutines ---

async function syncToMetaCustomAudience(tier: string, hashedAudience: any[], config: any) {
  const BATCH_SIZE = 10000;
  // This is a placeholder for the actual Meta Graph API Custom Audience push.
  // In production, you would GET /act_{ad_account_id}/customaudiences to find the ID
  // mapping to "LegacyMark - LTV {tier}", or POST to create it if it doesn't exist.
  // Then POST to /{custom_audience_id}/users with the schema schema: `['EMAIL', 'PHONE', 'FN', 'LN', 'EXTERN_ID']`.

  const payload = {
    payload: {
      schema: ['EMAIL', 'PHONE', 'FN', 'LN', 'EXTERN_ID'],
      data: hashedAudience.map(u => [u.email, u.phone, u.fn, u.ln, u.extern_id])
    }
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Meta Custom Audience Sync] Tier: ${tier} | Count: ${hashedAudience.length}`);
    return Promise.resolve({ success: true, platform: 'Meta', tier, count: hashedAudience.length });
  }

  // Real execution would be:
  // return fetch(`https://graph.facebook.com/v19.0/${audienceId}/users`, { ... })
  return Promise.resolve({ success: true, platform: 'Meta', tier, payloadSample: payload.payload.data[0] });
}

async function syncToGoogleCustomerMatch(tier: string, hashedAudience: any[], config: any) {
  // Google requires userLists.mutate Endpoint targeting Customer Match.
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Google Customer Match Sync] Tier: ${tier} | Count: ${hashedAudience.length}`);
  }
  return Promise.resolve({ success: true, platform: 'GoogleAds', tier, count: hashedAudience.length });
}

async function syncToLinkedInDMP(tier: string, hashedAudience: any[], config: any) {
  // LinkedIn requires pushing to a DMP Segment.
  if (process.env.NODE_ENV === 'development') {
    console.log(`[LinkedIn DMP Sync] Tier: ${tier} | Count: ${hashedAudience.length}`);
  }
  return Promise.resolve({ success: true, platform: 'LinkedIn', tier, count: hashedAudience.length });
}
