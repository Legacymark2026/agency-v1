/**
 * lib/ml/mab-optimizer.ts
 * ─────────────────────────────────────────────────────────────
 * Multi-Armed Bandit (MAB) Algorithm using Thompson Sampling.
 * 
 * Este algoritmo toma decisiones dinámicas sobre qué variante (brazo) de 
 * un A/B test mostrar, balanceando "Exploración" (probar variantes nuevas) 
 * y "Explotación" (mostrar la variante que mejor está convirtiendo).
 */

export interface VariantStats {
    id: string;
    impressions: number; // Intentos (Trials)
    conversions: number; // Éxitos (Successes)
}

/**
 * Muestrea un valor de una distribución Beta(alpha, beta).
 * Utiliza una aproximación matemática para generar la muestra aleatoria.
 * 
 * Alpha = Conversiones + 1 (Prior pseudo-counts)
 * Beta = (Impresiones - Conversiones) + 1
 */
function sampleBeta(alpha: number, beta: number): number {
    // Generador de variables aleatorias Gamma (necesario para Beta)
    const ry = (a: number): number => {
        let d = a - 1 / 3;
        let c = 1 / Math.sqrt(9 * d);
        let x, v, u;
        while (true) {
            do {
                x = normalRandom();
                v = 1 + c * x;
            } while (v <= 0);
            v = v * v * v;
            u = Math.random();
            if (u < 1 - 0.0331 * x * x * x * x) return d * v;
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
        }
    };

    const normalRandom = (): number => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    let x = alpha > 1 ? ry(alpha) : ry(alpha + 1) * Math.pow(Math.random(), 1 / alpha);
    let y = beta > 1 ? ry(beta) : ry(beta + 1) * Math.pow(Math.random(), 1 / beta);
    return x / (x + y);
}

export class MABOptimizer {
    /**
     * Thompson Sampling: Elige la variante con la mayor probabilidad de éxito inferida.
     * 
     * @param variants Lista de variantes con sus estadísticas actuales.
     * @returns El ID de la variante ganadora para esta impresión específica.
     */
    static getWinningVariant(variants: VariantStats[]): string {
        if (!variants || variants.length === 0) {
            throw new Error("MABOptimizer requiere al menos una variante.");
        }

        let maxSample = -1;
        let selectedVariantId = variants[0].id;

        for (const variant of variants) {
            // Prevención de datos corruptos
            const success = Math.max(0, variant.conversions);
            const failures = Math.max(0, variant.impressions - success);

            // Prior Beta(1,1) -> Uniform distribution for brand new variants
            const alpha = success + 1;
            const beta = failures + 1;

            const sample = sampleBeta(alpha, beta);

            if (sample > maxSample) {
                maxSample = sample;
                selectedVariantId = variant.id;
            }
        }

        return selectedVariantId;
    }
}
