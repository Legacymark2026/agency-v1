/**
 * High-performance gRPC Invoicing Client for DIAN Electronic Invoicing Microservice
 * Communicates via Protocol Buffers on Port 50052 with graceful HTTP REST fallback.
 */
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = path.resolve(process.cwd(), "../../services/pos-service/proto/dian_invoicing.proto");
const INVOICING_GRPC_HOST = process.env.INVOICING_GRPC_HOST || "localhost:50052";
const POS_SERVICE_HTTP_URL = process.env.POS_SERVICE_URL || "http://localhost:4020";

let clientInstance: any = null;

function getGrpcClient() {
    if (clientInstance) return clientInstance;

    try {
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
        const invoicingProto = protoDescriptor.dian_invoicing;

        clientInstance = new invoicingProto.InvoicingGRPCService(
            INVOICING_GRPC_HOST,
            grpc.credentials.createInsecure()
        );
        return clientInstance;
    } catch (err) {
        console.warn("[gRPC Client] Could not load proto definition, falling back to HTTP REST API:", err);
        return null;
    }
}

export interface GrpcInvoicePayload {
    document_type?: string;
    prefix?: string;
    number?: string;
    issue_date?: string;
    issue_time?: string;
    payment_form?: string;
    payment_method?: string;
    operation_type?: string;
    technical_key?: string;
    environment?: string;
    issuer: any;
    buyer: any;
    items: any[];
    subtotal: number;
    tax_total: number;
    discount_total: number;
    grand_total: number;
}

/**
 * Genera una Factura Electrónica mediante gRPC (o fallback HTTP REST)
 */
export async function generateInvoiceViaGrpc(payload: GrpcInvoicePayload): Promise<any> {
    const client = getGrpcClient();

    if (client) {
        return new Promise((resolve) => {
            const deadline = new Date(Date.now() + 3000); // 3 sec timeout for gRPC
            client.GenerateInvoice(payload, { deadline }, async (err: any, response: any) => {
                if (err || !response || !response.success) {
                    console.warn("[gRPC] Request failed or timed out, executing HTTP REST fallback...", err?.message);
                    resolve(await generateInvoiceViaRestFallback(payload));
                } else {
                    resolve({
                        success: true,
                        protocol: "gRPC (Protobuf :50052)",
                        cufe: response.cufe,
                        qrUrl: response.qr_url,
                        xmlContent: response.ubl_xml,
                        documentNumber: response.document_number,
                        digitalSignature: response.digital_signature,
                        issueDate: response.issue_date,
                    });
                }
            });
        });
    }

    return generateInvoiceViaRestFallback(payload);
}

async function generateInvoiceViaRestFallback(payload: GrpcInvoicePayload): Promise<any> {
    try {
        const res = await fetch(`${POS_SERVICE_HTTP_URL}/api/pos/dian/generate-xml-ubl21`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                documentType: payload.document_type || "FACTURA_ELECTRONICA",
                prefix: payload.prefix || "FE",
                number: payload.number || "300001",
                issueDate: payload.issue_date || new Date().toISOString().split("T")[0],
                issueTime: payload.issue_time || "10:00:00-05:00",
                paymentForm: payload.payment_form || "Contado",
                paymentMethod: payload.payment_method || "Transferencia Débito Bancaria",
                operationType: payload.operation_type || "10",
                technicalKey: payload.technical_key || "fc8b05a6315d0ae2041cd135ffd39b5e2c622f0a929db4489dd56dbb9a20c11",
                environment: payload.environment || "2",
                issuer: payload.issuer,
                buyer: payload.buyer,
                items: payload.items,
                subtotal: payload.subtotal,
                taxTotal: payload.tax_total,
                discountTotal: payload.discount_total,
                grandTotal: payload.grand_total,
            }),
        });

        const data = await res.json();
        return {
            success: true,
            protocol: "HTTP REST (:4020 Fallback)",
            cufe: data.cufe,
            qrUrl: data.qrUrl,
            xmlContent: data.xmlContent,
            documentNumber: `${payload.prefix || 'FE'}-${payload.number || '300001'}`,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Error al comunicarse con el microservicio de facturación DIAN",
        };
    }
}
