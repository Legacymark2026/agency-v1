import { prisma } from "@agency/database";

export class DripSequenceService {
  /**
   * Crear secuencia drip
   */
  static async createSequence(companyId: string, name: string, trigger: string, steps: any[]) {
      try {
          return await (prisma as any).dripSequence.create({
              data: {
                  companyId,
                  name,
                  triggerEvent: trigger,
                  steps: {
                      create: steps.map((s: any, idx: number) => ({
                          order: idx,
                          delayDays: s.delayDays,
                          subject: s.subject,
                          htmlBody: s.htmlBody,
                          condition: s.condition
                      }))
                  }
              }
          });
      } catch (e) {
          console.warn("[DripSequenceService] Fallback - table might not exist", e);
          return null;
      }
  }

  /**
   * Listar secuencias
   */
  static async getSequences(companyId: string) {
      try {
          return await (prisma as any).dripSequence.findMany({
              where: { companyId }
          });
      } catch (e) {
          return [];
      }
  }

  /**
   * Obtener secuencia
   */
  static async getSequence(sequenceId: string) {
      try {
          return await (prisma as any).dripSequence.findUnique({
              where: { id: sequenceId },
              include: { steps: true }
          });
      } catch (e) {
          return null;
      }
  }

  /**
   * Agregar paso
   */
  static async addStep(sequenceId: string, stepData: { delayDays: number; subject: string; htmlBody: string; condition?: string }) {
      try {
          return await (prisma as any).dripSequenceStep.create({
              data: {
                  sequenceId,
                  ...stepData
              }
          });
      } catch (e) {
          return null;
      }
  }

  /**
   * Inscribir contacto
   */
  static async enrollContact(sequenceId: string, email: string, name?: string) {
      try {
          return await (prisma as any).dripEnrollment.create({
              data: {
                  sequenceId,
                  email,
                  name,
                  status: 'ACTIVE',
                  currentStep: 0,
                  enrolledAt: new Date()
              }
          });
      } catch (e) {
          return null;
      }
  }

  /**
   * Procesar un paso para una inscripción
   */
  static async processSequenceStep(enrollmentId: string) {
      try {
          const enrollment = await (prisma as any).dripEnrollment.findUnique({
              where: { id: enrollmentId },
              include: { sequence: { include: { steps: true } } }
          });

          if (!enrollment || enrollment.status !== 'ACTIVE') return;

          const steps = enrollment.sequence.steps;
          const currentStep = steps[enrollment.currentStep];
          
          if (!currentStep) {
              await (prisma as any).dripEnrollment.update({
                  where: { id: enrollmentId },
                  data: { status: 'COMPLETED' }
              });
              return;
          }
          
          await (prisma as any).dripEnrollment.update({
              where: { id: enrollmentId },
              data: { currentStep: enrollment.currentStep + 1 }
          });

      } catch (e) {
          console.warn("[processSequenceStep] error", e);
      }
  }

  /**
   * Procesar pasos pendientes (Cron)
   */
  static async processDueSteps() {
      try {
          const enrollments = await (prisma as any).dripEnrollment.findMany({
              where: { status: 'ACTIVE' }
          });

          for (const enc of enrollments) {
              await this.processSequenceStep(enc.id);
          }
      } catch (e) {
          console.warn("[processDueSteps] error", e);
      }
  }
}
