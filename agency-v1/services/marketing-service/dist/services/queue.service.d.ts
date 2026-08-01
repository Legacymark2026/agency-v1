export declare class QueueService {
    /**
     * Encolar campaña
     */
    static enqueue(blastId: string, companyId: string, priority?: number, scheduledAt?: Date): Promise<any>;
    /**
     * Desencolar el siguiente
     */
    static dequeueNext(): Promise<any>;
    /**
     * Marcar como completado
     */
    static markCompleted(queueId: string, result: any): Promise<any>;
    /**
     * Marcar como fallido (con retries)
     */
    static markFailed(queueId: string, error: any): Promise<any>;
    /**
     * Estado de la cola
     */
    static getQueueStatus(companyId: string): Promise<any>;
    /**
     * Procesar cola
     */
    static processQueue(baseUrl: string): Promise<void>;
}
