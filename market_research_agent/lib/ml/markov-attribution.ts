/**
 * lib/ml/markov-attribution.ts
 * ─────────────────────────────────────────────────────────────
 * Modelado de Atribución Multi-Canal usando Cadenas de Markov.
 * 
 * En marketing, el "Último Clic" (Last Click) es inexacto. Un usuario
 * puede ver un anuncio en FB, buscar en Google, interactuar en TikTok
 * y luego comprar porque recibió un Email.
 * 
 * Las Cadenas de Markov calculan la "Probabilidad de Transición" entre
 * canales para descubrir el peso (Removal Effect) de remover un canal
 * específico del ecosistema (El verdadero ROAS).
 */

type Touchpoint = "FB_ADS" | "GOOGLE_ADS" | "TIKTOK_ADS" | "EMAIL" | "DIRECT" | "ORGANIC_SEARCH" | string;
type Path = Touchpoint[];

export interface UserJourney {
    id: string; // Session / Visitor ID
    path: Path; // Cronologia de canales tocados
    converted: boolean; // ¿Compró / Generó Lead?
}

export class MarkovAttributionModel {
    
    /**
     * Calcula el Efecto de Remoción (Removal Effect) global
     * para cada canal en el historial de rutas proporcionado.
     * 
     * @param journeys Historial crudo de visitas de usuarios.
     * @returns Un diccionario con el porcentaje algorítmico de crédito por canal.
     */
    static calculateAttributionWeights(journeys: UserJourney[]): Record<string, number> {
        if (!journeys || journeys.length === 0) return {};

        const START = "(start)";
        const CONVERSION = "(conversion)";
        const NULL = "(null)";

        // 1. Identificar todos los canales únicos
        const channels = new Set<string>();
        journeys.forEach(j => j.path.forEach(p => channels.add(p)));
        const channelArray = Array.from(channels);

        if (channelArray.length === 0) return {};

        // 2. Construir la Matriz de Transiciones (Conteo Crudo)
        // From -> To -> Count
        const transitions: Record<string, Record<string, number>> = {};
        
        const initTransitionMap = (fromNode: string) => {
            if (!transitions[fromNode]) transitions[fromNode] = {};
        };

        journeys.forEach(journey => {
            const path = journey.path;
            const targetNode = journey.converted ? CONVERSION : NULL;

            // Desde START al primer canal
            if (path.length > 0) {
                initTransitionMap(START);
                transitions[START][path[0]] = (transitions[START][path[0]] || 0) + 1;
            } else {
                initTransitionMap(START);
                transitions[START][targetNode] = (transitions[START][targetNode] || 0) + 1;
            }

            // Transiciones intermedias
            for (let i = 0; i < path.length - 1; i++) {
                initTransitionMap(path[i]);
                transitions[path[i]][path[i + 1]] = (transitions[path[i]][path[i + 1]] || 0) + 1;
            }

            // Transición final del último canal al estado Terminal (Conv / Null)
            if (path.length > 0) {
                const lastNode = path[path.length - 1];
                initTransitionMap(lastNode);
                transitions[lastNode][targetNode] = (transitions[lastNode][targetNode] || 0) + 1;
            }
        });

        // 3. Convertir a Probabilidades
        const transitionProbs: Record<string, Record<string, number>> = {};
        for (const [from, tos] of Object.entries(transitions)) {
            const totalOut = Object.values(tos).reduce((sum, val) => sum + val, 0);
            transitionProbs[from] = {};
            for (const [to, count] of Object.entries(tos)) {
                transitionProbs[from][to] = totalOut > 0 ? (count / totalOut) : 0;
            }
        }

        // Cierre de terminales
        transitionProbs[CONVERSION] = { [CONVERSION]: 1.0 };
        transitionProbs[NULL] = { [NULL]: 1.0 };

        // 4. Calcular Probabilidad de Conversión General
        const overallProb = this.calculatePathProbability(
            this.buildTransitionMatrix(channelArray, transitionProbs), 
            channelArray
        );

        if (overallProb === 0) {
            console.warn("[MARKOV] Probabilidad de conversión general es 0. Retornando pesos vacíos.");
            return {};
        }

        // 5. Calcular Removal Effect iterando por cada canal a "apagar"
        const removalEffects: Record<string, number> = {};
        let totalRemovalEffect = 0;

        for (const channelToRemove of channelArray) {
            // Re-ruta todo el tráfico de este canal a (NULL)
            const modifiedProbs = this.cloneProbs(transitionProbs);
            modifiedProbs[channelToRemove] = { [NULL]: 1.0 }; // Si tocas este canal, mueres

            const probWithoutChannel = this.calculatePathProbability(
                this.buildTransitionMatrix(channelArray, modifiedProbs),
                channelArray
            );

            // Efecto de Remoción = % de probabilidad perdida
            const effect = 1 - (probWithoutChannel / overallProb);
            removalEffects[channelToRemove] = Math.max(0, effect);
            totalRemovalEffect += removalEffects[channelToRemove];
        }

        // 6. Normalizar los pesos para que sumen 1 (ó 100%)
        const finalWeights: Record<string, number> = {};
        if (totalRemovalEffect > 0) {
            for (const ch of channelArray) {
                finalWeights[ch] = removalEffects[ch] / totalRemovalEffect;
            }
        }

        return finalWeights;
    }

    // --- Helpers Internos de Álgebra Lineal ---

    private static cloneProbs(probs: Record<string, Record<string, number>>) {
        return JSON.parse(JSON.stringify(probs));
    }

    private static buildTransitionMatrix(channels: string[], probs: Record<string, Record<string, number>>) {
        return probs; // Manteniendolo simple. La matemática dura la manejamos bajo demanda
    }

    /**
     * Calcula la absorción probabilística usando Álgebra de Cadenas de Markov
     * Simplificado para el entorno JS/TS sin librerías pesadas como Numpy.
     */
    private static calculatePathProbability(
        tMatrix: Record<string, Record<string, number>>, 
        channels: string[]
    ): number {
        // En un entorno de producción estricto (Ej. C++ AI Engine), aquí calcularíamos 
        // la matriz fundamental (I - Q)^-1 para estados transitorios.
        // Dado que esto es Typescript de backend, usamos una estimación iterativa 
        // de propagación probabilística hasta un horizonte de 15 saltos (pasos del usuario).

        const MAX_STEPS = 15;
        let stateProbs: Record<string, number> = { "(start)": 1.0 };
        const START = "(start)";
        const CONV = "(conversion)";
        const NULL = "(null)";

        // Initialize zeros
        channels.forEach(ch => stateProbs[ch] = 0);
        stateProbs[CONV] = 0;
        stateProbs[NULL] = 0;

        for (let step = 0; step < MAX_STEPS; step++) {
            const nextStateProbs: Record<string, number> = { ...stateProbs };
            
            // Clear current transient states (not start, not terminal)
            channels.forEach(ch => nextStateProbs[ch] = 0);
            nextStateProbs[START] = 0;

            for (const [fromState, currentProb] of Object.entries(stateProbs)) {
                if (currentProb === 0) continue;
                // Terminal states keep their probability
                if (fromState === CONV || fromState === NULL) continue;

                const transitions = tMatrix[fromState] || {};
                
                for (const [toState, transitionRate] of Object.entries(transitions)) {
                    nextStateProbs[toState] = (nextStateProbs[toState] || 0) + (currentProb * transitionRate);
                }
            }
            stateProbs = nextStateProbs;
        }

        return stateProbs[CONV] || 0;
    }
}
