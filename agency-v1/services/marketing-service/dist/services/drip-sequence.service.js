"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DripSequenceService = void 0;
const database_1 = require("@agency/database");
class DripSequenceService {
    /**
     * Crear secuencia drip
     */
    static async createSequence(companyId, name, trigger, steps) {
        try {
            return await database_1.prisma.dripSequence.create({
                data: {
                    companyId,
                    name,
                    triggerEvent: trigger,
                    steps: {
                        create: steps.map((s, idx) => ({
                            order: idx,
                            delayDays: s.delayDays,
                            subject: s.subject,
                            htmlBody: s.htmlBody,
                            condition: s.condition
                        }))
                    }
                }
            });
        }
        catch (e) {
            console.warn("[DripSequenceService] Fallback - table might not exist", e);
            return null;
        }
    }
    /**
     * Listar secuencias
     */
    static async getSequences(companyId) {
        try {
            return await database_1.prisma.dripSequence.findMany({
                where: { companyId }
            });
        }
        catch (e) {
            return [];
        }
    }
    /**
     * Obtener secuencia
     */
    static async getSequence(sequenceId) {
        try {
            return await database_1.prisma.dripSequence.findUnique({
                where: { id: sequenceId },
                include: { steps: true }
            });
        }
        catch (e) {
            return null;
        }
    }
    /**
     * Agregar paso
     */
    static async addStep(sequenceId, stepData) {
        try {
            return await database_1.prisma.dripSequenceStep.create({
                data: {
                    sequenceId,
                    ...stepData
                }
            });
        }
        catch (e) {
            return null;
        }
    }
    /**
     * Inscribir contacto
     */
    static async enrollContact(sequenceId, email, name) {
        try {
            return await database_1.prisma.dripEnrollment.create({
                data: {
                    sequenceId,
                    email,
                    name,
                    status: 'ACTIVE',
                    currentStep: 0,
                    enrolledAt: new Date()
                }
            });
        }
        catch (e) {
            return null;
        }
    }
    /**
     * Procesar un paso para una inscripción
     */
    static async processSequenceStep(enrollmentId) {
        try {
            const enrollment = await database_1.prisma.dripEnrollment.findUnique({
                where: { id: enrollmentId },
                include: { sequence: { include: { steps: true } } }
            });
            if (!enrollment || enrollment.status !== 'ACTIVE')
                return;
            const steps = enrollment.sequence.steps;
            const currentStep = steps[enrollment.currentStep];
            if (!currentStep) {
                await database_1.prisma.dripEnrollment.update({
                    where: { id: enrollmentId },
                    data: { status: 'COMPLETED' }
                });
                return;
            }
            await database_1.prisma.dripEnrollment.update({
                where: { id: enrollmentId },
                data: { currentStep: enrollment.currentStep + 1 }
            });
        }
        catch (e) {
            console.warn("[processSequenceStep] error", e);
        }
    }
    /**
     * Procesar pasos pendientes (Cron)
     */
    static async processDueSteps() {
        try {
            const enrollments = await database_1.prisma.dripEnrollment.findMany({
                where: { status: 'ACTIVE' }
            });
            for (const enc of enrollments) {
                await this.processSequenceStep(enc.id);
            }
        }
        catch (e) {
            console.warn("[processDueSteps] error", e);
        }
    }
}
exports.DripSequenceService = DripSequenceService;
//# sourceMappingURL=drip-sequence.service.js.map