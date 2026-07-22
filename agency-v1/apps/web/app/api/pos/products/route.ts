import { NextResponse } from "next/server";

export async function GET() {
    try {
        const posServiceUrl = process.env.POS_SERVICE_URL || "http://localhost:4020";
        const res = await fetch(`${posServiceUrl}/api/pos/products`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
        }
    } catch {
        // Fallback gracefully to default catalog
    }

    return NextResponse.json({
        success: true,
        companyId: "company_default_pos",
        products: [
            { id: "p1", title: "Consultoría Estratégica POS (1 hora)", sku: "SERV-001", barcode: "7701001001", category: "Servicios", unitPrice: 150000, costPrice: 65000, wholesalePrice: 125000, taxRate: 0.19, stock: 99 },
            { id: "p2", title: "Plan Branding & Identidad Corporativa", sku: "BRAND-002", barcode: "7701001002", category: "Diseño", unitPrice: 850000, costPrice: 380000, wholesalePrice: 720000, taxRate: 0.19, stock: 50 },
            { id: "p3", title: "Desarrollo Web Next.js MVP", sku: "WEB-003", barcode: "7701001003", category: "Desarrollo", unitPrice: 1200000, costPrice: 550000, wholesalePrice: 990000, taxRate: 0.19, stock: 20 },
            { id: "p4", title: "Bolsa 100K Peticiones API Gateway", sku: "API-004", barcode: "7701001004", category: "SaaS", unitPrice: 120000, costPrice: 35000, wholesalePrice: 95000, taxRate: 0.19, stock: 999 },
            { id: "p5", title: "Impresora Térmica POS 80mm USB/LAN", sku: "HW-005", barcode: "7701001005", category: "Hardware", unitPrice: 380000, costPrice: 210000, wholesalePrice: 310000, taxRate: 0.19, stock: 15 },
            { id: "p6", title: "Lector Código de Barras Láser 2D", sku: "HW-006", barcode: "7701001006", category: "Hardware", unitPrice: 195000, costPrice: 98000, wholesalePrice: 155000, taxRate: 0.19, stock: 25 },
        ]
    });
}
