'use client';

import { create } from 'zustand';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type PlatformKey = 'FACEBOOK_ADS' | 'GOOGLE_ADS' | 'TIKTOK_ADS' | 'LINKEDIN_ADS';

export interface WizardBudget {
    type: 'DAILY' | 'LIFETIME';
    amount: number;
    bidStrategy: 'LOWEST_COST' | 'COST_CAP' | 'TARGET_COST' | 'MANUAL' | 'TCPA' | 'TROAS';
    bidAmount?: number;
    costCapAmount?: number;
    roasTarget?: number;
    currency: string;
    pacing?: 'STANDARD' | 'ACCELERATED';
    dayParting?: {
        enabled: boolean;
        schedule: Record<string, number[]>;
    };
    smartDistribution?: {
        enabled: boolean;
        autoOptimize: boolean;
        preferredPlatforms?: PlatformKey[];
    };
}

export interface LocationTarget {
    id: string;
    type: 'COUNTRY' | 'REGION' | 'CITY' | 'SECTOR' | 'COORDINATES';
    name: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    tags?: string[];
}

export interface WizardTargeting {
    ageMin: number;
    ageMax: number;
    genders: ('MALE' | 'FEMALE' | 'ALL')[];
    locations: LocationTarget[];
    interests: string[];
    customAudiences?: string;
    excludedAudiences?: string;
    lookalike?: boolean;
    lookalikeSource?: 'CUSTOM_AUDIENCE' | 'CONVERSION_PIXEL' | 'HIGH_VALUE_CUSTOMERS';
    lookalikePercentage?: number;
    remarketing?: boolean;
    remarketingSources?: string[];
    exclusionLocations?: string[];
}

export interface AIGenerationConfig {
    enabled: boolean;
    brandVoice?: 'professional' | 'casual' | 'innovative' | 'premium' | 'friendly' | 'urgent';
    brandValues?: string[];
    objective?: 'lead_generation' | 'conversions' | 'traffic' | 'brand_awareness' | 'engagement' | 'retargeting';
    desiredCTA?: 'learn_more' | 'sign_up' | 'contact' | 'buy_now' | 'download' | 'apply_now' | 'get_quote';
    industry?: 'b2b' | 'saas' | 'ecommerce' | 'services' | 'healthcare' | 'education' | 'real_estate' | 'finance' | 'food' | 'travel' | 'other';
    audienceAge?: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
    audienceGender?: 'male' | 'female' | 'all';
    hookStyle?: 'question' | 'statement' | 'benefit' | 'pain_point' | 'statistic' | 'testimonial';
    headlineStyle?: 'how_to' | 'question' | 'scarcity' | 'social_proof' | 'urgency' | 'curiosity';
    keywords?: string[];
    headlineLength?: 'short' | 'medium' | 'long';
    tone?: 'professional' | 'casual' | 'urgent' | 'friendly';
    generateCount: number;
}

export interface BrandIdentity {
    companyName: string;
    tagline: string;
    brandColors: string[];
    brandLogo: string;
    website?: string;
    uniqueValueProposal: string;
    competitors: string[];
    brandGuidelines: string;
    toneVariations: ('emotional' | 'rational' | 'humorous' | 'authoritative')[];
}

export interface BrandManual {
    // Basic Info
    companyName: string;
    tagline: string;
    logo?: string;
    website?: string;
    brandColors: string[];
    
    // Brand Story
    history: string;
    mission: string;
    vision: string;
    
    // Values & Personality
    values: string[];
    personality: string;
    audienceIdeal: string;
    
    // Guidelines
    dos: string[];
    donts: string[];
    forbiddenWords: string[];
    
    // Examples
    fewShotExamples: {
        headline: string;
        description: string;
        primaryText: string;
        cta: string;
    }[];
    
    // External Source
    manualUrl?: string;
    manualFileName?: string;
    
    createdAt: string;
    updatedAt: string;
}

export interface BrandPreset {
    id: string;
    name: string;
    brandVoice: AIGenerationConfig['brandVoice'];
    brandValues: string[];
    industry: AIGenerationConfig['industry'];
    desiredCTA: AIGenerationConfig['desiredCTA'];
    createdAt: string;
}

