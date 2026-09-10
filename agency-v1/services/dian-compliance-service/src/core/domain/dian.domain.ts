/**
 * DIAN Compliance Domain Models & Algorithms (Hexagonal 5.0 Core)
 * Pure domain rules: CUFE SHA-384, CUNE, CUDS, UBL 2.1 XML Generator, QR, RADIAN
 */
import crypto from "crypto";

export interface DianDocumentProps {
  id: string;
  companyId: string;
  documentType: "INVOICE" | "POS_EQUIVALENT" | "PAYROLL" | "SUPPORT_DOCUMENT";
  documentNumber: string;
  prefix?: string;
  cufe?: string;
  qrCode?: string;
  xmlContent?: string;
  dianStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "QUEUED";
  dianResponse?: any;
  totalAmount: number;
  taxAmount: number;
  receiverNit: string;
  receiverName: string;
  issuedAt: Date;
  sentAt?: Date;
  validatedAt?: Date;
}

export interface DianResolutionProps {
  id: string;
  companyId: string;
  resolutionNumber: string;
  prefix: string;
  fromNumber: number;
  toNumber: number;
  currentNumber: number;
  validFrom: Date;
  validTo: Date;
  technicalKey?: string;
  isActive: boolean;
}

export type RadianEventCode = "030" | "031" | "032" | "033" | "034";
// 030: Acuse de recibo de Factura Electrónica
// 031: Reclamo de la Factura
// 032: Recibo del bien o prestación del servicio
// 033: Aceptación expresa
// 034: Aceptación tácita

export class DianAlgorithms {
  /**
   * Generates DIAN CUFE SHA-384
   * Formula: NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 + ValImp2 + CodImp3 + ValImp3 + ValTot + NitOfe + NumAdq + ClTec + TipoAmb
   */
  static generateCUFE(params: {
    invoiceNumber: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm:ss-05:00
    subtotal: number;
    vatAmount: number;
    total: number;
    emitterNit: string;
    receiverNit: string;
    technicalKey: string;
    environment?: "1" | "2"; // 1: Prod, 2: Test
  }): string {
    const rawString = [
      params.invoiceNumber,
      params.date,
      params.time,
      params.subtotal.toFixed(2),
      "01",
      params.vatAmount.toFixed(2),
      "04",
      "0.00",
      "03",
      "0.00",
      params.total.toFixed(2),
      params.emitterNit,
      params.receiverNit,
      params.technicalKey,
      params.environment || "2",
    ].join("");

    return crypto.createHash("sha384").update(rawString).digest("hex");
  }

  /**
   * Generates DIAN CUNE for Electronic Payroll
   */
  static generateCUNE(params: {
    payrollNumber: string;
    date: string;
    earnings: number;
    deductions: number;
    netPay: number;
    employeeNit: string;
    employerNit: string;
    pin: string;
  }): string {
    const raw = [
      params.payrollNumber,
      params.date,
      params.earnings.toFixed(2),
      params.deductions.toFixed(2),
      params.netPay.toFixed(2),
      params.employeeNit,
      params.employerNit,
      params.pin,
    ].join("");
    return crypto.createHash("sha384").update(raw).digest("hex");
  }

  /**
   * Generates standard DIAN QR Code URL
   */
  static generateQrUrl(cufe: string, invoiceNumber: string, emitterNit: string, receiverNit: string, total: number, date: string): string {
    return `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}&numfac=${invoiceNumber}&nitfac=${emitterNit}&nitcom=${receiverNit}&valfac=${total.toFixed(2)}&fecfac=${date}`;
  }

  /**
   * Builds canonical UBL 2.1 XML structure
   */
  static buildUbl21Xml(params: {
    cufe: string;
    invoiceNumber: string;
    date: string;
    time: string;
    emitterNit: string;
    emitterName: string;
    receiverNit: string;
    receiverName: string;
    subtotal: number;
    vatAmount: number;
    total: number;
    items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
  }): string {
    const itemsXml = params.items
      .map(
        (item, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="COP">${item.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${item.name}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="COP">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ID>${params.invoiceNumber}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${params.cufe}</cbc:UUID>
  <cbc:IssueDate>${params.date}</cbc:IssueDate>
  <cbc:IssueTime>${params.time}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${params.emitterName}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195">${params.emitterNit}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${params.receiverName}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195">${params.receiverNit}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${params.vatAmount.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${params.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${params.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${params.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${params.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${itemsXml}
</Invoice>`;
  }
}
