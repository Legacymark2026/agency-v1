/**
 * gRPC Server Implementation for Isolated DIAN Invoicing Microservice
 * Listens on Port 50052 for high-performance Protocol Buffers (dian_invoicing.proto) RPC calls.
 */
import path from "path";
import crypto from "crypto";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import {
    calculateDianCufe,
    generateDianQrUrl,
    buildDianUbl21Xml,
    calculateNitDv,
    runDianHabilitationTestSet,
    DianInvoicePayload
} from "./dian-engine";

const PROTO_PATH = path.resolve(__dirname, "../proto/dian_invoicing.proto");

export class InvoicingGRPCServer {
    private server: grpc.Server;
    private port: number;

    constructor(port: number = 50052) {
        this.port = port;
        this.server = new grpc.Server();
        this.setupHandlers();
    }

    private setupHandlers() {
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });

        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
        const invoicingProto = protoDescriptor.dian_invoicing;

        this.server.addService(invoicingProto.InvoicingGRPCService.service, {
            GenerateInvoice: async (call: any, callback: any) => {
                try {
                    const req = call.request;
                    const payload: DianInvoicePayload = {
                        documentType: req.document_type || "FACTURA_ELECTRONICA",
                        prefix: req.prefix || "FE",
                        number: req.number || "300001",
                        issueDate: req.issue_date || new Date().toISOString().split("T")[0],
                        issueTime: req.issue_time || "10:00:00-05:00",
                        paymentForm: req.payment_form || "Contado",
                        paymentMethod: req.payment_method || "Transferencia Débito Bancaria",
                        operationType: req.operation_type || "10",
                        technicalKey: req.technical_key || "fc8b05a6315d0ae2041cd135ffd39b5e2c622f0a929db4489dd56dbb9a20c11",
                        environment: req.environment || "2",
                        issuer: {
                            companyName: req.issuer?.company_name || "EMPRESA DEMO S.A.S",
                            tradeName: req.issuer?.trade_name || "EMPRESA DEMO",
                            nit: req.issuer?.nit || "900123456",
                            dv: req.issuer?.dv || "1",
                            taxpayerType: req.issuer?.taxpayer_type || "Persona Jurídica",
                            taxRegime: req.issuer?.tax_regime || "O-48",
                            taxResponsibility: req.issuer?.tax_responsibility || "01 - IVA",
                            economicActivity: req.issuer?.economic_activity || "4711",
                            country: req.issuer?.country || "Colombia",
                            department: req.issuer?.department || "Santander",
                            city: req.issuer?.city || "Bucaramanga",
                            address: req.issuer?.address || "Calle 33 No 11-83",
                            phone: req.issuer?.phone || "3123010693",
                            email: req.issuer?.email || "facturacion@empresa.com",
                        },
                        buyer: {
                            name: req.buyer?.name || "CONSUMIDOR FINAL",
                            documentType: req.buyer?.document_type || "CC",
                            documentNumber: req.buyer?.document_number || "222222222222",
                            taxpayerType: req.buyer?.taxpayer_type || "Persona Natural",
                            taxRegime: req.buyer?.tax_regime || "R-99-PN",
                            taxResponsibility: req.buyer?.tax_responsibility || "ZZ - No aplica",
                            country: req.buyer?.country || "Colombia",
                            department: req.buyer?.department || "Santander",
                            city: req.buyer?.city || "Bucaramanga",
                            address: req.buyer?.address || "Ciudad",
                            phone: req.buyer?.phone || "3000000000",
                            email: req.buyer?.email || "cliente@ejemplo.com",
                        },
                        items: (req.items || []).map((it: any, idx: number) => ({
                            nro: it.nro || idx + 1,
                            code: it.code || "PROD-001",
                            description: it.description || "Producto Generico",
                            unitOfMeasure: it.unit_of_measure || "UND",
                            quantity: Number(it.quantity) || 1,
                            unitPrice: Number(it.unit_price) || 0,
                            discountDetail: Number(it.discount_detail) || 0,
                            surchargeDetail: Number(it.surcharge_detail) || 0,
                            ivaPct: Number(it.iva_pct) || 19,
                            incPct: Number(it.inc_pct) || 0,
                            totalItemValue: Number(it.total_item_value) || 0,
                        })),
                        subtotal: Number(req.subtotal) || 0,
                        taxTotal: Number(req.tax_total) || 0,
                        discountTotal: Number(req.discount_total) || 0,
                        grandTotal: Number(req.grand_total) || 0,
                    };

                    const cufe = calculateDianCufe(payload);
                    const qrUrl = generateDianQrUrl(cufe);
                    const ublXml = buildDianUbl21Xml(payload, cufe);
                    const digitalSigHash = crypto.createHash("sha256").update(ublXml).digest("hex");

                    callback(null, {
                        success: true,
                        cufe,
                        qr_url: qrUrl,
                        ubl_xml: ublXml,
                        issue_date: payload.issueDate,
                        document_number: `${payload.prefix}-${payload.number}`,
                        digital_signature: digitalSigHash,
                        error: "",
                    });
                } catch (err: any) {
                    callback(null, {
                        success: false,
                        cufe: "",
                        qr_url: "",
                        ubl_xml: "",
                        issue_date: "",
                        document_number: "",
                        digital_signature: "",
                        error: err.message || "Error al generar factura gRPC",
                    });
                }
            },

            CalculateCufe: async (call: any, callback: any) => {
                try {
                    const req = call.request;
                    const unhashedStr = `${req.full_number}${req.issue_date}${req.issue_time}${req.val_fac.toFixed(2)}01${req.val_imp_1.toFixed(2)}040.00030.00${req.val_tot.toFixed(2)}${req.nit_ofe}${req.num_adq}${req.technical_key}${req.environment || '2'}`;
                    const cufe = crypto.createHash("sha384").update(unhashedStr).digest("hex");

                    callback(null, {
                        success: true,
                        cufe,
                        algorithm: "SHA-384 Anexo Técnico 1.8 DIAN",
                    });
                } catch (err: any) {
                    callback(err);
                }
            },

            CalculateNitDv: async (call: any, callback: any) => {
                try {
                    const nit = (call.request.nit || "").replace(/[^0-9]/g, "");
                    const dv = calculateNitDv(nit);

                    callback(null, {
                        success: true,
                        nit,
                        dv,
                    });
                } catch (err: any) {
                    callback(err);
                }
            },

            ValidateUblXml: async (call: any, callback: any) => {
                try {
                    const xml = call.request.ubl_xml || "";
                    const isValid = xml.includes("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2") && xml.includes("<cbc:UUID");
                    const lines = (xml.match(/<cac:InvoiceLine>/g) || []).length;

                    callback(null, {
                        is_valid: isValid,
                        ubl_version: "UBL 2.1",
                        line_count: lines,
                        error: isValid ? "" : "Formato XML UBL 2.1 invalido o falta nodo cbc:UUID",
                    });
                } catch (err: any) {
                    callback(null, {
                        is_valid: false,
                        ubl_version: "Desconocido",
                        line_count: 0,
                        error: err.message,
                    });
                }
            },

            RunHabilitationTestSet: async (call: any, callback: any) => {
                try {
                    const req = call.request;
                    const res = runDianHabilitationTestSet(req.test_set_id || "TEST-SET-001", {
                        companyName: req.issuer?.company_name || "DEMO S.A.S",
                        nit: req.issuer?.nit || "900123456",
                        dv: req.issuer?.dv || "1",
                        taxpayerType: "Persona Jurídica",
                        taxRegime: "O-48",
                        taxResponsibility: "01 - IVA",
                        economicActivity: "4711",
                        country: "Colombia",
                        department: "Santander",
                        city: "Bucaramanga",
                        address: "Calle 33",
                        phone: "3000000",
                        email: "demo@ejemplo.com",
                    });

                    callback(null, {
                        success: true,
                        status: res.status,
                        invoices_accepted: res.invoicesAccepted,
                        credit_notes_accepted: res.creditNotesAccepted,
                        debit_notes_accepted: res.debitNotesAccepted,
                        dian_response_msg: res.dianResponseMsg,
                    });
                } catch (err: any) {
                    callback(err);
                }
            },
        });
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.bindAsync(
                `0.0.0.0:${this.port}`,
                grpc.ServerCredentials.createInsecure(),
                (err, boundPort) => {
                    if (err) return reject(err);
                    this.server.start();
                    console.log(`⚡ DIAN Invoicing gRPC Server running on port ${boundPort} (dian_invoicing.proto)`);
                    resolve();
                }
            );
        });
    }

    stop() {
        this.server.forceShutdown();
    }
}