export interface WizardCreative {
    headline?: string;
    description?: string;
    primaryText?: string;
    headlines: string[];
    descriptions: string[];
    primaryTexts: string[];
    callToAction?: string;
    destinationUrl?: string;
    assetUrls: string[];
    aiDynamicVariables?: {
        enabled: boolean;
        variables: string[];
    };
    utmConfig: {
        source: string;
        medium: string;
        campaign: string;
        content?: string;
    };
    abTestVariants?: ABTestVariant[];
    aiGenerated?: AIGenerationConfig;
    brandPreset?: BrandPreset;
    brandIdentity?: BrandIdentity;
    brandManual?: BrandManual;
    adGroups?: AdGroup[];
    activeAdGroupId?: string;
}

export interface AdGroup {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    ads: Ad[];
    targeting?: Partial<WizardTargeting>;
    budgetOverride?: number;
    createdAt: string;
}

export interface Ad {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    format: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'COLLECTION' | 'STORY' | 'REEL';
    headlines: string[];
    descriptions: string[];
    primaryTexts: string[];
    callToAction?: string;
    assetUrls: string[];
    videoUrls?: string[];
    generatedWithAI?: boolean;
    createdAt: string;
}

export interface ABTestVariant {
    id: string;
    name: string;
    headline?: string;
    description?: string;
    primaryText?: string;
    imageUrl?: string;
    allocation: number;
    isControl: boolean;
}

export interface CampaignTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    platforms: PlatformKey[];
    objective: string;
    budget: WizardBudget;
    targeting: WizardTargeting;
    creative: WizardCreative;
    createdAt: string;
    usageCount: number;
}

export interface SmartBudgetAllocation {
    platform: PlatformKey;
    percentage: number;
    suggestedAmount: number;
    historicalPerformance?: {
        cpc: number;
        cpm: number;
        roas: number;
        conversionRate: number;
    };
}

export interface CampaignAnalytics {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    cpc: number;
    cpm: number;
    roas: number;
    conversionRate: number;
    platformData: Record<PlatformKey, {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
    }>;
}

export interface WizardState {
    // Progress
    step: number;
    campaignId?: string;

    // Step 1
    platforms: PlatformKey[];
    objective: string;
    name: string;
    description?: string;

    // Step 2
    budget: WizardBudget;
    startDate?: string;
    endDate?: string;
    smartAllocation?: SmartBudgetAllocation[];

    // Step 3
    targeting: WizardTargeting;

    // Step 4
    creative: WizardCreative;

    // Step 5 — Pre-flight results
    validationResults: Array<{ platform: string; valid: boolean; errors: Array<{ field: string; message: string; severity: string }> }>;
    isValidating: boolean;

    // Step 6
    isLaunching: boolean;
    launchResults: Array<{ platform: string; success: boolean; externalId?: string; error?: string }>;

    // Advanced Features
    templates: CampaignTemplate[];
    savedTemplate?: CampaignTemplate;
    analytics?: CampaignAnalytics;
    isAnalyzing: boolean;
    abTestConfig?: {
        enabled: boolean;
        variants: ABTestVariant[];
        trafficSplit: number;
    };
    brandPresets: BrandPreset[];
    setBrandPresets: (presets: BrandPreset[]) => void;
    saveBrandPreset: (name: string) => void;
    loadBrandPreset: (preset: BrandPreset) => void;
    setAIGenerationConfig: (config: Partial<AIGenerationConfig>) => void;
    setBrandIdentity: (identity: Partial<BrandIdentity>) => void;
    setBrandManual: (manual: Partial<BrandManual>) => void;

