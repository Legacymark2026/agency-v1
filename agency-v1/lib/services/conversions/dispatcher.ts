import { hashData, hashPhone } from '@/lib/utils/crypto-hasher';
import { prisma } from '@/lib/prisma';
import { IntegrationConfigData } from '@/actions/integration-config';

export interface ConversionEvent {
  leadId: string;
  eventName: string; // e.g., 'Lead', 'Qualified', 'Purchase'
  value: number;
  currency: string;
  timestamp: number; // in milliseconds
  userData: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    gclid?: string | null;
    fbclid?: string | null;
    li_fat_id?: string | null;
    ttclid?: string | null;
    fbc?: string | null;
    fbp?: string | null;
  };
}

/**
 * Dispatcher orchestration that calls all 4 configured Ad Platform Conversion APIs 
 * concurrently avoiding request delays. Fetch configs locally from the DB to avoid duplicated env vars.
 */
export async function dispatchConversion(event: ConversionEvent, companyId: string) {
  // Fetch active integrations
  const configs = await prisma.integrationConfig.findMany({
      where: { companyId, isEnabled: true }
  });
  
  const configMap: Record<string, IntegrationConfigData> = {};
  configs.forEach(c => { configMap[c.provider] = c.config as unknown as IntegrationConfigData; });

  const hashedData = {
    email: hashData(event.userData.email?.toLowerCase().trim()),
    phone: hashPhone(event.userData.phone),
    firstName: hashData(event.userData.firstName?.toLowerCase().trim()),
    lastName: hashData(event.userData.lastName?.toLowerCase().trim()),
    externalId: hashData(event.leadId), // Used for strict deduplication
    ip: event.userData.ip || null,
    userAgent: event.userData.userAgent || null
  };

  try {
    const results = await Promise.allSettled([
      sendToMetaCAPI(event, hashedData, configMap['facebook-pixel']),
      sendToGoogleEnhancedConversions(event, hashedData, configMap['google-ads']),
      sendToLinkedInCAPI(event, hashedData, configMap['linkedin-insight']),
      sendToTikTokEventsAPI(event, hashedData, configMap['tiktok-pixel'])
    ]);
    
    // Log success or failures in background for monitoring
    results.forEach((res, index) => {
      const platforms = ['Meta', 'Google', 'LinkedIn', 'TikTok'];
      if (res.status === 'rejected') {
        console.error(`❌ S2S Dispatch Error on Platform ${platforms[index]}:`, res.reason);
      } else {
        // Success
        console.log(`✅ [${platforms[index]} CAPI] S2S Event "${event.eventName}" dispatched successfully!`);
      }
    });
  } catch (error) {
    console.error("Critical S2S Dispatch Orchestrator Error", error);
  }
}

