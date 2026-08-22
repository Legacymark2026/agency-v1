/**
 * services/notification-service/src/repositories/notification.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification Repository Implementation
 */
export interface NotificationEntity {
    id: string;
    userId: string;
    companyId?: string | null;
    title: string;
    message?: string | null;
    type?: string | null;
    isRead: boolean;
    data?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface INotificationRepository {
    findMany(params: {
        where: any;
        orderBy?: any;
        take?: number;
        skip?: number;
    }): Promise<NotificationEntity[]>;
    count(where: any): Promise<number>;
    createMany(data: Array<{
        userId: string;
        companyId: string;
        title: string;
        message: string;
        type: string;
        isRead: boolean;
        data?: string;
    }>): Promise<{
        count: number;
    }>;
    updateMany(params: {
        where: any;
        data: any;
    }): Promise<{
        count: number;
    }>;
    deleteMany(params: {
        where: any;
    }): Promise<{
        count: number;
    }>;
}
export declare class PrismaNotificationRepository implements INotificationRepository {
    findMany(params: {
        where: any;
        orderBy?: any;
        take?: number;
        skip?: number;
    }): Promise<NotificationEntity[]>;
    count(where: any): Promise<number>;
    createMany(data: Array<{
        userId: string;
        companyId: string;
        title: string;
        message: string;
        type: string;
        isRead: boolean;
        data?: string;
    }>): Promise<{
        count: number;
    }>;
    updateMany(params: {
        where: any;
        data: any;
    }): Promise<{
        count: number;
    }>;
    deleteMany(params: {
        where: any;
    }): Promise<{
        count: number;
    }>;
}
export declare const notificationRepository: PrismaNotificationRepository;
//# sourceMappingURL=notification.repository.d.ts.map