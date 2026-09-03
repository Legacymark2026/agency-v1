"use server";

import { prisma } from "@/lib/prisma";
import type { InventoryItem, KardexMovement, FixedAssetRecord } from "../types";

export async function getInventoryKardexAction(): Promise<{
  success: boolean;
  items: InventoryItem[];
  movements: KardexMovement[];
  totalValuation: number;
}> {
  const items: InventoryItem[] = [];
  const movements: KardexMovement[] = [];

  try {
    const services = await prisma.servicePrice.findMany({
      orderBy: { orderIndex: "asc" },
      take: 20,
    });

    for (const s of services) {
      const avgCost = Math.round((s.precio_base || 1000000) * 0.45);
      const stock = 10;
      const totalValuation = stock * avgCost;

      items.push({
        id: s.id,
        sku: s.codigo_id || `SKU-${s.id.slice(0, 4).toUpperCase()}`,
        name: s.nombre_servicio,
        unit: s.tipo_formato || "UND",
        stock,
        minStock: 2,
        averageCost: avgCost,
        salePrice: s.precio_base || 0,
        vatRate: (s.iva_porcentaje || 19) / 100,
        totalValuation,
        category: s.categoria || "Servicios & Software",
      });

      movements.push({
        id: `MOV-${s.id.slice(0, 4)}`,
        itemId: s.id,
        itemSku: s.codigo_id || `SKU-${s.id.slice(0, 4).toUpperCase()}`,
        itemName: s.nombre_servicio,
        date: s.createdAt.toISOString().split("T")[0],
        documentType: "FC",
        documentNumber: `FC-${s.id.slice(0, 4)}`,
        movementType: "ENTRADA",
        quantity: 10,
        unitCost: avgCost,
        totalCost: 10 * avgCost,
        resultingStock: 10,
        resultingAverageCost: avgCost,
      });
    }
  } catch (err) {
    console.error("[getInventoryKardexAction] DB Error:", err);
  }

  const totalValuation = items.reduce((s, it) => s + it.totalValuation, 0);
  return { success: true, items, movements, totalValuation };
}

export async function registerKardexMovementAction(params: {
  itemId: string;
  type: "ENTRADA" | "SALIDA" | "AJUSTE";
  quantity: number;
  unitCost: number;
  documentNumber: string;
}): Promise<{ success: boolean; movement: KardexMovement }> {
  const mov: KardexMovement = {
    id: `MOV-${Date.now().toString().slice(-4)}`,
    itemId: params.itemId,
    itemSku: "SKU-PROD",
    itemName: "Ítem de Inventario NIIF",
    date: new Date().toISOString().split("T")[0],
    documentType: params.type === "ENTRADA" ? "FC" : "FV",
    documentNumber: params.documentNumber,
    movementType: params.type,
    quantity: Number(params.quantity),
    unitCost: Number(params.unitCost),
    totalCost: Number(params.quantity) * Number(params.unitCost),
    resultingStock: 10 + (params.type === "ENTRADA" ? Number(params.quantity) : -Number(params.quantity)),
    resultingAverageCost: Number(params.unitCost),
  };

  return { success: true, movement: mov };
}

export async function calculateFixedAssetDepreciationAction(data: {
  assetName: string;
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
}): Promise<FixedAssetRecord> {
  const cost = Number(data.cost) || 12000000;
  const salvage = Number(data.salvageValue) || 0;
  const lifeMonths = Number(data.usefulLifeMonths) || 60;

  const depreciableAmount = cost - salvage;
  const monthlyDepreciation = Math.round(depreciableAmount / lifeMonths);
  const accumulatedDepreciation = monthlyDepreciation * 6;
  const netBookValue = cost - accumulatedDepreciation;

  return {
    id: `ACT-${Date.now().toString().slice(-4)}`,
    name: data.assetName || "Servidores y Equipos de Cómputo NIIF",
    code: "152805",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseCost: cost,
    salvageValue: salvage,
    usefulLifeMonths: lifeMonths,
    monthlyDepreciation,
    accumulatedDepreciation,
    netBookValue,
  };
}
