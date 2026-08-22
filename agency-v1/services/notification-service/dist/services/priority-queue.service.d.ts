export declare class PriorityQueueService {
    private static redis;
    private static getRedisClient;
    /**
     * Encola una notificación en una cola con prioridad.
     * Mensajes HIGH prioridad van a una cola preferente procesada antes que la cola LOW.
     */
    static enqueueNotification(payload: any, priority?: "HIGH" | "LOW"): Promise<{
        success: boolean;
        queueName: string;
        priority: "HIGH" | "LOW";
        messageId: any;
        status: string;
    }>;
}
//# sourceMappingURL=priority-queue.service.d.ts.map