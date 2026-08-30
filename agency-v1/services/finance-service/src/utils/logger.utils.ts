export const logInfo = (message: string, context?: any) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context || '');
};

export const logError = (message: string, error?: any) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
};

export const logWarn = (message: string, context?: any) => {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context || '');
};

/** Structured logger object — use this in new route files */
export const logger = {
  info: (message: string, context?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", message, timestamp: new Date().toISOString(), ...context })),
  warn: (message: string, context?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", message, timestamp: new Date().toISOString(), ...context })),
  error: (message: string, context?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", message, timestamp: new Date().toISOString(), ...context })),
};
