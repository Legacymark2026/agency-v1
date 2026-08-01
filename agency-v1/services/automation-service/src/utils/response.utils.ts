export const formatSuccessResponse = (data: any, message = 'Success') => ({
  success: true,
  message,
  data
});

export const formatErrorResponse = (error: string, statusCode = 500) => ({
  success: false,
  error,
  statusCode
});
