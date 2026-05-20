/**
 * Database Interface - Injected from main app
 * El paquete video-agent no importa prisma directamente.
 * La app principal (apps/web) inyecta el cliente de BD.
 */
let dbInstance = null;
export function initDatabase(db) {
    dbInstance = db;
}
export function getDatabase() {
    return dbInstance;
}
export function hasDatabase() {
    return dbInstance !== null;
}
export default {
    initDatabase,
    getDatabase,
    hasDatabase
};
