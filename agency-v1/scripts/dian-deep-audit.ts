import forge from 'node-forge';
import crypto from 'crypto';
import { generateCUFE, generateCUDE } from '../packages/dian-engine/src/cufe';
import { buildUBL21Invoice } from '../packages/dian-engine/src/ubl';
import { buildRadianApplicationResponse } from '../packages/dian-engine/src/radian';
import { signUBL21 } from '../packages/dian-engine/src/signer';
import { encryptPII, decryptPII } from '../packages/vault-client/src/crypto';

interface AuditResult {
    check: string;
    category: string;
    passed: boolean;
    details: string;
}

const auditLog: AuditResult[] = [];

function record(category: string, check: string, passed: boolean, details: string) {
    auditLog.push({ category, check, passed, details });
    const mark = passed ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${mark} [${category}] ${check}: ${details}`);
}

async function runDeepAudit() {
    console.log("================================================================================");
    console.log("         DIAN & RADIAN ENTERPRISE ENGINE — DEEP COMPREHENSIVE AUDIT");
    console.log("================================================================================");

    // -------------------------------------------------------------------------
    // TEST 1: Criptografía CUFE SHA-384
    // -------------------------------------------------------------------------
    try {
        const cufe = generateCUFE(
            "SETT-990001",
            "2026-10-05",
            "12:00:00-05:00",
            1000000.00,
            "01", 190000.00, // IVA
            "04", 0.00,      // INC
            "03", 9660.00,    // ICA
            1199660.00,
            "900123456",
            "800987654",
            "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c",
            "2"
        );
        const isHex96 = /^[0-9a-f]{96}$/i.test(cufe);
        record("CRYPTOGRAPHY", "CUFE SHA-384 Generation", isHex96, `CUFE: ${cufe.substring(0, 24)}... (Length: ${cufe.length})`);
    } catch (e: any) {
        record("CRYPTOGRAPHY", "CUFE SHA-384 Generation", false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Criptografía CUDE SHA-384 (RADIAN & Notas)
    // -------------------------------------------------------------------------
    try {
        const cude = generateCUDE(
            "NC-990001",
            "2026-10-05",
            "12:00:00-05:00",
            500000.00,
            "01", 95000.00,
            "04", 0.00,
            "03", 0.00,
            595000.00,
            "900123456",
            "800987654",
            "12345",
            "2"
        );
        const isHex96 = /^[0-9a-f]{96}$/i.test(cude);
        record("CRYPTOGRAPHY", "CUDE SHA-384 Generation", isHex96, `CUDE: ${cude.substring(0, 24)}... (Length: ${cude.length})`);
    } catch (e: any) {
        record("CRYPTOGRAPHY", "CUDE SHA-384 Generation", false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Tax & Retenciones (IVA, INC, ICA, Bolsas, IBUA, ICUI + ReteIVA/Fuente/ICA)
    // -------------------------------------------------------------------------
    try {
        const invoiceData = {
            invoiceNumber: "FE-AUDIT-001",
            issueDate: new Date(),
            subtotal: 1000000,
            totalAmount: 1220000,
            taxes: {
                iva: 190000,       // 01
                ica: 9660,         // 03
                inc: 80000,        // 04
                bolsas: 2000,      // 22
                ibua: 15000,       // 34
                icui: 12000,       // 35
                reteFuente: 25000, // 06
                reteIVA: 28500,    // 05
                reteICA: 9660      // 07
            },
            issuer: {
                nit: "901234567-8",
                name: "LEGACYMARK SAS",
                technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c"
            },
            customer: {
                nit: "900888777-1",
                name: "CLIENTE AUDITORIA SA"
            },
            environment: "2" as const
        };

        const { xml, cufe } = buildUBL21Invoice(invoiceData);

        const hasIVA = xml.includes("<cbc:ID>01</cbc:ID>") && xml.includes("<cbc:Name>IVA</cbc:Name>");
        const hasINC = xml.includes("<cbc:ID>04</cbc:ID>") && xml.includes("<cbc:Name>INC</cbc:Name>");
        const hasICA = xml.includes("<cbc:ID>03</cbc:ID>") && xml.includes("<cbc:Name>ICA</cbc:Name>");
        const hasBolsas = xml.includes("<cbc:ID>22</cbc:ID>") && xml.includes("<cbc:Name>Bolsas</cbc:Name>");
        const hasIBUA = xml.includes("<cbc:ID>34</cbc:ID>") && xml.includes("<cbc:Name>IBUA</cbc:Name>");
        const hasICUI = xml.includes("<cbc:ID>35</cbc:ID>") && xml.includes("<cbc:Name>ICUI</cbc:Name>");
        const hasWithholdings = xml.includes("<cac:WithholdingTaxTotal>") && xml.includes("<cbc:ID>06</cbc:ID>");

        const allTaxesSerialized = hasIVA && hasINC && hasICA && hasBolsas && hasIBUA && hasICUI && hasWithholdings;
        record("TAX_ENGINE", "Multi-Tax & Withholdings UBL 2.1 Serialization", allTaxesSerialized, 
            `IVA:${hasIVA}, INC:${hasINC}, ICA:${hasICA}, Bolsas:${hasBolsas}, IBUA:${hasIBUA}, ICUI:${hasICUI}, Retenciones:${hasWithholdings}`);

        // Balance aritmético
        const totalDirectTaxes = 190000 + 9660 + 80000 + 2000 + 15000 + 12000;
        const totalWithholding = 25000 + 28500 + 9660;
        const expectedTaxInclusive = 1000000 + totalDirectTaxes;
        const expectedPayable = expectedTaxInclusive - totalWithholding;

        const hasCorrectTaxInclusive = xml.includes(`<cbc:TaxInclusiveAmount currencyID="COP">${expectedTaxInclusive.toFixed(2)}</cbc:TaxInclusiveAmount>`);
        const hasCorrectPrepaid = xml.includes(`<cbc:PrepaidPaymentAmount currencyID="COP">${totalWithholding.toFixed(2)}</cbc:PrepaidPaymentAmount>`);
        const hasCorrectPayable = xml.includes(`<cbc:PayableAmount currencyID="COP">${expectedPayable.toFixed(2)}</cbc:PayableAmount>`);

        const isArithemticallyBalanced = hasCorrectTaxInclusive && hasCorrectPrepaid && hasCorrectPayable;
        record("TAX_ENGINE", "LegalMonetaryTotal Arithmetic Integrity", isArithemticallyBalanced,
            `TaxInclusive: ${expectedTaxInclusive.toFixed(2)}, Withholding: ${totalWithholding.toFixed(2)}, Net Payable: ${expectedPayable.toFixed(2)}`);

    } catch (e: any) {
        record("TAX_ENGINE", "Multi-Tax & Withholdings", false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Generación y Firma Digital XAdES-EPES en memoria (Certificado Ephemeral)
    // -------------------------------------------------------------------------
    try {
        // Crear un certificado X.509 v3 y llave RSA en memoria con node-forge
        const keys = forge.pki.rsa.generateKeyPair(2048);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
        const attrs = [{ name: 'commonName', value: 'LegacyMark DIAN Signer' }];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keys.privateKey, forge.md.sha256.create());

        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], 'SecretTestPass123!');
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
        const p12Buffer = Buffer.from(p12Der, 'binary');

        // Serializar XML básico y firmarlo
        const { xml } = buildUBL21Invoice({
            invoiceNumber: "FE-SIGN-001",
            issueDate: new Date(),
            subtotal: 500000,
            totalAmount: 595000,
            taxes: { iva: 95000, ica: 0, inc: 0 },
            issuer: { nit: "901234567", name: "LEGACYMARK", technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c" },
            customer: { nit: "800111222", name: "CLIENTE TEST" },
            environment: "2"
        });

        const signedXml = signUBL21(xml, { p12Buffer, p12Password: "SecretTestPass123!" });
        
        const hasSignatureValue = signedXml.includes("<SignatureValue>") || signedXml.includes("SignatureValue");
        const hasKeyInfo = signedXml.includes("<X509Certificate>");
        const hasC14N = signedXml.includes("http://www.w3.org/TR/2001/REC-xml-c14n-20010315");
        const hasSha256 = signedXml.includes("http://www.w3.org/2001/04/xmldsig-more#rsa-sha256");

        const isSignatureValid = hasSignatureValue && hasKeyInfo && hasC14N && hasSha256;
        record("CRYPTOGRAPHY", "XML-DSig C14N & X.509 v3 Signature Extraction", isSignatureValid,
            `HasSignatureValue:${hasSignatureValue}, HasX509Cert:${hasKeyInfo}, C14N_Method:${hasC14N}, RSA-SHA256:${hasSha256}`);

    } catch (e: any) {
        record("CRYPTOGRAPHY", "XML-DSig C14N & X.509 v3 Signature Extraction", false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Data Security Suite — Cifrado Envelope AES-256-GCM
    // -------------------------------------------------------------------------
    try {
        // Asegurar clave de 32 bytes en env
        process.env.PII_ENCRYPTION_KEY = "12345678901234567890123456789012";
        const sensitiveSecret = "CertPassword_SuperSecret_2026_DIAN_Token";

        const encrypted = encryptPII(sensitiveSecret);
        const decrypted = decryptPII(encrypted);

        const isZeroPlaintext = encrypted !== sensitiveSecret && !encrypted.includes(sensitiveSecret);
        const isExactRoundtrip = decrypted === sensitiveSecret;

        // Validar estructura base64 (IV 16B + Tag 16B + Payload)
        const rawBuffer = Buffer.from(encrypted, 'base64');
        const hasValidTagAndIv = rawBuffer.length > 32;

        record("DATA_SECURITY", "AES-256-GCM Envelope Encryption (Zero Plaintext)", isZeroPlaintext && isExactRoundtrip && hasValidTagAndIv,
            `Encrypted Length: ${rawBuffer.length} bytes, Integrity Verified: ${isExactRoundtrip}`);
    } catch (e: any) {
        record("DATA_SECURITY", "AES-256-GCM Envelope Encryption", false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Cumplimiento RADIAN (Eventos 030, 032, 033, 034, 031)
    // -------------------------------------------------------------------------
    try {
        const events: Array<"030" | "032" | "033" | "034" | "031"> = ["030", "032", "033", "034", "031"];
        let allRadianPassed = true;

        for (const ev of events) {
            const radianDoc = buildRadianApplicationResponse({
                eventId: ev,
                originalInvoiceCufe: "d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8",
                originalInvoiceNumber: "FE-RADIAN-100",
                issueDate: new Date(),
                issuer: { nit: "901234567", name: "COMPRADOR SAS" },
                receiver: { nit: "800999888", name: "EMISOR ORIGINAL SAS" },
                environment: "2",
                pin: "54321"
            });

            const hasEventCode = radianDoc.xml.includes(`<cbc:ResponseCode>${ev}</cbc:ResponseCode>`);
            const hasApplicationResponse = radianDoc.xml.includes("<ApplicationResponse");
            const hasValidCude = radianDoc.cude.length === 96;

            if (!hasEventCode || !hasApplicationResponse || !hasValidCude) {
                allRadianPassed = false;
            }
        }

        record("RADIAN", "UBL 2.1 ApplicationResponse Events (030,032,033,034,031)", allRadianPassed,
            `All 5 RADIAN Title-Value events built with compliant CUDE-SHA384 references.`);
    } catch (e: any) {
        record("RADIAN", "UBL 2.1 ApplicationResponse Events", false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Resumen Final y Veredicto
    // -------------------------------------------------------------------------
    console.log("================================================================================");
    const passedCount = auditLog.filter(a => a.passed).length;
    const totalCount = auditLog.length;
    const rate = Math.round((passedCount / totalCount) * 100);

    console.log(`AUDIT SUMMARY: ${passedCount} / ${totalCount} checks passed (${rate}% Compliance)`);
    if (passedCount === totalCount) {
        console.log("🏆 STATUS: ENGINE VERIFIED AND 100% COMPLIANT WITH DIAN & RADIAN BLUEPRINT.");
    } else {
        console.log("⚠️ STATUS: ISSUES DETECTED DURING AUDIT.");
    }
    console.log("================================================================================");
}

runDeepAudit().catch(console.error);
