import crypto from "crypto";

export function generateCUNEHash(docNumber: string, dateStr: string, totalDevengado: number, totalDeducciones: number, netoPagar: number, employeeNit: string): string {
  const rawCUNE = `${docNumber}|${dateStr}|${totalDevengado}|${totalDeducciones}|${netoPagar}|${employeeNit}|902028722-3|PIN_DIAN_SECRET_NOMINA`;
  return crypto.createHash("sha384").update(rawCUNE).digest("hex").toUpperCase();
}

export function generateCUDSHash(dseNumber: string, dateStr: string, subtotal: number, reteFuente: number, vendorNit: string): string {
  const rawCUDS = `${dseNumber}|${dateStr}|${subtotal}|${reteFuente}|${vendorNit}|902028722-3|PIN_DIAN_SECRET`;
  return crypto.createHash("sha256").update(rawCUDS).digest("hex").toUpperCase();
}

export function generateTaxCertificateHash(beneficiaryNit: string, currentYear: number, type: string, subjectAmount: number): string {
  const rawString = `${beneficiaryNit}|902.028.722-3|${currentYear}|${type}|${subjectAmount}`;
  return crypto.createHash("sha256").update(rawString).digest("hex").slice(0, 32).toUpperCase();
}
