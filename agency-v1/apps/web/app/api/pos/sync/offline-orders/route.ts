import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { createPosSaleAccountingEntry } from "@/lib/pos/pos-accounting-engine";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId: inputCompanyId, offlineOrders } = body;

    if (!Array.isArray(offlineOrders)) {
      return NextResponse.json({ error: "offlineOrders array required" }, { status: 400 });
    }

    // Try microservice first
    try {
      const msRes = await fetch(`${POS_SERVICE_URL}/api/pos/sync/offline-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      });
      if (msRes.ok) {
        const msData = await msRes.json();
        return NextResponse.json(msData);
      }
    } catch (_) {}

    // Resilient local sync
    let targetCompanyId = inputCompanyId;
    if (!targetCompanyId || targetCompanyId.includes("default")) {
      const firstComp = await prisma.company.findFirst({ select: { id: true } });
      targetCompanyId = firstComp?.id || "company_pos_offline";
    }

    const syncedOrders: any[] = [];

    for (const order of offlineOrders) {
      const existing = await prisma.invoice.findFirst({
        where: { notes: { contains: `[OFFLINE_UUID:${order.offlineId}]` } },
      });

      if (existing) {
        syncedOrders.push(existing);
        continue;
      }

      const receiptNo = `POS-OFF-${order.offlineId.slice(-6).toUpperCase()}`;
      const issueDate = new Date().toISOString();
      const rawCufeStr = `${Date.now()}${issueDate}${order.totalAmount}${order.tax}01${order.customerNit || "222222222222"}123456789`;
      const cufeHash = crypto.createHash("sha384").update(rawCufeStr).digest("hex");

      const invoice = await prisma.invoice.create({
        data: {
          companyId: targetCompanyId,
          clientName: order.customerName || "Consumidor Final",
          clientNit: order.customerNit || null,
          subtotalAmount: order.subtotal,
          taxAmount: order.tax,
          discountAmount: order.discountAmount || 0,
          totalAmount: order.totalAmount,
          advanceAmount: order.totalAmount,
          finalAmount: order.totalAmount,
          status: "PAID",
          currency: "COP",
          isElectronic: true,
          notes: `[POS] Venta Offline Sincronizada | [OFFLINE_UUID:${order.offlineId}] | Tiquete: ${receiptNo} | Medio: ${order.paymentMethod}`,
          items: {
            create: order.items.map((i: any) => ({
              title: i.title,
              description: `SKU: ${i.sku || "N/A"}`,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              taxRate: i.taxRate,
              totalAmount: i.quantity * i.unitPrice * (1 + i.taxRate),
            })),
          },
        },
        include: { items: true },
      });

      syncedOrders.push(invoice);

      // Trigger automated accounting entry
      try {
        await createPosSaleAccountingEntry({
          orderId: invoice.id,
          receiptNo,
          companyId: targetCompanyId,
          paymentMethod: order.paymentMethod || "CASH",
          subtotal: order.subtotal,
          tax: order.tax,
          discountAmount: order.discountAmount || 0,
          total: order.totalAmount,
          items: order.items,
          customerNit: order.customerNit,
          customerName: order.customerName,
        });
      } catch (accErr) {
        console.warn("[POS-Sync-Accounting] Error:", accErr);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedOrders.length,
      orders: syncedOrders,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
