export const logInfo = (message: string, context?: any) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context || '');
};

export const logError = (message: string, error?: any) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
};

export const logWarn = (message: string, context?: any) => {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context || '');
};
