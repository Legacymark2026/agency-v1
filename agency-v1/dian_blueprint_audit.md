# DIAN Enterprise Blueprint - Compliance Audit

| Requirement | Status | Technical Reality in Monorepo | Next Immediate Action |
|---|---|---|---|
| **1. Sandbox Aceptado** | 🟡 Pending | Endpoint calls `environment: "2"` (Test), but the Automated Test Set Runner (Set de Pruebas con 100 documentos) is missing. | Create `test-runner.ts` to automatically emit required test documents. |
| **2. No Private Keys on Disk** | 🟢 Passed | `signer.ts` extracts X.509 v3 certificates purely in-memory using `node-forge` from base64 strings loaded from the DB. Zero files written to local disk. | N/A |
| **3. Local Validation Engine** | 🔴 Failed | No offline schematron (ISO XSLT) or XSD schema validation happens before SOAP transmission. | Integrate `libxmljs` or Saxon to run UBL 2.1 XSD offline checks before transmitting to DIAN. |
| **4. Multi-Tax & Retenciones** | 🟡 Partial | `IVA`, `INC`, `ICA` are present in `ubl.ts` and DB. UI lacks inputs. `IBUA`, `ICUI`, and `Bolsas` are missing from the XML structure. | Add `IBUA`/`ICUI` tax lines in `ubl.ts` and `invoice-form.tsx`. |
| **5. UBL 2.1 Serialization** | 🟢 Passed | `ubl.ts` builds 100% compliant Canonical XML using `xmlbuilder2` mapping Anexo 1.9 DIAN namespaces (`urn:oasis:names...`, `sts:DianExtensions`). | N/A |
| **6. Cryptographic Security** | 🟢 Passed | `cufe.ts` generates exact SHA-384. `signer.ts` uses XML-DSig (`rsa-sha256`), canonical XML 1.0, and enveloped signatures. | N/A |
| **7. Data Security Suite** | 🔴 Failed | The `.p12` password in DB (`passwordHash`) is stored in plaintext. AES-256-GCM envelope encryption at rest is not yet applied. | Apply `encryptPII()` from `@agency/vault-client` to the `DianCertificate` model. |
| **8. RADIAN Compliance** | 🔴 Failed | No `ApplicationResponse` XML generators exist for events 030, 032, 033, 034, 031. No CUDE generator for Título Valor events. | Build `radian.ts` in the engine to generate signed `ApplicationResponse` XMLs. |
| **9. DIAN SOAP Gateway** | 🟡 Partial | `SendBillSync` implemented via SOAP 1.2 with in-memory archiver ZIP. `SendBillAttachmentAsync` and `GetStatus` are missing. | Add async endpoints to `soap.ts` for massive invoice batches. |
| **10. Contingency Type 03/04** | 🔴 Failed | No queue mechanism for 48h SLA replay if DIAN is offline. | Implement a Background Job (Redis Queue) for Contingency Type 04. |

## Conclusión Ejecutiva
Se completó exitosamente el **Núcleo de Transmisión y Criptografía Básica** (Firma, XML y Envío SOAP). Para cumplir con el **100% del blueprint técnico**, debemos implementar de inmediato los validadores XSD locales, los esquemas RADIAN, la cola de contingencia, y el cifrado AES-256 de las llaves en BD.
