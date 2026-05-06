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

let dbInstance: VideoDbInterface | null = null;

export function initDatabase(db: VideoDbInterface): void {
  dbInstance = db;
}

export function getDatabase(): VideoDbInterface | null {
  return dbInstance;
}

export function hasDatabase(): boolean {
  return dbInstance !== null;
}

export default {
  initDatabase,
  getDatabase,
  hasDatabase
};