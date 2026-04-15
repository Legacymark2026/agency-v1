'use server';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ValidationError {
    field: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
    platform: string;
}

export interface ValidationResult {
    platform: string;
    valid: boolean;
    errors: ValidationError[];
}

// ─── REGLAS POR PLATAFORMA ────────────────────────────────────────────────────

const PLATFORM_RULES = {
    FACEBOOK_ADS: {
        minDailyBudgetUSD: 1,
        titleMaxChars: 40,
        descriptionMaxChars: 125,
        primaryTextMaxChars: 125,
        image: {
            maxSizeMb: 30,
            supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
            minWidth: 600,
            minHeight: 315,
            // Feed ratio: 1.91:1
        },
        video: {
            maxSizeMb: 4096,
            minDurationSeconds: 1,
            maxDurationSeconds: 240,
        },
    },
    GOOGLE_ADS: {
        minDailyBudgetUSD: 1,
        headlineMaxChars: 30,
        headlineCount: { min: 3, max: 15 },
        descriptionMaxChars: 90,
        descriptionCount: { min: 2, max: 4 },
        image: {
            maxSizeMb: 5,
            supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
        },
        video: {
            minDurationSeconds: 6,
        },
    },
    TIKTOK_ADS: {
        minDailyBudgetUSD: 20,
        adNameMaxChars: 100,
        captionMaxChars: 100,
        image: {
            maxSizeMb: 100,
            supportedFormats: ['jpg', 'jpeg', 'png'],
            aspectRatios: ['1:1', '9:16'],
        },
        video: {
            maxSizeMb: 500,
            minDurationSeconds: 5,
            maxDurationSeconds: 60,
            supportedAspectRatios: ['9:16', '1:1', '16:9'],
        },
    },
    LINKEDIN_ADS: {
        minDailyBudgetUSD: 10,
        introMaxChars: 600,
        headlineMaxChars: 200,
        descriptionMaxChars: 300,
        minCpcBidUSD: 2,
        image: {
            maxSizeMb: 5,
            supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
            minWidth: 400,
        },
        video: {
            maxSizeMb: 200,
            minDurationSeconds: 3,
            maxDurationSeconds: 1800,
        },
    },
};

// ─── VALIDATORS ───────────────────────────────────────────────────────────────

/**
 * Validates a campaign's parameters against the rules of a specific platform.
 * Returns a ValidationResult with any errors or warnings found.
 */
export async function validateCampaignForPlatform(
    platform: string,
    campaignData: {
        budget?: number | null;
        parameters?: Record<string, unknown> | null;
    }
): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const rules = PLATFORM_RULES[platform as keyof typeof PLATFORM_RULES];

    if (!rules) {
        return { platform, valid: true, errors: [] }; // Unknown platform — skip
    }

    const { budget, parameters = {} } = campaignData;
    const params: Record<string, unknown> = (parameters as Record<string, unknown>) ?? {};

    // ── Budget check ──────────────────────────────────────────────────────────
    if (budget !== undefined && budget !== null) {
        if (budget < rules.minDailyBudgetUSD) {
            errors.push({
                field: 'budget',
                message: `El presupuesto diario mínimo para ${platform} es $${rules.minDailyBudgetUSD} USD. Has ingresado $${budget}.`,
                severity: 'ERROR',
                platform,
            });
        }
    }

    // ── Text length checks ────────────────────────────────────────────────────
    if (platform === 'FACEBOOK_ADS') {
        const fbRules = rules as typeof PLATFORM_RULES.FACEBOOK_ADS;
        const title = params.title as string | undefined;
        const description = params.description as string | undefined;

        if (title && title.length > fbRules.titleMaxChars) {
            errors.push({
                field: 'title',
                message: `El título excede ${fbRules.titleMaxChars} caracteres (tiene ${title.length}).`,
                severity: 'ERROR',
                platform,
            });
        }
        if (description && description.length > fbRules.descriptionMaxChars) {
            errors.push({
                field: 'description',
                message: `La descripción excede ${fbRules.descriptionMaxChars} caracteres (tiene ${description.length}).`,
                severity: 'ERROR',
                platform,
            });
        }
    }

    if (platform === 'GOOGLE_ADS') {
        const ggRules = rules as typeof PLATFORM_RULES.GOOGLE_ADS;
        const headlines = (params.headlines as string[]) ?? [];
        const descriptions = (params.descriptions as string[]) ?? [];

        if (headlines.length < ggRules.headlineCount.min) {
            errors.push({
                field: 'headlines',
                message: `Google Ads requiere al menos ${ggRules.headlineCount.min} titulares. Tienes ${headlines.length}.`,
                severity: 'ERROR',
                platform,
            });
        }
        headlines.forEach((h, i) => {
            if (h.length > ggRules.headlineMaxChars) {
                errors.push({
                    field: `headlines[${i}]`,
                    message: `El titular #${i + 1} excede ${ggRules.headlineMaxChars} caracteres.`,
                    severity: 'ERROR',
                    platform,
                });
            }
        });
        if (descriptions.length < ggRules.descriptionCount.min) {
            errors.push({
                field: 'descriptions',
                message: `Google Ads requiere al menos ${ggRules.descriptionCount.min} descripciones.`,
                severity: 'ERROR',
                platform,
            });
        }
    }

    if (platform === 'TIKTOK_ADS') {
        const ttRules = rules as typeof PLATFORM_RULES.TIKTOK_ADS;
        const budget = campaignData.budget ?? 0;
        if (budget < ttRules.minDailyBudgetUSD) {
            errors.push({
                field: 'budget',
                message: `TikTok Ads requiere un presupuesto mínimo de $${ttRules.minDailyBudgetUSD}/día.`,
                severity: 'ERROR',
                platform,
            });
        }
    }

    if (platform === 'LINKEDIN_ADS') {
        const liRules = rules as typeof PLATFORM_RULES.LINKEDIN_ADS;
        const bidAmount = params.bidAmount as number | undefined;
        if (bidAmount && bidAmount < liRules.minCpcBidUSD) {
            errors.push({
                field: 'bidAmount',
                message: `LinkedIn requiere una puja CPC mínima de $${liRules.minCpcBidUSD}. Has ingresado $${bidAmount}.`,
                severity: 'ERROR',
                platform,
            });
        }
    }

    // ── General: objective required ───────────────────────────────────────────
    if (!params.objective) {
        errors.push({
            field: 'objective',
            message: `Debes especificar el objetivo de la campaña para ${platform}.`,
            severity: 'ERROR',
            platform,
        });
    }

    return {
        platform,
        valid: errors.filter(e => e.severity === 'ERROR').length === 0,
        errors,
    };
}

/**
 * Validates a campaign against ALL its target platforms.
 * The campaign's `platform` field can be a comma-separated list.
 */
export async function validateCampaignAllPlatforms(campaignData: {
    platform: string;
    budget?: number | null;
    parameters?: Record<string, unknown> | null;
}): Promise<ValidationResult[]> {
    const platforms = campaignData.platform.split(',').map(p => p.trim());

    return Promise.all(
        platforms.map(platform =>
            validateCampaignForPlatform(platform, campaignData)
        )
    );
}
