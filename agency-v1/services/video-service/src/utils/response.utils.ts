export const formatSuccessResponse = (data: any, message = 'Success') => ({ success: true, message, data });
export const formatErrorResponse = (error: any, message = 'Error') => ({ success: false, message, error: error?.message || error });
