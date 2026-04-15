/**
 * lib/ml/audience-clustering.ts
 * ─────────────────────────────────────────────────────────────
 * K-Means Clustering for Predictive Audience Segmentation.
 * 
 * Separa a los Leads o Usuarios de una compañía en grupos (Clústeres)
 * matemáticamente similares basados en comportamientos (ej. RFM: 
 * Recency, Frequency, Monetary Value) u otros metadatos continuos.
 * 
 * Ideal para generar listas "Seed" de alto valor y usar en Meta Lookalikes
 * o Google Similar Audiences.
 */

export interface DataPoint {
    id: string; // The Lead ID or User ID
    features: number[]; // N-dimensional vector (e.g., [Recency(days), Frequency(events), Value($)])
}

export interface ClusterResult {
    clusterIndex: number;
    centroid: number[];
    points: DataPoint[];
}

export class KMeansClustering {

    /**
     * Agrupa una lista de puntos de datos en K clústeres.
     * 
     * @param k El número de clústeres objetivo (ej. 3 para Low, Mid, High value).
     * @param data Los puntos de datos normalizados.
     * @param maxIterations Bloqueo de seguridad para evitar loops infinitos.
     */
    static runClustering(k: number, data: DataPoint[], maxIterations: number = 100): ClusterResult[] {
        if (data.length === 0) return [];
        if (k > data.length) k = data.length;

        const dimensions = data[0].features.length;

        // 1. Inicialización de Centroides de Forgy (Selección aleatoria de K puntos)
        let centroids = this.initializeCentroids(k, data);
        let assignments = new Array(data.length).fill(-1);
        let changed = true;
        let iter = 0;

        while (changed && iter < maxIterations) {
            changed = false;
            iter++;

            // 2. Asignación (Expectation step): Asignar cada punto al centroide más cercano
            for (let i = 0; i < data.length; i++) {
                let nearestIdx = -1;
                let minDistance = Infinity;

                for (let j = 0; j < k; j++) {
                    const dist = this.euclideanDistance(data[i].features, centroids[j]);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestIdx = j;
                    }
                }

                if (assignments[i] !== nearestIdx) {
                    assignments[i] = nearestIdx;
                    changed = true;
                }
            }

            // 3. Actualización de Centroides (Maximization step)
            if (changed) {
                const newCentroids = Array(k).fill(0).map(() => Array(dimensions).fill(0));
                const counts = Array(k).fill(0);

                for (let i = 0; i < data.length; i++) {
                    const clusterIdx = assignments[i];
                    counts[clusterIdx]++;
                    for (let d = 0; d < dimensions; d++) {
                        newCentroids[clusterIdx][d] += data[i].features[d];
                    }
                }

                for (let j = 0; j < k; j++) {
                    if (counts[j] === 0) {
                        // Dead centroid recovery (rare, but mathematically possible)
                        // Assigning a random data point position
                        centroids[j] = [...data[Math.floor(Math.random() * data.length)].features];
                    } else {
                        // Average out
                        for (let d = 0; d < dimensions; d++) {
                            centroids[j][d] = newCentroids[j][d] / counts[j];
                        }
                    }
                }
            }
        }

        console.log(`[ML] K-Means Clustering convergió en ${iter} iteraciones.`);

        // 4. Transformar los resultados en el formato final
        const results: ClusterResult[] = Array(k).fill(0).map((_, idx) => ({
            clusterIndex: idx,
            centroid: centroids[idx],
            points: []
        }));

        for (let i = 0; i < data.length; i++) {
            results[assignments[i]].points.push(data[i]);
        }

        return results;
    }

    private static initializeCentroids(k: number, data: DataPoint[]): number[][] {
        // En un algoritmo maduro usaríamos K-Means++ para la siembra probabilística 
        // alejada (spread out), pero la siembra aleatoria simple funciona bien 
        // para datasets pequeños o medianos de marketing.
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, k).map(d => [...d.features]);
    }

    private static euclideanDistance(a: number[], b: number[]): number {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    /**
     * Utilidad para Normalizar (Min-Max Scala) los vectores n-dimensionales antes
     * de clusterizarlos (Ej. Recencia va de 0-365 días, Monetario va de $0-$500k. 
     * Si no se normaliza, Monetario jalará toda la gravedad del centroide).
     */
    static normalizeData(data: DataPoint[]): DataPoint[] {
        if (data.length === 0) return [];
        const dims = data[0].features.length;
        
        const minMax = Array(dims).fill(0).map(() => ({ min: Infinity, max: -Infinity }));

        // Encontrar Mins/Maxs por dimensión
        for (let i = 0; i < data.length; i++) {
            for (let d = 0; d < dims; d++) {
                const val = data[i].features[d];
                if (val < minMax[d].min) minMax[d].min = val;
                if (val > minMax[d].max) minMax[d].max = val;
            }
        }

        // Aplicar Scala a [0, 1]
        return data.map(d => {
            const normalizedFeatures = [];
            for (let dim = 0; dim < dims; dim++) {
                const span = minMax[dim].max - minMax[dim].min;
                if (span === 0) {
                    normalizedFeatures.push(0); // Dimensión es plana
                } else {
                    normalizedFeatures.push((d.features[dim] - minMax[dim].min) / span);
                }
            }
            return {
                id: d.id,
                features: normalizedFeatures
            };
        });
    }
}
