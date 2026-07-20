/**
 * apps/web/lib/crm/territory-router.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de Gestión de Territorios & Ruteo Geográfico de Oportunidades.
 *
 * Clasifica y asigna automáticamente tratos y prospectos al equipo comercial
 * especializado según el país, región o sector industrial.
 */

export type TerritoryZone = 'LATAM_ANDINA' | 'LATAM_NORTE' | 'NORTH_AMERICA' | 'EUROPE' | 'GLOBAL';

export interface TerritoryRule {
    zone: TerritoryZone;
    countries: string[]; // e.g. ["Colombia", "Ecuador", "Peru"]
    leadRepIds: string[];
    priority: number;
}

export interface TerritoryRoutingResult {
    assignedZone: TerritoryZone;
    matchedCountry: string;
    recommendedRepId?: string;
    routingReason: string;
}

const DEFAULT_RULES: TerritoryRule[] = [
    { zone: 'LATAM_ANDINA', countries: ['Colombia', 'Ecuador', 'Peru', 'Bolivia'], leadRepIds: ['rep-latam-1', 'rep-latam-2'], priority: 1 },
    { zone: 'LATAM_NORTE', countries: ['Mexico', 'Guatemala', 'Costa Rica', 'Panama'], leadRepIds: ['rep-mex-1'], priority: 1 },
    { zone: 'NORTH_AMERICA', countries: ['USA', 'United States', 'Canada'], leadRepIds: ['rep-usa-1'], priority: 1 },
    { zone: 'EUROPE', countries: ['Spain', 'España', 'United Kingdom', 'Germany', 'France'], leadRepIds: ['rep-eu-1'], priority: 1 },
];

export function routeDealToTerritory(country: string, industry?: string): TerritoryRoutingResult {
    if (!country || country.trim().length === 0) {
        return {
            assignedZone: 'GLOBAL',
            matchedCountry: 'Global',
            recommendedRepId: 'rep-global-1',
            routingReason: 'País no especificado. Asignado a la zona Global por defecto.',
        };
    }

    const cleanCountry = country.trim().toLowerCase();

    for (const rule of DEFAULT_RULES) {
        if (rule.countries.some(c => c.toLowerCase() === cleanCountry || cleanCountry.includes(c.toLowerCase()))) {
            return {
                assignedZone: rule.zone,
                matchedCountry: country,
                recommendedRepId: rule.leadRepIds[0],
                routingReason: `Ruteado automáticamente a la zona ${rule.zone} por coincidencia geográfica (${country}).`,
            };
        }
    }

    return {
        assignedZone: 'GLOBAL',
        matchedCountry: country,
        recommendedRepId: 'rep-global-1',
        routingReason: `País (${country}) sin territorio dedicado. Asignado a la zona Global.`,
    };
}
