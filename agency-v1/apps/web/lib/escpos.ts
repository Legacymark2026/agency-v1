/**
 * Motor de Comandos ESC/POS para Impresoras Térmicas de Punto de Venta (80mm & 58mm)
 * Soporta corte de papel, apertura de cajón monedero (RJ11), alineación y tablas
 */

export interface EscPosTicketItem {
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
}

export interface EscPosTicketData {
    companyName: string;
    nit: string;
    address: string;
    phone: string;
    receiptNo: string;
    date: string;
    customerName: string;
    customerNit?: string;
    items: EscPosTicketItem[];
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    cashReceived?: number;
    change?: number;
    paymentMethod: string;
    cufe?: string;
    qrUrl?: string;
    paperWidthMm?: 80 | 58;
}

export class EscPosBuilder {
    private buffer: number[] = [];

    // Comandos ESC/POS estándar
    private static ESC = 0x1b;
    private static GS = 0x1d;

    constructor() {
        this.reset();
    }

    reset(): this {
        this.buffer.push(EscPosBuilder.ESC, 0x40); // ESC @ (Initialize printer)
        return this;
    }

    alignLeft(): this {
        this.buffer.push(EscPosBuilder.ESC, 0x61, 0);
        return this;
    }

    alignCenter(): this {
        this.buffer.push(EscPosBuilder.ESC, 0x61, 1);
        return this;
    }

    alignRight(): this {
        this.buffer.push(EscPosBuilder.ESC, 0x61, 2);
        return this;
    }

    bold(enable = true): this {
        this.buffer.push(EscPosBuilder.ESC, 0x45, enable ? 1 : 0);
        return this;
    }

    textSize(width = 1, height = 1): this {
        const size = ((width - 1) << 4) | (height - 1);
        this.buffer.push(EscPosBuilder.GS, 0x21, size);
        return this;
    }

    text(str: string): this {
        const encoder = new TextEncoder();
        const bytes = Array.from(encoder.encode(str + "\n"));
        this.buffer.push(...bytes);
        return this;
    }

    lineFeed(count = 1): this {
        for (let i = 0; i < count; i++) {
            this.buffer.push(0x0a);
        }
        return this;
    }

    divider(char = "-", width = 48): this {
        this.text(char.repeat(width));
        return this;
    }

    // Comando de Apertura del Cajón Monedero por pulso RJ11 (ESC p 0 25 250)
    openCashDrawer(): this {
        this.buffer.push(EscPosBuilder.ESC, 0x70, 0x00, 0x19, 0xfa);
        return this;
    }

    // Comando de Corte Parcial/Total de Papel (GS V 66 0)
    cutPaper(): this {
        this.lineFeed(3);
        this.buffer.push(EscPosBuilder.GS, 0x56, 66, 0);
        return this;
    }

    buildBuffer(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}

/**
 * Genera la representación en formato Texto Estructurado Térmico ESC/POS (80mm o 58mm)
 */
export function formatEscPosTicketText(data: EscPosTicketData): string {
    const width = data.paperWidthMm === 58 ? 32 : 48;
    const divider = "-".repeat(width);
    const fmtCOP = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

    let out = "";
    out += `${centerText(data.companyName.toUpperCase(), width)}\n`;
    out += `${centerText(`NIT: ${data.nit}`, width)}\n`;
    out += `${centerText(data.address, width)}\n`;
    out += `${centerText(`Tel: ${data.phone}`, width)}\n`;
    out += `${divider}\n`;
    out += `COMPROBANTE POS / FACTURA: ${data.receiptNo}\n`;
    out += `FECHA: ${data.date}\n`;
    out += `CLIENTE: ${data.customerName}\n`;
    if (data.customerNit) out += `NIT/CC: ${data.customerNit}\n`;
    out += `MEDIO DE PAGO: ${data.paymentMethod}\n`;
    out += `${divider}\n`;

    out += padRight("CANT/DESCRIPCION", width - 12) + padLeft("TOTAL", 12) + "\n";
    out += `${divider}\n`;

    for (const item of data.items) {
        const itemLine = `${item.qty}x ${item.name}`;
        const totalStr = fmtCOP(item.total);
        if (itemLine.length + totalStr.length + 1 <= width) {
            out += padRight(itemLine, width - totalStr.length) + totalStr + "\n";
        } else {
            out += `${itemLine}\n`;
            out += padLeft(totalStr, width) + "\n";
        }
    }

    out += `${divider}\n`;
    out += padRight("SUBTOTAL:", width - 14) + padLeft(fmtCOP(data.subtotal), 14) + "\n";
    out += padRight("IVA / IMPUESTOS:", width - 14) + padLeft(fmtCOP(data.tax), 14) + "\n";
    if (data.discount && data.discount > 0) {
        out += padRight("DESCUENTOS:", width - 14) + padLeft(`-${fmtCOP(data.discount)}`, 14) + "\n";
    }
    out += `${divider}\n`;
    out += padRight("TOTAL A PAGAR:", width - 16) + padLeft(fmtCOP(data.total), 16) + "\n";

    if (data.cashReceived !== undefined && data.cashReceived > 0) {
        out += padRight("RECIBIDO EN CAJA:", width - 14) + padLeft(fmtCOP(data.cashReceived), 14) + "\n";
        out += padRight("CAMBIO / VUELTAS:", width - 14) + padLeft(fmtCOP(data.change || 0), 14) + "\n";
    }

    if (data.cufe) {
        out += `${divider}\n`;
        out += `CUFE / HASH DIAN:\n${data.cufe}\n`;
        if (data.qrUrl) {
            out += `CONSULTA DIAN: ${data.qrUrl}\n`;
        }
    }

    out += `${divider}\n`;
    out += `${centerText("¡GRACIAS POR SU COMPRA!", width)}\n`;
    out += `${centerText("Software POS LegacyMark Cloud", width)}\n\n\n`;

    return out;
}

function centerText(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    const leftPadding = Math.floor((width - text.length) / 2);
    return " ".repeat(leftPadding) + text;
}

function padRight(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    return text + " ".repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
    if (text.length >= width) return text.substring(0, width);
    return " ".repeat(width - text.length) + text;
}
