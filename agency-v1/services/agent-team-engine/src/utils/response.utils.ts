export const formatSuccessResponse = (data: any, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

export const formatErrorResponse = (error: string | Error, statusCode = 500) => {
  return {
    success: false,
    message: error instanceof Error ? error.message : error,
    statusCode,
  };
};
