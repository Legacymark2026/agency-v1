export declare const formatSuccessResponse: (data: any, message?: string) => {
    success: boolean;
    message: string;
    data: any;
};
export declare const formatErrorResponse: (error: string, statusCode?: number) => {
    success: boolean;
    error: string;
    statusCode: number;
};
