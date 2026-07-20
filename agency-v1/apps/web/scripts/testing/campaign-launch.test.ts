import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db as prisma } from '../../lib/db';
import { saveCampaignDraft, launchMultiPlatformCampaign } from '../../actions/marketing/campaign-builder';

// Mock auth module
vi.mock('../../lib/auth', () => {
    return {
        auth: () => Promise.resolve({
            user: {
                id: 'test-e2e-user',
                companyId: 'test-e2e-company',
            }
        })
    };
});

describe('E2E Advanced Campaign Wizard System Test', () => {
    const testCompanyId = 'test-e2e-company';
    const testUserId = 'test-e2e-user';
    let mockFetch: any;

    let isDbConnected = false;

    beforeAll(async () => {
        console.log('🌱 Setting up test data in PostgreSQL database...');
        try {
            // 1. Setup Company
            await prisma.company.upsert({
                where: { id: testCompanyId },
                update: {},
                create: {
                    id: testCompanyId,
                    name: 'E2E Test Agency',
                    slug: 'e2e-test-agency',
                    subscriptionTier: 'pro',
                    subscriptionStatus: 'active',
                }
            });

            // 2. Setup User
            await prisma.user.upsert({
                where: { id: testUserId },
                update: {},
                create: {
                    id: testUserId,
                    email: 'e2e-test-user@legacymark.com',
                    name: 'E2E System Test',
                    role: 'admin',
                    passwordHash: 'fake-hash',
                }
            });

            // 3. Setup Company User relation
            await prisma.companyUser.upsert({
                where: {
                    userId_companyId: {
                        userId: testUserId,
                        companyId: testCompanyId
                    }
                },
                update: {},
                create: {
                    userId: testUserId,
                    companyId: testCompanyId,
                    roleName: 'admin',
                }
            });

            // 4. Setup Integration Configurations with dummy tokens
            await prisma.integrationConfig.upsert({
                where: {
                    companyId_provider: {
                        companyId: testCompanyId,
                        provider: 'google_ads'
                    }
                },
                update: {
                    isEnabled: true,
                    config: {
                        customerId: '1234567890',
                        developerToken: 'mock-dev-token',
                        accessToken: 'mock-access-token'
                    }
                },
                create: {
                    companyId: testCompanyId,
                    provider: 'google_ads',
                    isEnabled: true,
                    config: {
                        customerId: '1234567890',
                        developerToken: 'mock-dev-token',
                        accessToken: 'mock-access-token'
                    }
                }
            });

            await prisma.integrationConfig.upsert({
                where: {
                    companyId_provider: {
                        companyId: testCompanyId,
                        provider: 'linkedin_ads'
                    }
                },
                update: {
                    isEnabled: true,
                    config: {
                        accountId: '987654321',
                        accessToken: 'mock-linkedin-token'
                    }
                },
                create: {
                    companyId: testCompanyId,
                    provider: 'linkedin_ads',
                    isEnabled: true,
                    config: {
                        accountId: '987654321',
                        accessToken: 'mock-linkedin-token'
                    }
                }
            });
            isDbConnected = true;
        } catch (err: any) {
            console.warn(`     ⚠️ Database not reachable for live campaign E2E test: ${err.message}. Skipping live DB operations.`);
        }

        // 5. Setup Mock Fetch
        mockFetch = vi.fn((url: string, init?: any) => {
            const body = init?.body ? JSON.parse(init.body) : {};
            
            // Handle Google Ads Mutates
            if (url.includes('googleads.googleapis.com')) {
                let resourceName = 'customers/123/default';
                if (url.includes('campaignBudgets:mutate')) {
                    resourceName = 'customers/123/campaignBudgets/bud_111';
                } else if (url.includes('campaigns:mutate')) {
                    resourceName = 'customers/123/campaigns/camp_222';
                } else if (url.includes('adGroups:mutate')) {
                    resourceName = 'customers/123/adGroups/grp_333';
                } else if (url.includes('adGroupAds:mutate')) {
                    resourceName = 'customers/123/adGroupAds/ad_444';
                } else if (url.includes('campaignCriteria:mutate') || url.includes('adGroupCriteria:mutate')) {
                    resourceName = 'customers/123/criteria/crit_555';
                }
                
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({
                        results: [{ resourceName }]
                    })
                } as any);
            }
            
            // Handle LinkedIn API responses
            if (url.includes('api.linkedin.com')) {
                const headers = new Map();
                headers.set('x-restli-id', 'urn:li:sponsoredCampaignGroup:99999');
                return Promise.resolve({
                    ok: true,
                    status: 201,
                    headers,
                    text: () => Promise.resolve('Created URN: urn:li:sponsoredCampaignGroup:99999'),
                    json: () => Promise.resolve({ id: '99999' })
                } as any);
            }
            
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({})
            } as any);
        });
        
        global.fetch = mockFetch;
    });

    afterAll(async () => {
        if (isDbConnected) {
            console.log('🧹 Cleaning up test database records...');
            try {
                await prisma.campaign.deleteMany({ where: { companyId: testCompanyId } });
                await prisma.integrationConfig.deleteMany({ where: { companyId: testCompanyId } });
                await prisma.companyUser.deleteMany({ where: { companyId: testCompanyId } });
                await prisma.user.delete({ where: { id: testUserId } });
                await prisma.company.delete({ where: { id: testCompanyId } });
            } catch (err: any) {
                console.warn(`     ⚠️ Error during cleanup: ${err.message}`);
            }
        }
        vi.restoreAllMocks();
    });

    it('should save campaign draft with advanced Google Keywords and LinkedIn B2B targeting', async () => {
        if (!isDbConnected) {
            console.warn(' Skipping live campaign test because DB is not reachable');
            return;
        }
        const draftInput = {
            companyId: testCompanyId,
            name: 'Q3 Enterprise Software Blitz',
            objective: 'LEAD_GENERATION',
            totalBudget: 15000,
            startDate: '2026-08-01',
            endDate: '2026-08-31',
            platforms: ['GOOGLE_ADS', 'LINKEDIN_ADS'],
            targeting: {
                location: 'Colombia & US',
                googleKeywords: ['software para agencias', 'crm enterprise colombia', 'b2b marketing platform'],
                linkedinIndustries: ['Software', 'Information Technology', 'Marketing & Advertising'],
                linkedinJobTitles: ['CMO', 'Head of Marketing', 'VP of Sales', 'CEO'],
            },
            adCreatives: [
                {
                    title: 'Escala tu Agencia con LegacyMark',
                    description: 'La plataforma omnicanal todo en uno para agencias de alto rendimiento.',
                    callToAction: 'Demostración Gratuita',
                }
            ],
        };

        const result = await saveCampaignDraft(draftInput);
        expect(result.success).toBe(true);
        expect(result.campaignId).toBeDefined();

        // Verify record created in DB
        const createdCampaign = await prisma.campaign.findUnique({
            where: { id: result.campaignId }
        });
        expect(createdCampaign).not.toBeNull();
        expect(createdCampaign?.name).toBe('Q3 Enterprise Software Blitz');
        expect(createdCampaign?.status).toBe('DRAFT');
        expect(createdCampaign?.platforms).toContain('GOOGLE_ADS');
        expect(createdCampaign?.platforms).toContain('LINKEDIN_ADS');
    });

    it('should launch multi-platform campaign and invoke Google & LinkedIn APIs', async () => {
        if (!isDbConnected) {
            console.warn(' Skipping live campaign launch test because DB is not reachable');
            return;
        }
        const campaign = await prisma.campaign.create({
            data: {
                companyId: testCompanyId,
                name: 'Live Multi-Platform Test Campaign',
                objective: 'LEAD_GENERATION',
                totalBudget: 5000,
                startDate: new Date('2026-08-01'),
                endDate: new Date('2026-08-31'),
                status: 'DRAFT',
                platforms: ['GOOGLE_ADS', 'LINKEDIN_ADS'],
                targeting: {
                    googleKeywords: ['marketing automation'],
                    linkedinIndustries: ['Technology'],
                    linkedinJobTitles: ['Marketing Director']
                },
                adCreatives: [
                    { title: 'Headline 1', description: 'Description 1' }
                ]
            }
        });

        const launchResult = await launchMultiPlatformCampaign(campaign.id);
        expect(launchResult.success).toBe(true);
        expect(launchResult.platformResults).toHaveLength(2);

        const googleRes = launchResult.platformResults.find((r: any) => r.platform === 'GOOGLE_ADS');
        const linkedinRes = launchResult.platformResults.find((r: any) => r.platform === 'LINKEDIN_ADS');

        expect(googleRes?.status).toBe('SUCCESS');
        expect(googleRes?.externalCampaignId).toContain('camp_222');

        expect(linkedinRes?.status).toBe('SUCCESS');
        expect(linkedinRes?.externalCampaignId).toBe('99999');

        // Check DB updated to ACTIVE
        const updatedCampaign = await prisma.campaign.findUnique({
            where: { id: campaign.id }
        });
        expect(updatedCampaign?.status).toBe('ACTIVE');
    });
});
