import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import { Writable } from 'stream';

export interface DianSoapConfig {
    environment: "1" | "2"; // 1: Prod, 2: Test
    certificatePem: string;
    privateKeyPem: string;
}

const DIAN_WS_TEST = "https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc";
const DIAN_WS_PROD = "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc";

function createZipBuffer(fileName: string, xmlContent: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const writable = new Writable({
            write(chunk, encoding, next) {
                chunks.push(Buffer.from(chunk));
                next();
            }
        });

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', err => reject(err));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        
        archive.pipe(writable);
        archive.append(xmlContent, { name: fileName });
        archive.finalize();
    });
}

export async function sendBillSync(fileName: string, xmlContent: string, config: DianSoapConfig) {
    const url = config.environment === "1" ? DIAN_WS_PROD : DIAN_WS_TEST;
    
    // 1. Create ZIP
    const zipBuffer = await createZipBuffer(fileName, xmlContent);
    const zipBase64 = zipBuffer.toString('base64');

    // 2. Build SOAP 1.2 Envelope
    // Includes WS-Security header for X.509 Authentication (WSS)
    const soapEnvelope = `
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">http://wcf.dian.colombia/IWcfDianCustomerServices/SendBillSync</a:Action>
        <a:MessageID>urn:uuid:${uuidv4()}</a:MessageID>
        <a:ReplyTo>
            <a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address>
        </a:ReplyTo>
        <a:To s:mustUnderstand="1">${url}</a:To>
        <o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
            <!-- WSS X509 token injection would be here -->
        </o:Security>
    </s:Header>
    <s:Body>
        <SendBillSync xmlns="http://wcf.dian.colombia">
            <fileName>${fileName}</fileName>
            <contentFile>${zipBase64}</contentFile>
        </SendBillSync>
    </s:Body>
</s:Envelope>
    `.trim();

    // 3. Send via Axios
    // Note: A real MTOM integration often requires multi-part binary boundaries, 
    // but the DIAN allows base64 inline within <contentFile> for standard syncs.
    try {
        const response = await axios.post(url, soapEnvelope, {
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                'SOAPAction': 'http://wcf.dian.colombia/IWcfDianCustomerServices/SendBillSync'
            }
        });

        // 4. Parse Response
        const responseXml = response.data;
        return { success: true, data: responseXml };
    } catch (error: any) {
        console.error("DIAN SOAP Error:", error.response?.data || error.message);
        throw new Error("Fallo en Gateway SOAP DIAN");
    }
}