    // Actions
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setPlatforms: (platforms: PlatformKey[]) => void;
    setObjective: (objective: string) => void;
    setName: (name: string) => void;
    setDescription: (desc: string) => void;
    setBudget: (budget: Partial<WizardBudget>) => void;
    setDates: (start?: string, end?: string) => void;
    setTargeting: (targeting: Partial<WizardTargeting>) => void;
    setCreative: (creative: Partial<WizardCreative>) => void;
    addAssetUrl: (url: string) => void;
    removeAssetUrl: (url: string) => void;
    setValidationResults: (results: WizardState['validationResults']) => void;
    setIsValidating: (v: boolean) => void;
    setLaunchResults: (results: WizardState['launchResults']) => void;
    setIsLaunching: (v: boolean) => void;
    setCampaignId: (id: string) => void;
    setSmartAllocation: (allocation: SmartBudgetAllocation[]) => void;
    setTemplates: (templates: CampaignTemplate[]) => void;
    saveAsTemplate: (name: string, description: string) => void;
    loadTemplate: (template: CampaignTemplate) => void;
    setAnalytics: (analytics: CampaignAnalytics) => void;
    setIsAnalyzing: (v: boolean) => void;
    setABTestConfig: (config: WizardState['abTestConfig']) => void;
    generateAIVariants: () => Promise<void>;
    analyzePerformance: () => Promise<void>;
    reset: () => void;
    addAdGroup: (name: string) => void;
    removeAdGroup: (id: string) => void;
    setActiveAdGroup: (id: string) => void;
    addAdToGroup: (groupId: string, ad: Omit<Ad, 'id' | 'createdAt'>) => void;
    removeAd: (groupId: string, adId: string) => void;
    updateAd: (groupId: string, adId: string, updates: Partial<Ad>) => void;
    toggleAdStatus: (groupId: string, adId: string) => void;
}

// ─── DEFAULT VALUES ───────────────────────────────────────────────────────────

const defaultBudget: WizardBudget = {
    type: 'DAILY',
    amount: 50,
    bidStrategy: 'LOWEST_COST',
    currency: 'USD',
    pacing: 'STANDARD',
    dayParting: {
        enabled: false,
        schedule: {},
    },
};

const defaultTargeting: WizardTargeting = {
    ageMin: 18,
    ageMax: 65,
    genders: ['ALL'],
    locations: [{ id: 'loc-co', type: 'COUNTRY', name: 'Colombia' }],
    interests: [],
};

const defaultCreative: WizardCreative = {
    headlines: [''],
    descriptions: [''],
    primaryTexts: [''],
    assetUrls: [],
    utmConfig: {
        source: 'paid',
        medium: 'cpc',
        campaign: '',
    },
    aiGenerated: {
        enabled: false,
        generateCount: 3,
    },
    brandPreset: undefined,
    adGroups: [],
    activeAdGroupId: undefined,
};

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useCampaignWizard = create<WizardState>((set, get) => ({
    step: 0, // FIX #2: Start at step 0 (Templates screen) instead of step 1 (Platform)
    platforms: [],
    objective: 'LEAD_GENERATION',
    name: '',
    description: '',
    budget: defaultBudget,
    targeting: defaultTargeting,
    creative: defaultCreative,
    validationResults: [],
    isValidating: false,
    launchResults: [],
    isLaunching: false,
    templates: [],
    smartAllocation: [],
    isAnalyzing: false,
    abTestConfig: undefined,
    brandPresets: [],
    
    setStep: (step) => set({ step }),
    nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6) })),
    prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
    setPlatforms: (platforms) => set({ platforms }),
    setObjective: (objective) => set({ objective }),
    setName: (name) => set({ name }),
    setDescription: (description) => set({ description }),
    setBudget: (budget) => set((s) => ({ budget: { ...s.budget, ...budget } })),
    setDates: (startDate, endDate) => set({ startDate, endDate }),
    setTargeting: (targeting) => set((s) => ({ targeting: { ...s.targeting, ...targeting } })),
    setCreative: (creative) => set((s) => ({ creative: { ...s.creative, ...creative } })),
    addAssetUrl: (url) => set((s) => ({ creative: { ...s.creative, assetUrls: [...s.creative.assetUrls, url] } })),
    removeAssetUrl: (url) => set((s) => ({ creative: { ...s.creative, assetUrls: s.creative.assetUrls.filter(u => u !== url) } })),
    setValidationResults: (validationResults) => set({ validationResults }),
    setIsValidating: (isValidating) => set({ isValidating }),
    setLaunchResults: (launchResults) => set({ launchResults }),
    setIsLaunching: (isLaunching) => set({ isLaunching }),
    setCampaignId: (campaignId) => set({ campaignId }),
    setSmartAllocation: (smartAllocation) => set({ smartAllocation }),
    setTemplates: (templates) => set({ templates }),
    saveAsTemplate: (name, description) => {
        const state = get();
        const template = {
            id: `tpl_${Date.now()}`,
            name,
            description,
            category: 'custom',
            platforms: state.platforms,
            objective: state.objective,
            budget: state.budget,
            targeting: state.targeting,
            creative: state.creative,
            createdAt: new Date().toISOString(),
            usageCount: 0,
        };
        set((s) => ({ templates: [...s.templates, template] }));
    },
    loadTemplate: (template) => set({
        platforms: template.platforms,
        objective: template.objective,
        budget: template.budget,
        targeting: template.targeting,
        creative: template.creative,
    }),
    setAnalytics: (analytics) => set({ analytics }),
    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
    setABTestConfig: (abTestConfig) => set({ abTestConfig }),
    setBrandPresets: (brandPresets) => set({ brandPresets }),
    
    saveBrandPreset: (name: string) => {
        const state = get();
        const config = state.creative.aiGenerated;
        const preset: BrandPreset = {
            id: `bp_${Date.now()}`,
            name,
            brandVoice: config?.brandVoice || 'professional',
            brandValues: config?.brandValues || [],
            industry: config?.industry || 'other',
            desiredCTA: config?.desiredCTA || 'learn_more',
            createdAt: new Date().toISOString(),
        };
        set((s) => ({ brandPresets: [...s.brandPresets, preset] }));
    },
    
    loadBrandPreset: (preset: BrandPreset) => set((s) => ({
        creative: {
            ...s.creative,
            brandPreset: preset,
            aiGenerated: {
                enabled: true,
                brandVoice: preset.brandVoice,
                brandValues: preset.brandValues,
                industry: preset.industry,
                desiredCTA: preset.desiredCTA,
                generateCount: 3,
                },
            },
        })),
        
