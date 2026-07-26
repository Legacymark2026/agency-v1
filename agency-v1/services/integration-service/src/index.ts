import express from 'express';
try {
  require("@agency/observability/register");
} catch { /* optional */ }
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from '@agency/database';
import { setupGracefulShutdown } from "@agency/service-auth";

const app = express();
const port = process.env.PORT || 4010;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'integration-service' });
});

import { integrationRouter } from "./routes/integration.routes";
import { errorHandler } from "./middlewares/integration.middleware";

app.use("/api/v1", integrationRouter);
app.use(errorHandler);

// ============================================================================
// PROVIDER MIGRATION & HELPERS
// ============================================================================

const PROVIDER_MIGRATION_MAP: Record<string, string> = {
  'facebook': 'facebook-page',
  'instagram': 'instagram-page',
  'whatsapp': 'whatsapp',
  'facebook-pixel': 'meta-pixel',
  'tiktok-pixel': 'tiktok-ads',
  'tiktok-messages': 'tiktok-messages',
  'linkedin-insight': 'linkedin-ads',
  'linkedin-webhook': 'linkedin-webhook',
  'google-analytics': 'google-analytics',
  'google-tag-manager': 'google-tag-manager',
  'google-search-console': 'google-search-console',
  'google-ads': 'google-ads',
  'hotjar': 'hotjar',
  'ahrefs': 'ahrefs',
  'gemini': 'ai-models',
  'ai-models': 'ai-models',
};

async function getOrCreateCompanyIdForUser(userId: string): Promise<string> {
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId },
    select: { companyId: true }
  });

  if (companyUser?.companyId) {
    return companyUser.companyId;
  }

  const firstCompany = await prisma.company.findFirst();
  let companyId = firstCompany?.id;

  if (!companyId) {
    const newCompany = await prisma.company.create({
      data: { name: "Default Company", slug: "default-company" },
      select: { id: true }
    });
    companyId = newCompany.id;
  }

  const existingLink = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId
      }
    }
  });

  if (!existingLink) {
    await (prisma.companyUser.create as any)({
      data: {
        userId,
        companyId,
        role: "admin"
      }
    });
  }

  return companyId;
}

