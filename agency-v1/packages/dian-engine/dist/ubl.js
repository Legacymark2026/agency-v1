"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUBL21Invoice = buildUBL21Invoice;
const xmlbuilder2_1 = require("xmlbuilder2");
const cufe_1 = require("./cufe");
function buildUBL21Invoice(data) {
    // 1. Compute CUFE
    const issueDateStr = data.issueDate.toISOString().split('T')[0];
    const issueTimeStr = data.issueDate.toISOString().split('T')[1].split('.')[0] + "-05:00"; // Assuming COT
    const cufe = (0, cufe_1.generateCUFE)(data.invoiceNumber, issueDateStr, issueTimeStr, data.subtotal, "01", data.taxes.iva, // IVA
    "04", data.taxes.inc, // INC
    "03", data.taxes.ica, // ICA
    data.totalAmount, data.issuer.nit, data.customer.nit, data.issuer.technicalKey, data.environment);
    // 2. Build Canonical XML (DIAN Anexo 1.9)
    const root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
        .ele('Invoice', {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2'
    })
        .ele('ext:UBLExtensions')
        .ele('ext:UBLExtension')
        .ele('ext:ExtensionContent')
        .ele('sts:DianExtensions', { 'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1' })
        .ele('sts:InvoiceControl')
        .ele('sts:InvoiceAuthorization').txt('18760000001').up()
        .ele('sts:AuthorizationPeriod')
        .ele('cbc:StartDate').txt('2023-01-01').up()
        .ele('cbc:EndDate').txt('2025-01-01').up()
        .up()
        .up()
        .ele('sts:SoftwareProvider')
        .ele('sts:ProviderID', { schemeAgencyID: "195", schemeID: "4", schemeName: "31" }).txt(data.issuer.nit).up()
        .ele('sts:SoftwareID', { schemeAgencyID: "195", schemeName: "31" }).txt('SOFTWARE-ID-123').up()
        .up()
        .ele('sts:SoftwareSecurityCode', { schemeAgencyID: "195", schemeName: "31" }).txt('HASH-SOFTWARE-SECURITY-CODE').up()
        .up()
        .up()
        .up()
        // Here goes the Digital Signature Extension (XAdES-EPES)
        .ele('ext:UBLExtension')
        .ele('ext:ExtensionContent').txt('<!-- SIGNATURE_PLACEHOLDER -->').up()
        .up()
        .up()
        .ele('cbc:UBLVersionID').txt('UBL 2.1').up()
        .ele('cbc:CustomizationID').txt('10').up()
        .ele('cbc:ProfileID').txt('DIAN 2.1: Factura Electrónica de Venta').up()
        .ele('cbc:ProfileExecutionID').txt(data.environment).up()
        .ele('cbc:ID').txt(data.invoiceNumber).up()
        .ele('cbc:UUID', { schemeID: data.environment, schemeName: "CUFE-SHA384" }).txt(cufe).up()
        .ele('cbc:IssueDate').txt(issueDateStr).up()
        .ele('cbc:IssueTime').txt(issueTimeStr).up()
        .ele('cbc:InvoiceTypeCode').txt('01').up()
        .ele('cbc:DocumentCurrencyCode').txt('COP').up();
    // Add Accounting Supplier Party (Issuer)
    root.ele('cac:AccountingSupplierParty')
        .ele('cbc:AdditionalAccountID').txt('1').up()
        .ele('cac:Party')
        .ele('cac:PartyName')
        .ele('cbc:Name').txt(data.issuer.name).up()
        .up()
        .ele('cac:PartyTaxScheme')
        .ele('cbc:RegistrationName').txt(data.issuer.name).up()
        .ele('cbc:CompanyID', { schemeAgencyID: "195", schemeID: "1", schemeName: "31" }).txt(data.issuer.nit).up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID').txt('01').up()
        .ele('cbc:Name').txt('IVA').up()
        .up()
        .up()
        .up()
        .up();
    // Add Accounting Customer Party
    root.ele('cac:AccountingCustomerParty')
        .ele('cac:Party')
        .ele('cac:PartyTaxScheme')
        .ele('cbc:RegistrationName').txt(data.customer.name).up()
        .ele('cbc:CompanyID', { schemeAgencyID: "195", schemeID: "1", schemeName: "31" }).txt(data.customer.nit).up()
        .up()
        .up()
        .up();
    // Legal Monetary Total
    root.ele('cac:LegalMonetaryTotal')
        .ele('cbc:LineExtensionAmount', { currencyID: 'COP' }).txt(data.subtotal.toFixed(2)).up()
        .ele('cbc:TaxExclusiveAmount', { currencyID: 'COP' }).txt(data.subtotal.toFixed(2)).up()
        .ele('cbc:TaxInclusiveAmount', { currencyID: 'COP' }).txt(data.totalAmount.toFixed(2)).up()
        .ele('cbc:PayableAmount', { currencyID: 'COP' }).txt(data.totalAmount.toFixed(2)).up()
        .up();
    // Add 1 Line Item for schema satisfaction
    root.ele('cac:InvoiceLine')
        .ele('cbc:ID').txt('1').up()
        .ele('cbc:InvoicedQuantity', { unitCode: 'EA' }).txt('1').up()
        .ele('cbc:LineExtensionAmount', { currencyID: 'COP' }).txt(data.subtotal.toFixed(2)).up()
        .ele('cac:Item')
        .ele('cbc:Description').txt('Servicios de Agencia').up()
        .up()
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: 'COP' }).txt(data.subtotal.toFixed(2)).up()
        .up()
        .up();
    const xml = root.end({ prettyPrint: false });
    return { xml, cufe };
}