setAIGenerationConfig: (config: Partial<AIGenerationConfig>) => set((s) => ({
            creative: {
                ...s.creative,
                aiGenerated: { ...s.creative.aiGenerated, ...config } as AIGenerationConfig,
            },
        })),
        
        setBrandIdentity: (identity: Partial<BrandIdentity>) => set((s) => ({
            creative: {
                ...s.creative,
                brandIdentity: { ...s.creative.brandIdentity, ...identity } as BrandIdentity,
            },
        })),
        
        setBrandManual: (manual: Partial<BrandManual>) => set((s) => ({
            creative: {
                ...s.creative,
                brandManual: { 
                    ...s.creative.brandManual, 
                    ...manual,
                    updatedAt: new Date().toISOString(),
                } as BrandManual,
            },
        })),
    
    // Ad Groups Management
    addAdGroup: (name: string) => {
        const newGroup: AdGroup = {
            id: `ag_${Date.now()}`,
            name,
            status: 'ACTIVE',
            ads: [],
            createdAt: new Date().toISOString(),
        };
        set((s) => ({
            creative: {
                ...s.creative,
                adGroups: [...(s.creative.adGroups || []), newGroup],
                activeAdGroupId: newGroup.id,
            },
        }));
    },
    
    removeAdGroup: (id: string) => set((s) => ({
        creative: {
            ...s.creative,
            adGroups: (s.creative.adGroups || []).filter(g => g.id !== id),
            activeAdGroupId: s.creative.activeAdGroupId === id 
                ? (s.creative.adGroups || [])[0]?.id 
                : s.creative.activeAdGroupId,
        },
    })),
    
    setActiveAdGroup: (id: string) => set((s) => ({
        creative: { ...s.creative, activeAdGroupId: id },
    })),
    
    addAdToGroup: (groupId: string, ad: Omit<Ad, 'id' | 'createdAt'>) => set((s) => ({
        creative: {
            ...s.creative,
            adGroups: (s.creative.adGroups || []).map(g => 
                g.id === groupId 
                    ? { ...g, ads: [...g.ads, { ...ad, id: `ad_${Date.now()}`, createdAt: new Date().toISOString() }] }
                    : g
            ),
        },
    })),
    
    removeAd: (groupId: string, adId: string) => set((s) => ({
        creative: {
            ...s.creative,
            adGroups: (s.creative.adGroups || []).map(g => 
                g.id === groupId 
                    ? { ...g, ads: g.ads.filter(a => a.id !== adId) }
                    : g
            ),
        },
    })),
    
    updateAd: (groupId: string, adId: string, updates: Partial<Ad>) => set((s) => ({
        creative: {
            ...s.creative,
            adGroups: (s.creative.adGroups || []).map(g => 
                g.id === groupId 
                    ? { ...g, ads: g.ads.map(a => a.id === adId ? { ...a, ...updates } : a) }
                    : g
            ),
        },
    })),
    
    toggleAdStatus: (groupId: string, adId: string) => set((s) => ({
        creative: {
            ...s.creative,
            adGroups: (s.creative.adGroups || []).map(g => 
                g.id === groupId 
                    ? { ...g, ads: g.ads.map(a => a.id === adId ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a) }
                    : g
            ),
        },
    })),
    
    generateAIVariants: async () => {
        const state = get();
        if (!state.creative.aiGenerated?.enabled) return;
        
        const tone = state.creative.aiGenerated?.tone || 'professional';
        const hookStyle = state.creative.aiGenerated?.hookStyle || 'benefit';
        const count = state.creative.aiGenerated?.generateCount || 3;
        
        const hooks: Record<string, string[]> = {
            question: [
                "¿Sabías que el 80% de las empresas fracasan en los primeros 5 años?",
                "¿Qué pasaría si pudieras duplicar tus ventas en 90 días?",
                "¿Estás cometiendo este error común en tu marketing?",
            ],
            statement: [
                "La forma más efectiva de generar leads en 2024",
                "Por qué tu competencia está gastando menos y generando más",
                "El secreto que los grandes marketeros no quieren que sepas",
            ],
            benefit: [
                "Duplica tu ROI con esta estrategia probada",
                "Aumenta tus conversiones en un 300% con estos 3 pasos",
                "Obtén leads cualificados mientras duermes",
            ],
            pain_point: [
                "¿Cansado de invertir en publicidad que no convierte?",
                "El problema que está evitando que tu negocio crezca",
                "Deja de perder dinero en campañas que no funcionan",
            ],
        };
        
        const selectedHooks = hooks[hookStyle] || hooks.benefit;
        const variants: ABTestVariant[] = selectedHooks.slice(0, count).map((hook, i) => ({
            id: `variant_${Date.now()}_${i}`,
            name: `Variante ${i + 1}`,
            primaryText: hook,
            headline: state.creative.headlines[0] || 'Título principal',
            allocation: Math.floor(100 / count),
            isControl: i === 0,
        }));
        
        set((s) => ({ 
            creative: { ...s.creative, abTestVariants: variants },
            abTestConfig: { enabled: true, variants, trafficSplit: 100 },
        }));
    },
    
    analyzePerformance: async () => {
        set({ isAnalyzing: true });
        
        // Simulate analytics analysis
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const analytics: CampaignAnalytics = {
            impressions: Math.floor(Math.random() * 100000) + 10000,
            clicks: Math.floor(Math.random() * 5000) + 500,
            conversions: Math.floor(Math.random() * 200) + 20,
            spend: Math.floor(Math.random() * 2000) + 200,
            cpc: Math.random() * 2 + 0.5,
            cpm: Math.random() * 10 + 5,
            roas: Math.random() * 4 + 1,
            conversionRate: Math.random() * 5 + 1,
            platformData: {
                FACEBOOK_ADS: { impressions: 40000, clicks: 2000, conversions: 80, spend: 800 },
                GOOGLE_ADS: { impressions: 30000, clicks: 1500, conversions: 60, spend: 600 },
                TIKTOK_ADS: { impressions: 20000, clicks: 1000, conversions: 40, spend: 400 },
                LINKEDIN_ADS: { impressions: 10000, clicks: 500, conversions: 20, spend: 200 },
            },
        };
        
        set({ analytics, isAnalyzing: false });
    },
    
    reset: () =>
        set({
            step: 0, // FIX #2: Reset to step 0 (Templates) not step 1
            platforms: [],
            objective: 'LEAD_GENERATION',
            name: '',
            description: '',
            budget: defaultBudget,
            targeting: defaultTargeting,
            creative: defaultCreative,
            validationResults: [],
            isValidating: false,
            launchResults: [],
            isLaunching: false,
            campaignId: undefined,
            smartAllocation: [],
            analytics: undefined,
            abTestConfig: undefined,
        }),
}));
