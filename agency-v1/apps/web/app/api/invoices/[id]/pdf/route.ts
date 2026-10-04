import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import puppeteer from "puppeteer";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: { items: true },
        });

        if (!invoice || invoice.companyId !== session.user.companyId) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const company = await prisma.company.findUnique({
            where: { id: invoice.companyId }
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
                    .logo-section h1 { margin: 0; font-size: 28px; color: #1e293b; }
                    .logo-section p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
                    .invoice-details { text-align: right; }
                    .invoice-details h2 { margin: 0; font-size: 32px; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; }
                    .invoice-details p { margin: 5px 0 0; font-size: 14px; color: #64748b; }
                    .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    .info-box { width: 45%; }
                    .info-box h3 { margin: 0 0 10px; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                    .info-box p { margin: 0 0 5px; font-size: 14px; font-weight: 500; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; }
                    td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    .text-right { text-align: right; }
                    .summary { display: flex; justify-content: flex-end; }
                    .summary-box { width: 300px; background: #f8fafc; padding: 20px; border-radius: 8px; }
                    .summary-line { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #475569; }
                    .summary-total { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: bold; color: #0f172a; }
                    .footer { margin-top: 60px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                    .dian-box { margin-top: 40px; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 8px; font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 20px; }
                    .qr-placeholder { width: 80px; height: 80px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-section">
                        <h1>${company?.name || 'Agencia'}</h1>
                        <p>Documento Oficial B2B</p>
                    </div>
                    <div class="invoice-details">
                        <h2>FACTURA</h2>
                        <p><strong>Nº:</strong> ${invoice.id.split('-')[0].toUpperCase()}</p>
                        <p><strong>Fecha:</strong> ${invoice.createdAt.toLocaleDateString('es-CO')}</p>
                        <p><strong>Naturaleza:</strong> ${(invoice as any).documentNature === 'CREDIT_NOTE' ? 'NOTA CRÉDITO' : 'FACTURA DE VENTA'}</p>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-box">
                        <h3>Facturar a</h3>
                        <p style="font-size: 18px;">${invoice.clientName}</p>
                        <p>NIT/CC: ${invoice.clientNit || 'N/A'}</p>
                        <p>${invoice.clientAddress || ''}</p>
                        <p>${invoice.clientCity || ''}</p>
                        <p>${(invoice as any).clientEmail || ''}</p>
                    </div>
                    <div class="info-box">
                        <h3>Condiciones de Pago</h3>
                        <p>Medio de Pago: ${(invoice as any).paymentMethod || 'Transferencia'}</p>
                        <p>Moneda: ${invoice.currency}</p>
                        <p>Vencimiento: ${invoice.dueDate ? invoice.dueDate.toLocaleDateString('es-CO') : 'Inmediato'}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th class="text-right">Cant.</th>
                            <th class="text-right">Precio Unitario</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                        <tr>
                            <td>
                                <strong>${item.title}</strong>
                                ${item.description ? `<br><span style="color:#64748b;font-size:12px;">${item.description}</span>` : ''}
                            </td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">$${item.unitPrice.toLocaleString('es-CO')}</td>
                            <td class="text-right">$${item.totalAmount.toLocaleString('es-CO')}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-box">
                        <div class="summary-line">
                            <span>Subtotal</span>
                            <span>$${invoice.subtotalAmount.toLocaleString('es-CO')}</span>
                        </div>
                        <div class="summary-line">
                            <span>Impuestos (IVA)</span>
                            <span>$${invoice.taxAmount.toLocaleString('es-CO')}</span>
                        </div>
                        ${(invoice as any).reteFuente > 0 ? `
                        <div class="summary-line" style="color: #ef4444;">
                            <span>Retención en la Fuente</span>
                            <span>-$${(invoice as any).reteFuente.toLocaleString('es-CO')}</span>
                        </div>
                        ` : ''}
                        ${(invoice as any).reteICA > 0 ? `
                        <div class="summary-line" style="color: #ef4444;">
                            <span>ReteICA</span>
                            <span>-$${(invoice as any).reteICA.toLocaleString('es-CO')}</span>
                        </div>
                        ` : ''}
                        ${(invoice as any).reteIVA > 0 ? `
                        <div class="summary-line" style="color: #ef4444;">
                            <span>ReteIVA</span>
                            <span>-$${(invoice as any).reteIVA.toLocaleString('es-CO')}</span>
                        </div>
                        ` : ''}
                        <div class="summary-total">
                            <span>Total a Pagar</span>
                            <span>$${invoice.finalAmount.toLocaleString('es-CO')} ${invoice.currency}</span>
                        </div>
                    </div>
                </div>

                ${invoice.isElectronic ? `
                <div class="dian-box">
                    <div class="qr-placeholder">QR DIAN</div>
                    <div>
                        <strong>Firma Electrónica DIAN Validada</strong><br>
                        CUFE: ${invoice.cufe || 'En proceso de validación...'}<br>
                        Generado por Software Autorizado: LegacyMark SAS<br>
                        ${invoice.dianStatus === 'PENDING' ? 'Documento pendiente de firma electrónica final.' : 'Documento Oficial válido ante la DIAN.'}
                    </div>
                </div>
                ` : ''}

                <div class="footer">
                    <p>${invoice.notes || 'Gracias por su negocio.'}</p>
                    <p>Factura generada electrónicamente por la plataforma de gestión de la agencia.</p>
                </div>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        await browser.close();

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': \`inline; filename="Factura-\${invoice.id.split('-')[0]}.pdf"\`
            }
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
