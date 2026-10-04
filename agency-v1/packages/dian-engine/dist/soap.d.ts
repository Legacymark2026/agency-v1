export interface DianSoapConfig {
    environment: "1" | "2";
    certificatePem: string;
    privateKeyPem: string;
}
export declare function sendBillSync(fileName: string, xmlContent: string, config: DianSoapConfig): Promise<{
    success: boolean;
    data: any;
}>;