// ==========================================
// 1. META CONVERSIONS API (CAPI)
// ==========================================
async function sendToMetaCAPI(event: ConversionEvent, hashedData: any, config?: IntegrationConfigData) {
  if (!config?.capiToken || !config?.pixelId) return;

  const fbcValue = event.userData.fbclid ? `fb.1.${Date.now()}.${event.userData.fbclid}` : (event.userData.fbc || undefined);

  const payload = {
    data: [{
      event_name: event.eventName,
      event_time: Math.floor(event.timestamp / 1000), // Seconds
      action_source: "system_generated",
      user_data: {
        em: hashedData.email ? [hashedData.email] : undefined,
        ph: hashedData.phone ? [hashedData.phone] : undefined,
        fn: hashedData.firstName ? [hashedData.firstName] : undefined,
        ln: hashedData.lastName ? [hashedData.lastName] : undefined,
        external_id: hashedData.externalId ? [hashedData.externalId] : undefined,
        client_ip_address: hashedData.ip,
        client_user_agent: hashedData.userAgent,
        fbc: fbcValue,
        fbp: event.userData.fbp || undefined,
      },
      custom_data: {
        currency: event.currency,
        value: event.value,
      },
      // Deduplication identifier is mandatory
      event_id: `${event.leadId}_${event.eventName}`
    }]
  };

  const response = await fetch(`https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${config.capiToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
     const error = await response.text();
     throw new Error(`Meta CAPI Failed: ${error}`);
  }
}

// ==========================================
// 2. GOOGLE ADS ENHANCED CONVERSIONS
// ==========================================
async function sendToGoogleEnhancedConversions(event: ConversionEvent, hashedData: any, config?: IntegrationConfigData) {
  // Requires developer token and valid GCLID
  if (!config?.googleAdsDeveloperToken || !config?.googleAdsManagerId || !config?.googleAdsAccessToken || !event.userData.gclid) return;

  const userIdentifiers = [];
  if (hashedData.email) userIdentifiers.push({ hashedEmail: hashedData.email });
  if (hashedData.phone) userIdentifiers.push({ hashedPhoneNumber: hashedData.phone });
  if (hashedData.firstName) userIdentifiers.push({ hashedFirstName: hashedData.firstName });
  if (hashedData.lastName) userIdentifiers.push({ hashedLastName: hashedData.lastName });

  if (userIdentifiers.length === 0) return; // Google requires at least one PII or strictly the GCLID setup

  const payload = {
    conversions: [{
      gclid: event.userData.gclid,
      conversionAction: `customers/${config.googleAdsCustomerId}/conversionActions/${config.googleAdsConversionActionId}`,
      // Time format MUST be "yyyy-mm-dd hh:mm:ss+|-hh:mm"
      conversionDateTime: new Date(event.timestamp).toISOString().replace('T', ' ').substring(0, 19) + '-05:00',
      conversionValue: event.value,
      currencyCode: event.currency,
      userIdentifiers: userIdentifiers
    }],
    partialFailure: true
  };

  const response = await fetch(`https://googleads.googleapis.com/v14/customers/${config.googleAdsCustomerId}:uploadClickConversions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.googleAdsAccessToken}`,
      'developer-token': config.googleAdsDeveloperToken,
      'login-customer-id': config.googleAdsManagerId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
     const error = await response.text();
     throw new Error(`Google Enhanced Conversions Failed: ${error}`);
  }
}

// ==========================================
// 3. LINKEDIN CONVERSIONS API
// ==========================================
async function sendToLinkedInCAPI(event: ConversionEvent, hashedData: any, config?: IntegrationConfigData) {
  if (!config?.linkedinAccessToken || !config?.linkedinConversionId) return;

  const userIds = [];
  if (hashedData.email) userIds.push({ idType: "SHA256_EMAIL", idValue: hashedData.email });
  if (event.userData.li_fat_id) userIds.push({ idType: "LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID", idValue: event.userData.li_fat_id });

  if (userIds.length === 0) return;

  const payload = {
    conversion: `urn:li:sponsorConversion:${config.linkedinConversionId}`,
    conversionHappenedAt: event.timestamp,
    conversionValue: {
      currencyCode: event.currency,
      amount: event.value.toString()
    },
    user: {
      userIds: userIds,
      userInfo: { 
        ipAddress: hashedData.ip || undefined, 
        userAgent: hashedData.userAgent || undefined 
      }
    }
  };

  const response = await fetch(`https://api.linkedin.com/rest/conversionEvents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.linkedinAccessToken}`,
      'LinkedIn-Version': '202401',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
     const error = await response.text();
     throw new Error(`LinkedIn CAPI Failed: ${error}`);
  }
}

// ==========================================
// 4. TIKTOK EVENTS API
// ==========================================
async function sendToTikTokEventsAPI(event: ConversionEvent, hashedData: any, config?: IntegrationConfigData) {
  if (!config?.tiktokAccessToken || !config?.tiktokPixelId) return;

  const payload = {
    pixel_code: config.tiktokPixelId,
    event: event.eventName,
    event_id: `${event.leadId}_${event.eventName}`,
    timestamp: new Date(event.timestamp).toISOString(),
    context: {
      ad: { callback: event.userData.ttclid || undefined },
      user: {
        emails: hashedData.email ? [hashedData.email] : undefined,
        phone_numbers: hashedData.phone ? [hashedData.phone] : undefined,
        external_id: hashedData.externalId ? [hashedData.externalId] : undefined
      },
      ip: hashedData.ip || undefined,
      user_agent: hashedData.userAgent || undefined
    },
    properties: { 
      value: event.value, 
      currency: event.currency 
    }
  };

  const response = await fetch(`https://business-api.tiktok.com/open_api/v1.3/pixel/track/`, {
    method: 'POST',
    headers: {
      'Access-Token': config.tiktokAccessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
     const error = await response.text();
     throw new Error(`TikTok Events API Failed: ${error}`);
  }
}
