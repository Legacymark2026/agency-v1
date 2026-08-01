export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const sanitizeString = (str: string) => str.replace(/<[^>]*>?/gm, '').trim();
export const validateRequiredFields = (data: any, fields: string[]) => fields.filter(field => !data[field]);
