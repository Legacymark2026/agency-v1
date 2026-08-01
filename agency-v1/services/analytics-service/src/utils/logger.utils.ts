export const logInfo = (message: string, meta?: any) => {
  console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
};

export const logError = (message: string, error?: any) => {
  console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), error }));
};

export const logWarn = (message: string, meta?: any) => {
  console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
};
