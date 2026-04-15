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
}

export interface WizardCreative {
    headline?: string; // Legacy
    description?: string; // Legacy
    primaryText?: string; // Legacy
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
    reset: () => void;
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
};

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useCampaignWizard = create<WizardState>((set) => ({
    step: 1,
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

    setStep: (step) => set({ step }),
    nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6) })),
    prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
    setPlatforms: (platforms) => set({ platforms }),
    setObjective: (objective) => set({ objective }),
    setName: (name) => set({ name }),
    setDescription: (description) => set({ description }),
    setBudget: (budget) => set((s) => ({ budget: { ...s.budget, ...budget } })),
    setDates: (startDate, endDate) => set({ startDate, endDate }),
    setTargeting: (targeting) => set((s) => ({ targeting: { ...s.targeting, ...targeting } })),
    setCreative: (creative) => set((s) => ({ creative: { ...s.creative, ...creative } })),
    addAssetUrl: (url) =>
        set((s) => ({ creative: { ...s.creative, assetUrls: [...s.creative.assetUrls, url] } })),
    removeAssetUrl: (url) =>
        set((s) => ({
            creative: { ...s.creative, assetUrls: s.creative.assetUrls.filter((u) => u !== url) },
        })),
    setValidationResults: (validationResults) => set({ validationResults }),
    setIsValidating: (isValidating) => set({ isValidating }),
    setLaunchResults: (launchResults) => set({ launchResults }),
    setIsLaunching: (isLaunching) => set({ isLaunching }),
    setCampaignId: (campaignId) => set({ campaignId }),
    reset: () =>
        set({
            step: 1,
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
        }),
}));
