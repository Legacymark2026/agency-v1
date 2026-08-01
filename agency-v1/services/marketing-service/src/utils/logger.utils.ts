export const logInfo = (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || '');
export const logError = (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || '');
export const logWarn = (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || '');
