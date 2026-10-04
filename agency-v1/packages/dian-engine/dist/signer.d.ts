export interface SignatureConfig {
    p12Buffer: Buffer;
    p12Password: string;
}
/**
 * Signs the UBL 2.1 XML Document using XAdES-EPES standard required by DIAN
 */
export declare function signUBL21(xml: string, config: SignatureConfig): string;
