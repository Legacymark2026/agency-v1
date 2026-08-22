export interface DispatchNotificationInput {
    userId: string;
    companyId?: string;
    type: string;
    title: string;
    body: string;
    channel?: "IN_APP" | "EMAIL" | "PUSH";
    metadata?: any;
}
export declare class NotificationService {
    /**
     * Obtener notificaciones del usuario
     */
    static getUserNotifications(userId: string, unreadOnly?: boolean, limit?: number): Promise<any>;
    /**
     * Enviar notificación con transacción atómica
     */
    static dispatchNotification(input: DispatchNotificationInput): Promise<any>;
}
//# sourceMappingURL=notification.service.d.ts.map