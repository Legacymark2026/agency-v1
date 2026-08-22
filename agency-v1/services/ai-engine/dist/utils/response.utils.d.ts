export declare const formatSuccessResponse: (data: any, message?: string) => {
    success: boolean;
    message: string;
    data: any;
};
export declare const formatErrorResponse: (error: string | Error, statusCode?: number) => {
    success: boolean;
    message: string;
    statusCode: number;
};
