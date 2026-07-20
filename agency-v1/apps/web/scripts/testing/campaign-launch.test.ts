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
            isDbConnected = true;
        } catch (err: any) {
            console.warn(`     ⚠️ Database not reachable for live campaign E2E test: ${err.message}. Skipping live DB operations.`);
        }
                userId: testUserId,
                companyId: testCompanyId,
                roleName: 'admin',
                permissions: ['*']
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
        if (!isDbConnected) return;
        console.log('🧹 Cleaning up test database records...');
        try {
            // Delete campaigns created by testing
            await prisma.campaign.deleteMany({
                where: {
                    companyId: testCompanyId
                }
            });
            
            // Delete integration configs
            await prisma.integrationConfig.deleteMany({
                where: {
                    companyId: testCompanyId
                }
            });
            
            // Delete User and Company
            await prisma.companyUser.deleteMany({
                where: {
                    companyId: testCompanyId
                }
            });
            await prisma.user.delete({
                where: { id: testUserId }
            });
            await prisma.company.delete({
                where: { id: testCompanyId }
            });
        } catch (err: any) {
            console.warn(`     ⚠️ Error during cleanup: ${err.message}`);
        }
    });
        
        vi.restoreAllMocks();
    });

    it('should save campaign draft with advanced Google Keywords and LinkedIn B2B targeting', async () => {
        const campaignData = {
            name: 'Advanced E2E Launch Campaign',
            description: 'Test advanced parameters flow',
            platform: 'GOOGLE_ADS,LINKEDIN_ADS',
            budget: 1500,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            objective: 'LEAD_GENERATION',
            budgetType: 'DAILY',
            bidStrategy: 'TARGET_CPA',
            bidAmount: 15,
            pacing: 'STANDARD',
            currency: 'USD',
            targeting: {
                locations: 'US,CA',
                genders: ['ALL'],
                ageMin: 18,
                ageMax: 65,
                interests: ['business', 'technology']
            },
            creative: {
                headlines: ['Headline 1', 'Headline 2', 'Headline 3'],
                descriptions: ['Description text 1', 'Description text 2'],
                destinationUrl: 'https://legacymark.com/signup',
                callToAction: 'SIGN_UP'
            },
            platformConfigs: {
                google: {
                    networkSettings: {
                        searchPartners: true,
                        displayNetwork: false
                    }
                },
                linkedin: {
                    adFormat: 'SINGLE_IMAGE'
                }
            },
            parameters: {
                objective: 'LEAD_GENERATION',
                headlines: ['Headline 1', 'Headline 2', 'Headline 3'],
                descriptions: ['Description text 1', 'Description text 2'],
                destinationUrl: 'https://legacymark.com/signup',
                googleKeywords: {
                    keywords: ['agency service', 'marketing automated'],
                    matchType: 'PHRASE',
                    negativeKeywords: ['free trial']
                },
                linkedinTargeting: {
                    companySize: '11-50',
                    seniority: 'CXO',
                    jobFunctions: ['12', '15'], // Marketing, engineering
                    industries: ['technology', 'software'],
                    skills: ['React', 'Marketing Automation']
                }
            },
            trackingConfig: {
                utm: {
                    source: 'legacymark'
                }
            }
        };

        const result = await saveCampaignDraft(campaignData);
        expect(result.success).toBe(true);
        expect(result.id).toBeDefined();

        // Retrieve campaign from DB to verify JSON persistence
        const campaign = await prisma.campaign.findUnique({
            where: { id: result.id }
        });

        expect(campaign).not.toBeNull();
        expect(campaign!.name).toBe('Advanced E2E Launch Campaign');
        expect(campaign!.platform).toBe('GOOGLE_ADS,LINKEDIN_ADS');
        
        // Assert new fields exist and are stored correctly
        const dbPlatformConfigs = campaign!.platformConfigs as any;
        expect(dbPlatformConfigs.google.networkSettings.searchPartners).toBe(true);
        expect(dbPlatformConfigs.linkedin.adFormat).toBe('SINGLE_IMAGE');

        const dbParameters = campaign!.parameters as any;
        expect(dbParameters.googleKeywords.matchType).toBe('PHRASE');
        expect(dbParameters.googleKeywords.keywords).toContain('agency service');
        expect(dbParameters.googleKeywords.negativeKeywords).toContain('free trial');
        
        expect(dbParameters.linkedinTargeting.companySize).toBe('11-50');
        expect(dbParameters.linkedinTargeting.seniority).toBe('CXO');
        expect(dbParameters.linkedinTargeting.skills).toContain('React');
        
        console.log('✅ Campaign draft and all advanced JSON fields successfully saved and verified in the database!');
        
        // Launch campaign
        console.log('🚀 Running launchMultiPlatformCampaign E2E...');
        const launchResults = await launchMultiPlatformCampaign(result.id!, ['GOOGLE_ADS', 'LINKEDIN_ADS']);
        
        expect(launchResults).toHaveLength(2);
        expect(launchResults[0].success).toBe(true);
        expect(launchResults[1].success).toBe(true);
        
        // Verify Google Ads fetch mutate operations
        const googleMutates = mockFetch.mock.calls.filter((call: any) => call[0].includes('googleads.googleapis.com'));
        expect(googleMutates.length).toBeGreaterThanOrEqual(4); // Budget, Campaign, AdGroup, RSA Ad...
        
        // Check that keywords were mutated
        const keywordMutateCall = googleMutates.find((call: any) => call[0].includes('adGroupCriteria:mutate') && call[1]?.body?.includes('keyword'));
        expect(keywordMutateCall).toBeDefined();
        const keywordBody = JSON.parse(keywordMutateCall[1].body);
        expect(keywordBody.operations).toHaveLength(3); // 2 keywords + 1 negative keyword
        
        // Assert positive keyword values
        const kw1 = keywordBody.operations[0].create;
        expect(kw1.keyword.text).toBe('agency service');
        expect(kw1.keyword.matchType).toBe('PHRASE');
        expect(kw1.negative).toBe(false);

        // Assert negative keyword values
        const kwNeg = keywordBody.operations[2].create;
        expect(kwNeg.keyword.text).toBe('free trial');
        expect(kwNeg.keyword.matchType).toBe('EXACT');
        expect(kwNeg.negative).toBe(true);

        // Verify LinkedIn Ads fetch mutate operations
        const linkedinMutates = mockFetch.mock.calls.filter((call: any) => call[0].includes('api.linkedin.com'));
        expect(linkedinMutates.length).toBeGreaterThanOrEqual(2); // Group, Campaign

        const campaignCall = linkedinMutates.find((call: any) => call[0].includes('adCampaigns') || (call[0].includes('adCampaign') && !call[0].includes('Group')));
        expect(campaignCall).toBeDefined();
        const campaignCallBody = JSON.parse(campaignCall[1].body);
        
        // Verify LinkedIn B2B targeting payload
        const audience = campaignCallBody.audience;
        expect(audience).toBeDefined();
        
        // Assert staff size maps to correct URN
        const staffCountOr = audience.include.and.find((andItem: any) => andItem.or?.['urn:li:adTargetingFacet:staffCountRanges']);
        expect(staffCountOr.or['urn:li:adTargetingFacet:staffCountRanges']).toContain('urn:li:organizationCapacity:(11,50)');
        
        // Assert seniority maps to correct URN
        const seniorityOr = audience.include.and.find((andItem: any) => andItem.or?.['urn:li:adTargetingFacet:seniorities']);
        expect(seniorityOr.or['urn:li:adTargetingFacet:seniorities']).toContain('urn:li:seniority:10'); // CXO is 10

        // Assert skills map to skill URNs
        const skillsOr = audience.include.and.find((andItem: any) => andItem.or?.['urn:li:adTargetingFacet:skills']);
        expect(skillsOr.or['urn:li:adTargetingFacet:skills']).toContain('urn:li:skill:React');

        console.log('✅ End-to-end launch verification succeeded: platform dispatchers correctly formatted all advanced fields!');
    });
});
