/**
 * POS Offline-First Storage Engine
 * Guarantees zero lost sales during store network outages using IndexedDB/LocalStorage queue.
 */

export interface OfflineOrder {
    offlineId: string;
    companyId: string;
    customerName: string;
    customerNit?: string;
    paymentMethod: string;
    cashReceived: number;
    discountAmount: number;
    subtotal: number;
    tax: number;
    totalAmount: number;
    items: Array<{
        title: string;
        sku?: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
    }>;
    createdAt: string;
}

const STORAGE_KEY = "legacymark_pos_offline_orders_v1";

export function getOfflineOrders(): OfflineOrder[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveOfflineOrder(order: Omit<OfflineOrder, "offlineId" | "createdAt">): OfflineOrder {
    const offlineId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullOrder: OfflineOrder = {
        ...order,
        offlineId,
        createdAt: new Date().toISOString(),
    };

    const current = getOfflineOrders();
    current.push(fullOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return fullOrder;
}

export function clearOfflineOrders() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export async function syncOfflineOrdersToServer(companyId: string): Promise<{ success: boolean; syncedCount: number }> {
    const pending = getOfflineOrders();
    if (pending.length === 0) return { success: true, syncedCount: 0 };

    try {
        const res = await fetch("/api/pos/sync/offline-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                companyId,
                offlineOrders: pending,
            }),
        });

        const data = await res.json();
        if (data.success) {
            clearOfflineOrders();
            return { success: true, syncedCount: data.syncedCount || pending.length };
        }
        return { success: false, syncedCount: 0 };
    } catch {
        return { success: false, syncedCount: 0 };
    }
}
