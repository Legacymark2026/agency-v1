import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { createPosSaleAccountingEntry } from "@/lib/pos/pos-accounting-engine";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    const where: any = { notes: { contains: "[POS]" } };
    if (companyId) where.companyId = companyId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, orders: invoices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyId: inputCompanyId,
      customerName = "Consumidor Final",
      customerNit = "222222222222",
      customerPhone,
      paymentMethod = "CASH",
      cashReceived = 0,
      discountAmount = 0,
      items = [],
      splitBreakdown,
      taxType = "IVA",
      tipAmount = 0,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "items array is required" }, { status: 400 });
    }

    // Try microservice first if reachable
    try {
      const msRes = await fetch(`${POS_SERVICE_URL}/api/pos/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      });
      if (msRes.ok) {
        const msData = await msRes.json();
        if (msData.success && msData.order) {
          // Trigger accounting entry
          try {
            await createPosSaleAccountingEntry({
              orderId: msData.order.id,
              receiptNo: msData.receiptTicket?.header?.receiptNo || `POS-${msData.order.id.slice(-6).toUpperCase()}`,
              companyId: inputCompanyId,
              paymentMethod,
              splitBreakdown,
              subtotal: msData.order.subtotalAmount,
              tax: msData.order.taxAmount,
              taxType,
              tipAmount,
              discountAmount,
              total: msData.order.totalAmount,
              items,
              customerNit,
              customerName,
            });
          } catch (accErr) {
            console.warn("[POS-Accounting] Notice:", accErr);
          }
          return NextResponse.json(msData, { status: 201 });
        }
      }
    } catch (_) {
      // Graceful local Prisma fallback below
    }

    // Resolve valid company
    let targetCompanyId = inputCompanyId;
    if (!targetCompanyId || targetCompanyId === "company_default" || targetCompanyId === "company_default_pos") {
      const firstComp = await prisma.company.findFirst({ select: { id: true } });
      if (firstComp) targetCompanyId = firstComp.id;
      else {
        const newComp = await prisma.company.create({
          data: { name: "LegacyMark S.A.S.", slug: `legacymark-pos-${Date.now()}` },
          select: { id: true },
        });
        targetCompanyId = newComp.id;
      }
    }

    let subtotalAmount = 0;
    let taxAmount = 0;

    const processedItems = items.map((item: any) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.unitPrice) || 0;
      const itemTaxRate = Number(item.taxRate) || 0;
      const lineSubtotal = qty * price;
      const lineTax = lineSubtotal * itemTaxRate;

      subtotalAmount += lineSubtotal;
      taxAmount += lineTax;

      return {
        title: item.title || "Producto POS",
        description: `SKU: ${item.sku || "N/A"}`,
        quantity: qty,
        unitPrice: price,
        taxRate: itemTaxRate,
        totalAmount: lineSubtotal + lineTax,
      };
    });

    const grossTotal = subtotalAmount + taxAmount;
    const totalDiscount = Number(discountAmount) || 0;
    const totalAmount = Math.max(0, grossTotal - totalDiscount + (Number(tipAmount) || 0));
    const received = Number(cashReceived) || totalAmount;
    const changeAmount = paymentMethod === "CASH" ? Math.max(0, received - totalAmount) : 0;

    const issueDate = new Date().toISOString();
    const rawCufeStr = `${Date.now()}${issueDate}${totalAmount}${taxAmount}01${customerNit}123456789`;
    const cufeHash = crypto.createHash("sha384").update(rawCufeStr).digest("hex");
    const receiptNo = `POS-${Date.now().toString().slice(-6).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        companyId: targetCompanyId,
        clientName: customerName,
        clientNit: customerNit,
        clientPhone: customerPhone || null,
        subtotalAmount,
        taxAmount,
        discountAmount: totalDiscount,
        totalAmount,
        advanceAmount: paymentMethod === "CASH" ? received : totalAmount,
        finalAmount: totalAmount,
        status: "PAID",
        currency: "COP",
        isElectronic: true,
        notes: `[POS] Venta en Mostrador | Tiquete: ${receiptNo} | CUFE: ${cufeHash.substring(0, 16)}... | Medio: ${paymentMethod}`,
        items: {
          create: processedItems,
        },
      },
      include: { items: true },
    });

    // Automated Accounting Double Entry
    let accountingResult = null;
    try {
      accountingResult = await createPosSaleAccountingEntry({
        orderId: invoice.id,
        receiptNo,
        companyId: targetCompanyId,
        paymentMethod,
        splitBreakdown,
        subtotal: subtotalAmount,
        tax: taxAmount,
        taxType,
        tipAmount: Number(tipAmount) || 0,
        discountAmount: totalDiscount,
        total: totalAmount,
        items,
        customerNit,
        customerName,
      });
    } catch (e: any) {
      console.warn("[POS-Accounting] Accounting entry creation notice:", e.message);
    }

    const receiptTicket = {
      header: {
        companyName: "LegacyMark S.A.S.",
        nit: "901.456.789-0",
        address: "Calle Principal #10-20, Colombia",
        phone: "+57 300 123 4567",
        receiptNo,
        date: new Date().toLocaleString("es-CO"),
        cufe: cufeHash,
        qrDianUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufeHash}`,
      },
      customer: { name: customerName, nit: customerNit },
      items: processedItems.map((i: any) => ({
        name: i.title,
        qty: i.quantity,
        unitPrice: i.unitPrice,
        total: i.totalAmount,
      })),
      totals: {
        subtotal: subtotalAmount,
        tax: taxAmount,
        discount: totalDiscount,
        tip: Number(tipAmount) || 0,
        total: totalAmount,
        cashReceived: received,
        change: changeAmount,
        paymentMethod,
      },
    };

    return NextResponse.json({
      success: true,
      order: invoice,
      changeAmount,
      cufe: cufeHash,
      receiptTicket,
      accountingVoucher: accountingResult?.voucherNumber || null,
      accountingBalanced: accountingResult?.success || true,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[POS-Orders-Route-Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
