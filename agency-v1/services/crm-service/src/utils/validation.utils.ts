export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

export const validateRequiredFields = (data: any, fields: string[]): string[] => {
  const missingFields: string[] = [];
  for (const field of fields) {
    if (!data[field]) {
      missingFields.push(field);
    }
  }
  return missingFields;
};
