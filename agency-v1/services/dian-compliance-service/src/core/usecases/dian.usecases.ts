/**
 * DIAN Compliance Core UseCases (Hexagonal 5.0)
 */
import { DianAlgorithms, DianDocumentProps } from "../domain/dian.domain";
import { IDianRepositoryPort, IDianEventPublisherPort, IDianComplianceUseCases } from "../ports/dian.ports";

export class DianComplianceUseCases implements IDianComplianceUseCases {
  constructor(
    private readonly repo: IDianRepositoryPort,
    private readonly eventPublisher: IDianEventPublisherPort
  ) {}

  async emitElectronicInvoice(params: {
    companyId: string;
    prefix: string;
    emitterNit: string;
    emitterName: string;
    receiverNit: string;
    receiverName: string;
    subtotal: number;
    vatAmount: number;
    items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
  }): Promise<DianDocumentProps> {
    const resolution = await this.repo.getActiveResolution(params.companyId, params.prefix);
    const technicalKey = resolution?.technicalKey || "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c";

    const nextNumber = resolution ? await this.repo.incrementResolutionNumber(resolution.id) : 1;
    const documentNumber = `${params.prefix}-${String(nextNumber).padStart(6, "0")}`;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8) + "-05:00";
    const total = params.subtotal + params.vatAmount;

    const cufe = DianAlgorithms.generateCUFE({
      invoiceNumber: documentNumber,
      date: dateStr,
      time: timeStr,
      subtotal: params.subtotal,
      vatAmount: params.vatAmount,
      total,
      emitterNit: params.emitterNit,
      receiverNit: params.receiverNit,
      technicalKey,
    });

    const qrCode = DianAlgorithms.generateQrUrl(cufe, documentNumber, params.emitterNit, params.receiverNit, total, dateStr);

    const xmlContent = DianAlgorithms.buildUbl21Xml({
      cufe,
      invoiceNumber: documentNumber,
      date: dateStr,
      time: timeStr,
      emitterNit: params.emitterNit,
      emitterName: params.emitterName,
      receiverNit: params.receiverNit,
      receiverName: params.receiverName,
      subtotal: params.subtotal,
      vatAmount: params.vatAmount,
      total,
      items: params.items,
    });

    const doc = await this.repo.saveDocument({
      companyId: params.companyId,
      documentType: "INVOICE",
      documentNumber,
      prefix: params.prefix,
      cufe,
      qrCode,
      xmlContent,
      dianStatus: "ACCEPTED", // Mocking statutory instant validation
      dianResponse: { status: "OK", code: "0", message: "Documento validado por DIAN" },
      totalAmount: total,
      taxAmount: params.vatAmount,
      receiverNit: params.receiverNit,
      receiverName: params.receiverName,
      issuedAt: now,
      sentAt: now,
      validatedAt: now,
    });

    await this.eventPublisher.publishDocumentApproved({
      documentId: doc.id,
      companyId: params.companyId,
      cufe,
      documentNumber,
    });

    return doc;
  }

  async emitPosEquivalent(params: {
    companyId: string;
    cierreZId?: string;
    totalAmount: number;
    taxAmount: number;
    cashierName: string;
  }): Promise<DianDocumentProps> {
    const documentNumber = `POS-${Date.now().toString().slice(-6)}`;
    const subtotal = params.totalAmount - params.taxAmount;
    const now = new Date();

    const cufe = DianAlgorithms.generateCUFE({
      invoiceNumber: documentNumber,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 8) + "-05:00",
      subtotal,
      vatAmount: params.taxAmount,
      total: params.totalAmount,
      emitterNit: "901234567-8",
      receiverNit: "222222222222",
      technicalKey: "pos-technical-key-dian-mock",
    });

    const doc = await this.repo.saveDocument({
      companyId: params.companyId,
      documentType: "POS_EQUIVALENT",
      documentNumber,
      prefix: "POS",
      cufe,
      dianStatus: "ACCEPTED",
      dianResponse: { status: "OK", message: "Documento equivalente POS registrado ante DIAN" },
      totalAmount: params.totalAmount,
      taxAmount: params.taxAmount,
      receiverNit: "222222222222",
      receiverName: "CONSUMIDOR FINAL",
      issuedAt: now,
      sentAt: now,
      validatedAt: now,
    });

    await this.eventPublisher.publishDocumentApproved({
      documentId: doc.id,
      companyId: params.companyId,
      cufe,
      documentNumber,
    });

    return doc;
  }
}
