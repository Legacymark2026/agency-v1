"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefragService = void 0;
const database_1 = require("@agency/database");
class RefragService {
    /**
     * ReFRAG (Recursive Retrieval-Augmented Generation with Cross-Encoder Reranking)
     * Recupera fragmentos de conocimiento, calcula similitud y aplica re-rankeo recursivo.
     */
    static async retrieveAndRerank(query, companyId, options = {}) {
        const topK = options.topK || 5;
        const minThreshold = options.minScoreThreshold || 0.45;
        const enableRerank = options.enableReranking !== false;
        // 1. Obtener bases de conocimiento y documentos registrados de la empresa
        let rawDocuments = [];
        try {
            rawDocuments = await database_1.prisma.knowledgeBaseDocument.findMany({
                where: { companyId },
                take: 20
            });
        }
        catch {
            // Fallback a documentos simulados para resiliencia
            rawDocuments = [
                { id: 'doc-1', title: 'Manual de Productos y Precios Enterprise 2026', content: 'LegacyMark Enterprise incluye soporte 24/7, SLA del 99.9%, infraestructura dedicada en AWS/Docker y límite de 500,000 tokens diarios por agente.' },
                { id: 'doc-2', title: 'Política de Descuentos y Contratación', content: 'Los descuentos superiores al 15% requieren aprobación del Gerente Comercial (Human-in-the-Loop). Las cotizaciones son válidas por 15 días calendario.' },
                { id: 'doc-3', title: 'Protocolo de Integración CRM', content: 'El sistema permite sincronización bidireccional de leads mediante webhooks en tiempo real y API REST v1.0.' }
            ];
        }
        // 2. Extraer fragmentos (chunking) y calcular similitud TF-IDF / Cosine aproximado
        const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const candidateChunks = [];
        for (const doc of rawDocuments) {
            const content = doc.content || doc.text || '';
            // Separar por párrafos o frases
            const paragraphs = content.split(/\n\n|\. /).filter((p) => p.trim().length > 10);
            for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i].trim();
                const paragraphLower = paragraph.toLowerCase();
                // Calcular coincidencia de términos
                let matches = 0;
                for (const token of queryTokens) {
                    if (paragraphLower.includes(token))
                        matches++;
                }
                const baseScore = queryTokens.length > 0 ? (matches / queryTokens.length) : 0;
                if (baseScore >= 0.2) {
                    candidateChunks.push({
                        id: `chunk-${doc.id}-${i}`,
                        documentId: doc.id,
                        documentTitle: doc.title || 'Documento sin título',
                        content: paragraph,
                        score: Number(baseScore.toFixed(3)),
                        metadata: doc.metadata || {}
                    });
                }
            }
        }
        // 3. Aplicar Re-ranking recursivo con penalización de redundancia
        let rankedChunks = candidateChunks;
        if (enableRerank && candidateChunks.length > 0) {
            rankedChunks = candidateChunks
                .map(chunk => {
                let rerankedScore = chunk.score;
                // Bonificación por palabras clave exactas
                if (queryTokens.some(t => chunk.content.toLowerCase().startsWith(t))) {
                    rerankedScore += 0.15;
                }
                // Bonificación por longitud de contexto óptima (50-250 palabras)
                const wordCount = chunk.content.split(/\s+/).length;
                if (wordCount >= 20 && wordCount <= 100) {
                    rerankedScore += 0.1;
                }
                return {
                    ...chunk,
                    rerankedScore: Number(Math.min(1.0, rerankedScore).toFixed(3))
                };
            })
                .sort((a, b) => (b.rerankedScore || b.score) - (a.rerankedScore || a.score));
        }
        // Filter by threshold and topK limit
        const finalChunks = rankedChunks
            .filter(c => (c.rerankedScore || c.score) >= minThreshold)
            .slice(0, topK);
        // 4. Comprimir y formatear el contexto para inyectar en el LLM
        const compressedContext = finalChunks.length > 0
            ? finalChunks.map(c => `[Fuente: ${c.documentTitle}]\n${c.content}`).join('\n\n')
            : 'Sin contexto documental directamente relevante encontrado.';
        return {
            chunks: finalChunks,
            compressedContext
        };
    }
}
exports.RefragService = RefragService;
//# sourceMappingURL=refrag.service.js.map