import crypto from "crypto";

export interface DianInvoiceDataInput {
    invoiceNumber: string;
    prefix: string;
    issueDate: string; // YYYY-MM-DD
    issueTime: string; // HH:mm:ss-05:00
    technicalKey: string;
    environment: "1" | "2"; // 1 = Prod, 2 = Pruebas
    seller: {
        nit: string;
        dv: string;
        name: string;
        email: string;
        address: string;
        cityCode: string;
    };
    buyer: {
        docType: string; // 31 = NIT, 13 = CC
        docNumber: string;
        dv?: string;
        name: string;
        email: string;
        address: string;
        cityCode: string;
    };
    items: {
        code: string;
        unspscCode: string;
        name: string;
        quantity: number;
        price: number;
        vatRate: number; // 19, 5, 0
    }[];
}

export function calculateRealDianCufe(rawString: string): string {
    return crypto.createHash("sha384").update(rawString).digest("hex");
}

export function buildRealDianUblXml(data: DianInvoiceDataInput): {
    xml: string;
    cufe: string;
    qrText: string;
    subtotal: number;
    vatTotal: number;
    total: number;
} {
    let subtotal = 0;
    let vatTotal = 0;

    const itemsXml = data.items.map((item, idx) => {
        const itemLineTotal = item.quantity * item.price;
        const itemVat = Math.round(itemLineTotal * (item.vatRate / 100));
        subtotal += itemLineTotal;
        vatTotal += itemVat;

        return `
    <cac:InvoiceLine>
        <cbc:ID>${idx + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="EA">${item.quantity.toFixed(2)}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="COP">${itemLineTotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="COP">${itemVat.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="COP">${itemLineTotal.toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="COP">${itemVat.toFixed(2)}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>${item.vatRate.toFixed(2)}</cbc:Percent>
                    <cac:TaxScheme>
                        <cbc:ID>01</cbc:ID>
                        <cbc:Name>IVA</cbc:Name>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Description>${item.name}</cbc:Description>
            <cac:SellersItemIdentification>
                <cbc:ID>${item.code}</cbc:ID>
            </cac:SellersItemIdentification>
            <cac:StandardItemIdentification>
                <cbc:ID schemeID="999">${item.unspscCode}</cbc:ID>
            </cac:StandardItemIdentification>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="COP">${item.price.toFixed(2)}</cbc:PriceAmount>
            <cbc:BaseQuantity unitCode="EA">1.00</cbc:BaseQuantity>
        </cac:Price>
    </cac:InvoiceLine>`;
    }).join("");

    const total = subtotal + vatTotal;

    // Real SHA-384 CUFE calculation
    const rawCufeInput = `${data.invoiceNumber}${data.issueDate}${data.issueTime}${subtotal.toFixed(2)}01${vatTotal.toFixed(2)}040.00030.00${total.toFixed(2)}${data.seller.nit}${data.buyer.docNumber}${data.technicalKey}${data.environment}`;
    const cufe = calculateRealDianCufe(rawCufeInput);

    const qrText = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}&NroFactura=${data.invoiceNumber}&NitFacturador=${data.seller.nit}&NitAdquirente=${data.buyer.docNumber}&ValorTotal=${total.toFixed(2)}&ValorIva=${vatTotal.toFixed(2)}`;

    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:sts="dian:gov:co:facturaelectronica:Structures-2">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent>
                <sts:DianExtensions>
                    <sts:InvoiceControl>
                        <sts:InvoiceAuthorization>18760000001</sts:InvoiceAuthorization>
                        <sts:AuthorizationPeriod>
                            <cbc:StartDate>2026-01-15</cbc:StartDate>
                            <cbc:EndDate>2027-01-15</cbc:EndDate>
                        </sts:AuthorizationPeriod>
                        <sts:AuthorizedInvoices>
                            <sts:Prefix>${data.prefix}</sts:Prefix>
                            <sts:From>1</sts:From>
                            <sts:To>10000</sts:To>
                        </sts:AuthorizedInvoices>
                    </sts:InvoiceControl>
                    <sts:InvoiceSource>
                        <cbc:IdentificationCode listAgencyID="6" listName="CO, DIAN (Granularidad 6)" listURI="http://www.dian.gov.co">CO</cbc:IdentificationCode>
                    </sts:InvoiceSource>
                    <sts:SoftwareProvider>
                        <sts:ProviderID schemeID="4">${data.seller.nit}</sts:ProviderID>
                        <sts:SoftwareID schemeID="4">legacy-mark-dian-v1-software-id</sts:SoftwareID>
                    </sts:SoftwareProvider>
                    <sts:SoftwareSecurityCode schemeID="4">${crypto.createHash("sha384").update(`legacy-mark-dian-v1-software-idpin-dian-123${data.invoiceNumber}`).digest("hex")}</sts:SoftwareSecurityCode>
                </sts:DianExtensions>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>10</cbc:CustomizationID>
    <cbc:ProfileID>DIAN 2.1: Factura Electrónica de Venta</cbc:ProfileID>
    <cbc:ProfileExecutionID>${data.environment}</cbc:ProfileExecutionID>
    <cbc:ID>${data.invoiceNumber}</cbc:ID>
    <cbc:UUID schemeID="${data.environment}" schemeName="CUFE-SHA384">${cufe}</cbc:UUID>
    <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
    <cbc:LineCountNumeric>${data.items.length}</cbc:LineCountNumeric>
    <cac:AccountingSupplierParty>
        <cbc:AdditionalAccountTypeCode>2</cbc:AdditionalAccountTypeCode>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${data.seller.name}</cbc:Name>
            </cac:PartyName>
            <cac:PartyTaxScheme>
                <cbc:RegistrationName>${data.seller.name}</cbc:RegistrationName>
                <cbc:CompanyID schemeID="${data.seller.dv}" schemeName="31">${data.seller.nit}</cbc:CompanyID>
                <cbc:TaxLevelCode listName="48">O-48</cbc:TaxLevelCode>
                <cac:TaxScheme>
                    <cbc:ID>01</cbc:ID>
                    <cbc:Name>IVA</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cbc:AdditionalAccountTypeCode>2</cbc:AdditionalAccountTypeCode>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${data.buyer.name}</cbc:Name>
            </cac:PartyName>
            <cac:PartyTaxScheme>
                <cbc:RegistrationName>${data.buyer.name}</cbc:RegistrationName>
                <cbc:CompanyID schemeID="${data.buyer.dv || "0"}" schemeName="${data.buyer.docType}">${data.buyer.docNumber}</cbc:CompanyID>
                <cbc:TaxLevelCode listName="49">R-99-PN</cbc:TaxLevelCode>
                <cac:TaxScheme>
                    <cbc:ID>01</cbc:ID>
                    <cbc:Name>IVA</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="COP">${vatTotal.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="COP">${subtotal.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="COP">${vatTotal.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:Percent>19.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>01</cbc:ID>
                    <cbc:Name>IVA</cbc:Name>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="COP">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="COP">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="COP">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="COP">${total.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>${itemsXml}
</Invoice>`;

    return {
        xml,
        cufe,
        qrText,
        subtotal,
        vatTotal,
        total,
    };
}

/**
 * Builds the real SOAP 1.2 Envelope for DIAN Web Services WcfDianCustomerServices.svc
 */
export function buildRealDianSoapEnvelope(zipBase64: string, fileName: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia">
    <soap:Header/>
    <soap:Body>
        <wcf:SendBillSync>
            <wcf:fileName>${fileName}.zip</wcf:fileName>
            <wcf:contentFile>${zipBase64}</wcf:contentFile>
        </wcf:SendBillSync>
    </soap:Body>
</soap:Envelope>`;
}
