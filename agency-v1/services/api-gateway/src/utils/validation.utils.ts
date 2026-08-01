export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
  return str.replace(/<[^>]*>?/gm, '').trim();
};

export const validateRequiredFields = (data: any, fields: string[]): string[] => {
  return fields.filter(field => !data[field]);
};
