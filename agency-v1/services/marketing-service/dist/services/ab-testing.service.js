"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbTestingService = void 0;
const database_1 = require("@agency/database");
class AbTestingService {
    /**
     * Dividir una lista de destinatarios para prueba A/B (10% A, 10% B, 80% Pendientes para el ganador)
     */
    static splitRecipientsForAbTest(recipients) {
        if (!recipients || recipients.length === 0) {
            return { sampleA: [], sampleB: [], remaining: [] };
        }
        const total = recipients.length;
        const sampleSize = Math.max(1, Math.floor(total * 0.1));
        const sampleA = recipients.slice(0, sampleSize);
        const sampleB = recipients.slice(sampleSize, sampleSize * 2);
        const remaining = recipients.slice(sampleSize * 2);
        return { sampleA, sampleB, remaining };
    }
    /**
     * Evaluar la métrica de apertura o clics y declarar la variante ganadora
     */
    static async evaluateAbWinner(blastId, metricGoal = "OPENS") {
        const blast = await database_1.prisma.emailBlast.findUnique({
            where: { id: blastId },
            include: { recipients: true }
        });
        if (!blast)
            throw new Error("Campaña no encontrada");
        const recipientsA = blast.recipients.filter((r) => r.variant === "A");
        const recipientsB = blast.recipients.filter((r) => r.variant === "B");
        const opensA = recipientsA.filter((r) => r.openedAt !== null).length;
        const opensB = recipientsB.filter((r) => r.openedAt !== null).length;
        const clicksA = recipientsA.filter((r) => r.clickedAt !== null).length;
        const clicksB = recipientsB.filter((r) => r.clickedAt !== null).length;
        const openRateA = recipientsA.length > 0 ? (opensA / recipientsA.length) * 100 : 0;
        const openRateB = recipientsB.length > 0 ? (opensB / recipientsB.length) * 100 : 0;
        const clickRateA = recipientsA.length > 0 ? (clicksA / recipientsA.length) * 100 : 0;
        const clickRateB = recipientsB.length > 0 ? (clicksB / recipientsB.length) * 100 : 0;
        let winner = "TIE";
        if (metricGoal === "OPENS") {
            if (openRateA > openRateB)
                winner = "A";
            else if (openRateB > openRateA)
                winner = "B";
        }
        else {
            if (clickRateA > clickRateB)
                winner = "A";
            else if (clickRateB > clickRateA)
                winner = "B";
        }
        const winningSubject = winner === "B" ? blast.subjectB || blast.subject : blast.subject;
        return {
            variantA: {
                subject: blast.subject,
                recipientsCount: recipientsA.length,
                opens: opensA,
                clicks: clicksA,
                openRate: Math.round(openRateA * 10) / 10,
                clickRate: Math.round(clickRateA * 10) / 10
            },
            variantB: {
                subject: blast.subjectB || blast.subject,
                recipientsCount: recipientsB.length,
                opens: opensB,
                clicks: clicksB,
                openRate: Math.round(openRateB * 10) / 10,
                clickRate: Math.round(clickRateB * 10) / 10
            },
            winner,
            winningSubject
        };
    }
}
exports.AbTestingService = AbTestingService;
//# sourceMappingURL=ab-testing.service.js.map