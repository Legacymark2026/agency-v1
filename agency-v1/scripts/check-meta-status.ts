/**
 * Meta Integration Status Check
 * Runs a diagnostic on the Meta Graph API connection and permissions.
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const prisma = new PrismaClient();

async function runDiagnostic() {
  console.log('--- Meta Integration Diagnostic ---');
  
  try {
    // 1. Check Integration Configuration
    // We search for multiple possible provider names to be safe
    const configs = await prisma.integrationConfig.findMany({
      where: {
        provider: {
          in: [
            'meta', 
            'facebook', 
            'meta-app', 
            'facebook-page', 
            'meta_app_config', 
            'facebook_page_config'
          ]
        }
      }
    });

    if (configs.length === 0) {
      console.error('❌ No Meta integration configurations found in database.');
      // Check if there are ANY configs to help user debug
      const allConfigs = await prisma.integrationConfig.findMany({ 
        take: 5,
        select: { provider: true }
      });
      if (allConfigs.length > 0) {
        console.log('Existing providers in DB:', allConfigs.map(c => c.provider).join(', '));
      }
      return;
    }

    console.log(`✅ Found ${configs.length} integration configurations.`);

    for (const config of configs) {
      const data = config.config as any;
      console.log(`\n--- Checking provider: ${config.provider} ---`);
      
      // Try multiple possible token fields
      const token = data.accessToken || data.manualPageToken || data.pageToken || data.token;
      const appId = data.appId;
      const appSecret = data.appSecret;

      if (!token && !appId) {
        console.warn('⚠️ No credentials (token or appId) found in this config.');
        console.log('Data structure:', JSON.stringify(data, null, 2));
        continue;
      }

      // If it's an app config, try to validate the app
      if (appId && appSecret) {
        console.log(`Validating Meta App: ${appId}`);
        try {
          const appResponse = await fetch(`https://graph.facebook.com/v19.0/${appId}?access_token=${appId}|${appSecret}`);
          const appResult = await appResponse.json() as any;
          if (appResult.error) {
            console.error(`❌ App Error: ${appResult.error.message}`);
          } else {
            console.log(`✅ App Verified: ${appResult.name}`);
          }
        } catch (e: any) {
          console.error(`❌ App fetch failed: ${e.message}`);
        }
      }

      if (token) {
        // 2. Validate Token with Meta API
        console.log('Validating token with Meta Graph API...');
        try {
          const response = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}&fields=id,name,permissions`);
          const result = await response.json() as any;

          if (result.error) {
            console.error(`❌ Token Error: ${result.error.message}`);
            console.error(`   Code: ${result.error.code}, Subcode: ${result.error.error_subcode}`);
            
            // Helpful tip for Code 10 (window violation) which we handled in meta-sync.ts
            if (result.error.code === 10) {
              console.log('   💡 TIP: This is a policy violation. We have logic in meta-sync.ts to handle this with HUMAN_AGENT tag.');
            }
          } else {
            console.log(`✅ Token is VALID.`);
            console.log(`   Account: ${result.name} (${result.id})`);
            
            if (result.permissions) {
              const granted = result.permissions.data
                .filter((p: any) => p.status === 'granted')
                .map((p: any) => p.permission);
              console.log('   Permissions:', granted.join(', '));
              
              // Check for critical permissions
              const critical = ['pages_messaging', 'pages_read_engagement', 'pages_manage_metadata'];
              const missing = critical.filter(p => !granted.includes(p));
              if (missing.length > 0) {
                console.warn(`   ⚠️ Missing critical permissions: ${missing.join(', ')}`);
              }
            }
          }

          // 3. Check Pages
          console.log('Fetching connected pages...');
          const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}&fields=id,name,tasks`);
          const pagesResult = await pagesResponse.json() as any;

          if (pagesResult.data) {
            console.log(`✅ Found ${pagesResult.data.length} page(s):`);
            pagesResult.data.forEach((page: any) => {
              console.log(`   - ${page.name} (${page.id})`);
              if (page.tasks) {
                console.log(`     Tasks: ${page.tasks.join(', ')}`);
              }
            });
          } else if (pagesResult.error) {
            console.error(`   ❌ Error fetching pages: ${pagesResult.error.message}`);
          }
        } catch (e: any) {
          console.error(`   ❌ Token validation failed: ${e.message}`);
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Diagnostic failed with unexpected error:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostic();
