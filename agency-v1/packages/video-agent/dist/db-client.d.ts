/**
 * Database Interface - Injected from main app
 * El paquete video-agent no importa prisma directamente.
 * La app principal (apps/web) inyecta el cliente de BD.
 */
export interface VideoDbInterface {
    integrationConfig: {
        findUnique: (args: any) => Promise<any>;
        upsert: (args: any) => Promise<any>;
    };
    externalAsset: {
        create: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any>;
        findUnique: (args: any) => Promise<any>;
    };
    synthesisAudit: {
        create: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any>;
    };
    creditTransaction: {
        create: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any>;
    };
    [key: string]: any;
}
export declare function initDatabase(db: VideoDbInterface): void;
export declare function getDatabase(): VideoDbInterface | null;
export declare function hasDatabase(): boolean;
declare const _default: {
    initDatabase: typeof initDatabase;
    getDatabase: typeof getDatabase;
    hasDatabase: typeof hasDatabase;
};
export default _default;
