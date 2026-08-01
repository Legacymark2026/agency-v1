export declare class DripSequenceService {
    /**
     * Crear secuencia drip
     */
    static createSequence(companyId: string, name: string, trigger: string, steps: any[]): Promise<any>;
    /**
     * Listar secuencias
     */
    static getSequences(companyId: string): Promise<any>;
    /**
     * Obtener secuencia
     */
    static getSequence(sequenceId: string): Promise<any>;
    /**
     * Agregar paso
     */
    static addStep(sequenceId: string, stepData: {
        delayDays: number;
        subject: string;
        htmlBody: string;
        condition?: string;
    }): Promise<any>;
    /**
     * Inscribir contacto
     */
    static enrollContact(sequenceId: string, email: string, name?: string): Promise<any>;
    /**
     * Procesar un paso para una inscripción
     */
    static processSequenceStep(enrollmentId: string): Promise<void>;
    /**
     * Procesar pasos pendientes (Cron)
     */
    static processDueSteps(): Promise<void>;
}
