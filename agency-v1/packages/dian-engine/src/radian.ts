import { create } from 'xmlbuilder2';
import { generateCUDE } from './cufe';

export interface RadianEventData {
    eventId: "030" | "032" | "033" | "034" | "031"; // Eventos de Título Valor
    originalInvoiceCufe: string;
    originalInvoiceNumber: string;
    issueDate: Date;
    issuer: {
        nit: string;
        name: string;
    };
    receiver: {
        nit: string;
        name: string;
    };
    environment: "1" | "2";
    pin: string; // Software PIN
}

const EVENT_DESCRIPTIONS = {
    "030": "Acuse de recibo de Factura Electrónica de Venta",
    "032": "Recibo del bien y/o prestación del servicio",
    "033": "Aceptación expresa",
    "034": "Aceptación Tácita",
    "031": "Reclamo de la Factura Electrónica de Venta"
};

export function buildRadianApplicationResponse(data: RadianEventData): { xml: string; cude: string } {
    const issueDateStr = data.issueDate.toISOString().split('T')[0];
    const issueTimeStr = data.issueDate.toISOString().split('T')[1].split('.')[0] + "-05:00";

    // Para RADIAN, el CUDE del evento de respuesta usa la misma lógica que el CUFE pero con PIN y sin impuestos
    const cude = generateCUDE(
        data.originalInvoiceNumber + data.eventId, // Composite ID for the event
        issueDateStr,
        issueTimeStr,
        0, "01", 0, "04", 0, "03", 0, 0, // No taxes or totals for events
        data.issuer.nit,
        data.receiver.nit,
        data.pin,
        data.environment
    );

    const root = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('ApplicationResponse', {
            'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2',
            'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
            'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
            'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2'
        })
        .ele('ext:UBLExtensions')
            .ele('ext:UBLExtension')
                .ele('ext:ExtensionContent')
                    .ele('sts:DianExtensions', { 'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1' })
                        .ele('sts:SoftwareProvider')
                            .ele('sts:ProviderID', { schemeAgencyID: "195", schemeID: "4", schemeName: "31" }).txt(data.issuer.nit).up()
                            .ele('sts:SoftwareID', { schemeAgencyID: "195", schemeName: "31" }).txt('SOFTWARE-ID-123').up()
                        .up()
                    .up()
                .up()
            .up()
            .ele('ext:UBLExtension')
                .ele('ext:ExtensionContent').txt('<!-- SIGNATURE_PLACEHOLDER -->').up()
            .up()
        .up()
        .ele('cbc:UBLVersionID').txt('UBL 2.1').up()
        .ele('cbc:CustomizationID').txt('1').up()
        .ele('cbc:ProfileID').txt('DIAN 2.1: ApplicationResponse').up()
        .ele('cbc:ProfileExecutionID').txt(data.environment).up()
        .ele('cbc:ID').txt(data.originalInvoiceNumber + "-" + data.eventId).up()
        .ele('cbc:UUID', { schemeID: data.environment, schemeName: "CUDE-SHA384" }).txt(cude).up()
        .ele('cbc:IssueDate').txt(issueDateStr).up()
        .ele('cbc:IssueTime').txt(issueTimeStr).up()
        
    // Sender Party (The one acknowledging)
    root.ele('cac:SenderParty')
        .ele('cac:PartyTaxScheme')
            .ele('cbc:RegistrationName').txt(data.issuer.name).up()
            .ele('cbc:CompanyID', { schemeAgencyID: "195", schemeID: "1", schemeName: "31" }).txt(data.issuer.nit).up()
        .up()
    .up();

    // Receiver Party (The invoice issuer)
    root.ele('cac:ReceiverParty')
        .ele('cac:PartyTaxScheme')
            .ele('cbc:RegistrationName').txt(data.receiver.name).up()
            .ele('cbc:CompanyID', { schemeAgencyID: "195", schemeID: "1", schemeName: "31" }).txt(data.receiver.nit).up()
        .up()
    .up();

    // Document Response mapping the event to the original invoice
    root.ele('cac:DocumentResponse')
        .ele('cac:Response')
            .ele('cbc:ResponseCode').txt(data.eventId).up()
            .ele('cbc:Description').txt(EVENT_DESCRIPTIONS[data.eventId]).up()
        .up()
        .ele('cac:DocumentReference')
            .ele('cbc:ID').txt(data.originalInvoiceNumber).up()
            .ele('cbc:UUID', { schemeName: "CUFE-SHA384" }).txt(data.originalInvoiceCufe).up()
            .ele('cbc:DocumentTypeCode').txt('01').up() // 01 refers to Factura Electrónica
        .up()
    .up();

    const xml = root.end({ prettyPrint: false });
    return { xml, cude };
}
