"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUBL21 = signUBL21;
const xml_crypto_1 = require("xml-crypto");
const node_forge_1 = __importDefault(require("node-forge"));
/**
 * Extracts the private key and X509 certificate from a .p12 buffer using node-forge
 */
function extractKeysFromP12(p12Buffer, password) {
    const p12Asn1 = node_forge_1.default.asn1.fromDer(p12Buffer.toString('binary'));
    const p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    let privateKeyPem = '';
    let certPem = '';
    const bags = p12.getBags({ bagType: node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    if (keyBag && keyBag.key) {
        privateKeyPem = node_forge_1.default.pki.privateKeyToPem(keyBag.key);
    }
    const certBags = p12.getBags({ bagType: node_forge_1.default.pki.oids.certBag });
    const certBag = certBags[node_forge_1.default.pki.oids.certBag]?.[0];
    if (certBag && certBag.cert) {
        certPem = node_forge_1.default.pki.certificateToPem(certBag.cert);
    }
    if (!privateKeyPem || !certPem) {
        throw new Error("Failed to extract Private Key or Certificate from .p12");
    }
    return { privateKeyPem, certPem };
}
/**
 * Signs the UBL 2.1 XML Document using XAdES-EPES standard required by DIAN
 */
function signUBL21(xml, config) {
    const { privateKeyPem, certPem } = extractKeysFromP12(config.p12Buffer, config.p12Password);
    const sig = new xml_crypto_1.SignedXml();
    // DIAN requires SignatureMethod RSA-SHA256
    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    // DIAN requires CanonicalizationMethod Canonical XML 1.0 (omit comments)
    sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
    // Enveloped signature reference
    sig.addReference("//*[local-name(.)='Invoice']", ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"], "http://www.w3.org/2001/04/xmlenc#sha256");
    // Provide the key and certificate
    sig.keyInfoProvider = {
        getKeyInfo: (key, prefix) => {
            const cleanCert = certPem.replace(/-----BEGIN CERTIFICATE-----/, '')
                .replace(/-----END CERTIFICATE-----/, '')
                .replace(/\s+/g, '');
            return `<X509Data><X509Certificate>${cleanCert}</X509Certificate></X509Data>`;
        },
        getKey: () => Buffer.from(certPem)
    };
    sig.signingKey = privateKeyPem;
    // Inject into the placeholder
    sig.computeSignature(xml, {
        location: { reference: "//*[local-name(.)='ExtensionContent']", action: "append" }
    });
    const signedXml = sig.getSignedXml();
    // In a real scenario, we must add the strict XAdES-EPES properties (QualifyingProperties).
    // This requires building a complex Object node inside the Signature element.
    // For this blueprint, the SignedXml instance applies basic XML-DSig. 
    return signedXml;
}