async function migrateLegacyConfig(companyId: string, oldProvider: string, oldData: any): Promise<void> {
  console.log(`[Migration] Checking legacy provider: ${oldProvider}`);
  if (!oldData || Object.keys(oldData).length === 0) return;

  try {
    // Migration from 'facebook' (old single config) to new family structure
    if (oldProvider === 'facebook' && (oldData.appId || oldData.appSecret)) {
      // 1. Save app credentials in meta-app
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'meta-app' } },
        update: { config: { appId: oldData.appId, appSecret: oldData.appSecret } },
        create: { companyId, provider: 'meta-app', config: { appId: oldData.appId, appSecret: oldData.appSecret } }
      });
      console.log('[Migration] Saved app credentials to meta-app');
      
      // 2. Save page config in facebook-page
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'facebook-page' } },
        update: { config: { 
          pageId: oldData.pageId, 
          accessToken: oldData.accessToken,
          verifyToken: oldData.verifyToken,
          manualPageId: oldData.manualPageId,
          manualPageToken: oldData.manualPageToken
        }},
        create: { companyId, provider: 'facebook-page', config: { 
          pageId: oldData.pageId, 
          accessToken: oldData.accessToken,
          verifyToken: oldData.verifyToken,
          manualPageId: oldData.manualPageId,
          manualPageToken: oldData.manualPageToken
        }}
      });
      console.log('[Migration] Saved page config to facebook-page');
    }
    
    // Migration from 'facebook-pixel' to 'meta-pixel'
    if (oldProvider === 'facebook-pixel' && (oldData.pixelId || oldData.capiToken)) {
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'meta-pixel' } },
        update: { config: { pixelId: oldData.pixelId, capiToken: oldData.capiToken } },
        create: { companyId, provider: 'meta-pixel', config: { pixelId: oldData.pixelId, capiToken: oldData.capiToken } }
      });
      console.log('[Migration] Saved pixel config to meta-pixel');
    }
    
    // Migration from 'whatsapp' stays as 'whatsapp' (same name)
    if (oldProvider === 'whatsapp' && (oldData.phoneNumberId || oldData.accessToken)) {
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'whatsapp' } },
        update: { config: { phoneNumberId: oldData.phoneNumberId, wabaId: oldData.wabaId, accessToken: oldData.accessToken } },
        create: { companyId, provider: 'whatsapp', config: { phoneNumberId: oldData.phoneNumberId, wabaId: oldData.wabaId, accessToken: oldData.accessToken } }
      });
      console.log('[Migration] Saved WhatsApp config');
    }
    
    // Migration from 'tiktok-pixel' to 'tiktok-ads'
    if (oldProvider === 'tiktok-pixel' && (oldData.tiktokPixelId || oldData.tiktokAccessToken)) {
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'tiktok-ads' } },
        update: { config: { tiktokPixelId: oldData.tiktokPixelId, tiktokAccessToken: oldData.tiktokAccessToken } },
        create: { companyId, provider: 'tiktok-ads', config: { tiktokPixelId: oldData.tiktokPixelId, tiktokAccessToken: oldData.tiktokAccessToken } }
      });
      console.log('[Migration] Saved TikTok Ads config');
    }
    
    // Migration from 'tiktok-messages' stays as 'tiktok-messages'
    if (oldProvider === 'tiktok-messages' && (oldData.tiktokAppId || oldData.tiktokClientSecret)) {
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'tiktok-messages' } },
        update: { config: { tiktokAppId: oldData.tiktokAppId, tiktokClientSecret: oldData.tiktokClientSecret, tiktokWebhookSecret: oldData.tiktokWebhookSecret } },
        create: { companyId, provider: 'tiktok-messages', config: { tiktokAppId: oldData.tiktokAppId, tiktokClientSecret: oldData.tiktokClientSecret, tiktokWebhookSecret: oldData.tiktokWebhookSecret } }
      });
      console.log('[Migration] Saved TikTok Messages config');
    }
    
    // Migration from 'linkedin-insight' to 'linkedin-ads'
    if (oldProvider === 'linkedin-insight' && (oldData.linkedinPartnerId || oldData.linkedinAccessToken)) {
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'linkedin-ads' } },
        update: { config: { linkedinPartnerId: oldData.linkedinPartnerId, linkedinConversionId: oldData.linkedinConversionId, linkedinAccessToken: oldData.linkedinAccessToken } },
        create: { companyId, provider: 'linkedin-ads', config: { linkedinPartnerId: oldData.linkedinPartnerId, linkedinConversionId: oldData.linkedinConversionId, linkedinAccessToken: oldData.linkedinAccessToken } }
      });
      console.log('[Migration] Saved LinkedIn Ads config');
    }
    
    // Migration from 'linkedin-webhook' stays as 'linkedin-webhook'
    if (oldProvider === 'linkedin-webhook' && (oldData.linkedinClientId || oldData.linkedinClientSecret)) {
      await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId, provider: 'linkedin-webhook' } },
        update: { config: { linkedinClientId: oldData.linkedinClientId, linkedinClientSecret: oldData.linkedinClientSecret, linkedinWebhookSecret: oldData.linkedinWebhookSecret } },
        create: { companyId, provider: 'linkedin-webhook', config: { linkedinClientId: oldData.linkedinClientId, linkedinClientSecret: oldData.linkedinClientSecret, linkedinWebhookSecret: oldData.linkedinWebhookSecret } }
      });
      console.log('[Migration] Saved LinkedIn Webhook config');
    }
  } catch (error) {
    console.error(`[Migration] Error migrating legacy config for provider ${oldProvider}:`, error);
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// 1. Connected Accounts

// GET /api/integrations/accounts?userId=X
app.get('/api/integrations/accounts', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const accounts = await prisma.account.findMany({
      where: { userId: String(userId) },
      select: { provider: true, providerAccountId: true }
    });

    res.json({ accounts });
  } catch (error: any) {
    console.error('[IntegrationService] Error in GET /api/integrations/accounts:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// DELETE /api/integrations/accounts
app.delete('/api/integrations/accounts', async (req, res) => {
  try {
    const userId = (req.body.userId || req.query.userId) as string;
    const provider = (req.body.provider || req.query.provider) as string;
    let companyId = (req.body.companyId || req.query.companyId) as string | undefined;

    if (!userId || !provider) {
      return res.status(400).json({ error: 'Missing userId or provider parameter' });
    }

    const PROVIDER_ALIASES: Record<string, string[]> = {
      'facebook': ['facebook', 'facebook-page', 'meta-app', 'instagram-page'],
      'facebook-pixel': ['facebook-pixel', 'meta-pixel'],
      'tiktok-pixel': ['tiktok-pixel', 'tiktok-ads'],
      'tiktok-messages': ['tiktok-messages'],
      'linkedin-insight': ['linkedin-insight', 'linkedin-ads'],
      'linkedin-webhook': ['linkedin-webhook'],
      'whatsapp': ['whatsapp'],
      'google-ads': ['google-ads'],
      'google-analytics': ['google-analytics'],
      'google-tag-manager': ['google-tag-manager'],
      'google-search-console': ['google-search-console'],
      'hotjar': ['hotjar'],
    };

    const providersToDelete = PROVIDER_ALIASES[provider] || [provider];

    // Delete from Account table
    const deleteAccountsResult = await prisma.account.deleteMany({
      where: {
        userId,
        provider: { in: providersToDelete }
      }
    });

    // Resolve companyId if not provided
    if (!companyId) {
      const companyUser = await prisma.companyUser.findFirst({
        where: { userId },
        select: { companyId: true }
      });
      companyId = companyUser?.companyId;
    }

    let deleteConfigsResult = { count: 0 };
    if (companyId) {
      // Delete from IntegrationConfig table
      deleteConfigsResult = await prisma.integrationConfig.deleteMany({
        where: {
          companyId,
          provider: { in: providersToDelete }
        }
      });
    }

    res.json({
      success: true,
      deletedAccountsCount: deleteAccountsResult.count,
      deletedConfigsCount: deleteConfigsResult.count
    });
  } catch (error: any) {
    console.error('[IntegrationService] Error in DELETE /api/integrations/accounts:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 2. Integration Config

// GET /api/integrations/config
app.get('/api/integrations/config', async (req, res) => {
  try {
    const provider = (req.query.provider || req.body.provider) as string;
    let companyId = (req.query.companyId || req.body.companyId) as string | undefined;
    const userId = (req.query.userId || req.body.userId) as string | undefined;

    if (!provider) {
      return res.status(400).json({ error: 'Missing provider parameter' });
    }

    // Resolve companyId if not provided but userId is
    if (!companyId && userId) {
      const companyUser = await prisma.companyUser.findFirst({
        where: { userId },
        select: { companyId: true }
      });
      companyId = companyUser?.companyId;
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Missing companyId or userId parameters' });
    }

    // Check if legacy config exists and migrate if needed
    const legacyProvider = Object.keys(PROVIDER_MIGRATION_MAP).find(k => PROVIDER_MIGRATION_MAP[k] === provider);
    if (legacyProvider) {
      const legacyConfig = await prisma.integrationConfig.findUnique({
        where: { companyId_provider: { companyId, provider: legacyProvider } }
      });
      
      if (legacyConfig && legacyConfig.config && Object.keys(legacyConfig.config).length > 0) {
        console.log(`[IntegrationConfig] Legacy config found for ${legacyProvider}, migrating...`);
        await migrateLegacyConfig(companyId, legacyProvider, legacyConfig.config);
      }
    }

    const config = await prisma.integrationConfig.findUnique({
      where: {
        companyId_provider: {
          companyId,
          provider
        }
      }
    });

    res.json(config ? config.config : null);
  } catch (error: any) {
    console.error('[IntegrationService] Error in GET /api/integrations/config:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// POST /api/integrations/config
app.post('/api/integrations/config', async (req, res) => {
  try {
    const provider = req.body.provider as string;
    const config = req.body.config || req.body.data;
    let companyId = req.body.companyId as string | undefined;
    const userId = req.body.userId as string | undefined;

    if (!provider || config === undefined) {
      return res.status(400).json({ error: 'Missing provider or config parameter' });
    }

    // Resolve/create companyId if not provided but userId is
    if (!companyId && userId) {
      companyId = await getOrCreateCompanyIdForUser(userId);
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Missing companyId or userId parameters' });
    }

    const result = await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider } },
      update: { config, isEnabled: true },
      create: { companyId, provider, config, isEnabled: true }
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('[IntegrationService] Error in POST /api/integrations/config:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 3. WhatsApp Integration

// POST /api/integrations/whatsapp
app.post('/api/integrations/whatsapp', async (req, res) => {
  try {
    const { wabaId, phoneNumberId, phoneNumber, accessToken } = req.body;
    let companyId = req.body.companyId as string | undefined;
    const userId = req.body.userId as string | undefined;

    if (!phoneNumberId || !wabaId || !phoneNumber || !accessToken) {
      return res.status(400).json({ error: 'Missing required parameters: phoneNumberId, wabaId, phoneNumber, or accessToken' });
    }

    // Resolve/create companyId if not provided but userId is
    if (!companyId && userId) {
      companyId = await getOrCreateCompanyIdForUser(userId);
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Missing companyId or userId parameters' });
    }

    const result = await prisma.whatsAppIntegration.upsert({
      where: { phoneNumberId },
      update: {
        companyId,
        wabaId,
        phoneNumber,
        accessToken,
        status: 'active'
      },
      create: {
        companyId,
        wabaId,
        phoneNumberId,
        phoneNumber,
        accessToken,
        status: 'active'
      }
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('[IntegrationService] Error in POST /api/integrations/whatsapp:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 4. Email Domains Verification

// GET /api/integrations/domains/:domain
app.get('/api/integrations/domains/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    if (!domain) {
      return res.status(400).json({ error: 'Missing domain parameter' });
    }

    const verification = await prisma.emailDomainVerification.findUnique({
      where: { domain }
    });

    res.json(verification);
  } catch (error: any) {
    console.error('[IntegrationService] Error in GET /api/integrations/domains/:domain:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// POST /api/integrations/domains
app.post('/api/integrations/domains', async (req, res) => {
  try {
    const { domain, dnsRecords, status } = req.body;
    let companyId = req.body.companyId as string | undefined;
    const userId = req.body.userId as string | undefined;

    if (!domain || !dnsRecords || !status) {
      return res.status(400).json({ error: 'Missing domain, dnsRecords, or status' });
    }

    // Resolve/create companyId if not provided but userId is
    if (!companyId && userId) {
      companyId = await getOrCreateCompanyIdForUser(userId);
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Missing companyId or userId parameters' });
    }

    const result = await prisma.emailDomainVerification.upsert({
      where: { domain },
      update: { dnsRecords, status },
      create: {
        companyId,
        domain,
        dnsRecords,
        status
      }
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('[IntegrationService] Error in POST /api/integrations/domains:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const server = app.listen(port, () => {
  console.log(`Integration Service listening at http://localhost:${port}`);
});
setupGracefulShutdown(server);
