export declare const formatSuccessResponse: (data: any, message?: string) => {
    success: boolean;
    message: string;
    data: any;
};
export declare const formatErrorResponse: (error: any, message?: string) => {
    success: boolean;
    message: string;
    error: any;
};
