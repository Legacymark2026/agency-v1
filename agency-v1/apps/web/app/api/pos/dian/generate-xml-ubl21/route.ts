import { NextResponse } from "next/server";
import crypto from "crypto";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    try {
      const msRes = await fetch(`${POS_SERVICE_URL}/api/pos/dian/generate-xml-ubl21`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      });
      if (msRes.ok) {
        const msData = await msRes.json();
        return NextResponse.json(msData);
      }
    } catch (_) {}

    const { prefix = "POS", number = "1001", totalAmount = 0, taxAmount = 0, issuer, customer } = body;
    const secretPin = "123456789";
    const date = new Date().toISOString().split("T")[0];
    const rawCufeStr = `${prefix}${number}${date}${totalAmount}${taxAmount}01${customer?.nit || "222222222222"}${secretPin}`;
    const cufe = crypto.createHash("sha384").update(rawCufeStr).digest("hex");
    const qrUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1: Documento Equivalente Electronico POS</cbc:ProfileID>
  <cbc:ID>${prefix}${number}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${cufe}</cbc:UUID>
  <cbc:IssueDate>${date}</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${issuer?.companyName || "LegacyMark S.A.S."}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme><cbc:CompanyID schemeID="1">${issuer?.nit || "901456789"}</cbc:CompanyID></cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="COP">${totalAmount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    return NextResponse.json({
      success: true,
      cufe,
      qrUrl,
      xmlContent,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
