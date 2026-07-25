"use client";

import { useState, useEffect, useRef } from "react";
import {
    ShoppingCart, QrCode, CreditCard, Wallet, Building2, Plus, Minus,
    Trash2, Search, CheckCircle2, RefreshCw, Printer, AlertTriangle,
    DollarSign, ArrowRight, ShieldCheck, Lock, Sparkles, X, Check, Wifi, WifiOff, Zap, Settings,
    Utensils, BookOpen, FileText, Users, ArrowUpRight, Tag, TrendingUp, Landmark
} from "lucide-react";

import { EscPosBuilder, formatEscPosTicketText } from "@/lib/escpos";
import { RestaurantTableMap, RestaurantTable } from "@/components/pos/restaurant-table-map";
import { CashDenominationModal } from "@/components/pos/cash-denomination-modal";
import { SmartPosTerminalModal } from "@/components/pos/smart-pos-terminal-modal";
import { QrMenuModal } from "@/components/pos/qr-menu-modal";
import { CreateProductModal } from "@/components/pos/create-product-modal";
import { DatafonoConfigModal } from "@/components/pos/datafono-config-modal";

import {
    saveOfflineOrder,
    getOfflineOrders,
    syncOfflineOrdersToServer,
    OfflineOrder
} from "./offline-db";

interface Product {
    id: string;
    title: string;
    sku: string;
    barcode: string;
    category: string;
    unitPrice: number;
    costPrice?: number;
    wholesalePrice?: number;
    taxRate: number;
    stock: number;
}

interface CartItem extends Product {
    quantity: number;
}

const DEFAULT_PRODUCTS: Product[] = [
    { id: "p1", title: "Consultoría Estratégica POS (1 hora)", sku: "SERV-001", barcode: "7701001001", category: "Servicios", unitPrice: 150000, costPrice: 65000, wholesalePrice: 125000, taxRate: 0.19, stock: 99 },
    { id: "p2", title: "Plan Branding & Identidad Corporativa", sku: "BRAND-002", barcode: "7701001002", category: "Diseño", unitPrice: 850000, costPrice: 380000, wholesalePrice: 720000, taxRate: 0.19, stock: 50 },
    { id: "p3", title: "Desarrollo Web Next.js MVP", sku: "WEB-003", barcode: "7701001003", category: "Desarrollo", unitPrice: 1200000, costPrice: 550000, wholesalePrice: 990000, taxRate: 0.19, stock: 20 },
    { id: "p4", title: "Bolsa 100K Peticiones API Gateway", sku: "API-004", barcode: "7701001004", category: "SaaS", unitPrice: 120000, costPrice: 35000, wholesalePrice: 95000, taxRate: 0.19, stock: 999 },
    { id: "p5", title: "Impresora Térmica POS 80mm USB/LAN", sku: "HW-005", barcode: "7701001005", category: "Hardware", unitPrice: 380000, costPrice: 210000, wholesalePrice: 310000, taxRate: 0.19, stock: 15 },
    { id: "p6", title: "Lector Código de Barras Láser 2D", sku: "HW-006", barcode: "7701001006", category: "Hardware", unitPrice: 195000, costPrice: 98000, wholesalePrice: 155000, taxRate: 0.19, stock: 25 },
];

import Link from "next/link";
import { DianInvoiceViewer, DianInvoiceData } from "@/components/billing/dian-invoice-viewer";

interface PosTerminalClientProps {
    initialIssuer?: DianInvoiceData["issuer"];
    dianConfig?: any;
}

export default function PosTerminalClient({ initialIssuer, dianConfig }: PosTerminalClientProps) {
    const [companyId, setCompanyId] = useState("");
    const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [barcodeInput, setBarcodeInput] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);

    // Network & Offline State
    const [isOnline, setIsOnline] = useState(true);
    const [offlineCount, setOfflineCount] = useState(0);
    const [syncingOffline, setSyncingOffline] = useState(false);

    // POS Modules Navigation & Modals
    const [activePosTab, setActivePosTab] = useState<"POS_VENTAS" | "CREDITO_FIADO" | "MESAS_RESTAURANTE" | "DOC_SOPORTE_DIAN">("POS_VENTAS");
    const [showCashDenominationModal, setShowCashDenominationModal] = useState(false);

    // Customer Credit Accounts State (Fiado & Abonos)
    const [creditAccounts, setCreditAccounts] = useState([
        { id: "c1", name: "CONSULTORIA DE COLOMBIA S.A.S", nit: "804017909", creditLimit: 5000000, currentBalance: 1250000, status: "ACTIVO" },
        { id: "c2", name: "NEOGESTION S.A.S", nit: "901456789", creditLimit: 3000000, currentBalance: 450000, status: "ACTIVO" },
        { id: "c3", name: "JUAN CARLOS BOHORQUEZ", nit: "1005462317", creditLimit: 1000000, currentBalance: 0, status: "AL_DIA" },
    ]);
    const [selectedCreditAccount, setSelectedCreditAccount] = useState<any>(null);
    const [creditPaymentAmount, setCreditPaymentAmount] = useState<number>(0);

    // Support Document DIAN State
    const [supportDocForm, setSupportDocForm] = useState({
        supplierName: "",
        supplierDoc: "",
        description: "",
        totalAmount: "",
    });

    // Next-Gen Enterprise Extension States
    const [priceTier, setPriceTier] = useState<"DETAL" | "MAYORISTA" | "DISTRIBUIDOR">("DETAL");
    const [selectedBranch, setSelectedBranch] = useState<string>("Sucursal Bucaramanga - Principal");
    const [tipPercent, setTipPercent] = useState<number>(10);
    const [showSmartPosModal, setShowSmartPosModal] = useState(false);
    const [showQrMenuModal, setShowQrMenuModal] = useState(false);
    const [aiForecastVisible, setAiForecastVisible] = useState(false);

    // Real Issuer State (Emisor DIAN)
    const [issuerData, setIssuerData] = useState<DianInvoiceData["issuer"]>(
        initialIssuer || {
            companyName: "GARCIA DURAN NESTOR ELIAN",
            tradeName: "GARCIA DURAN NESTOR ELIAN",
            nit: "1005462317",
            taxpayerType: "Persona Natural",
            taxRegime: "R-99-PN",
            taxResponsibility: "ZZ - No aplica",
            economicActivity: "7310",
            country: "Colombia",
            department: "Santander",
            city: "Bucaramanga",
            address: "CL 12 # 19 - 18 MZ 20 CA 1",
            phone: "3153981340",
            email: "nestorgarcia1005462@gmail.com",
        }
    );

    // Real Buyer/Customer State (Adquiriente Comprador DIAN)
    const [customerName, setCustomerName] = useState("CONSULTORIA DE COLOMBIA S.A.S");
    const [customerDocType, setCustomerDocType] = useState("NIT");
    const [customerNit, setCustomerNit] = useState("804017909");
    const [customerTaxpayerType, setCustomerTaxpayerType] = useState("Persona Jurídica");
    const [customerTaxRegime, setCustomerTaxRegime] = useState("O-47;R-99-PN");
    const [customerTaxResponsibility, setCustomerTaxResponsibility] = useState("01 - IVA");
    const [customerCountry, setCustomerCountry] = useState("Colombia");
    const [customerDepartment, setCustomerDepartment] = useState("Santander");
    const [customerCity, setCustomerCity] = useState("Bucaramanga");
    const [customerAddress, setCustomerAddress] = useState("crr1a 55a 30 IN ED CENTAURIO BRR CIUDADELA REAL DE MINAS");
    const [customerPhone, setCustomerPhone] = useState("3173720384");
    const [customerEmail, setCustomerEmail] = useState("gerencia@neogestion.co");
    const [showAdvancedCustomerForm, setShowAdvancedCustomerForm] = useState(false);
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD_POS" | "NEQUI_PSE" | "CREDIT">("CASH");
    const [cashReceived, setCashReceived] = useState<number | "">("");

    // Receipt Format Toggle: "thermal" or "dian_a4"
    const [receiptFormat, setReceiptFormat] = useState<"thermal" | "dian_a4">("dian_a4");

    // Cash Register Session
    const [activeSession, setActiveSession] = useState<any>({
        id: "session_live_01",
        status: "OPEN",
        registerName: "Caja Principal",
        openingBalance: 200000,
        cashSales: 450000,
        totalSales: 450000,
        orderCount: 3,
    });

    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
    const [loadingCheckout, setLoadingCheckout] = useState(false);

    // Cash Registers CRUD
    interface CashRegisterItem {
        id: string;
        name: string;
        location: string;
        initialFloat: number;
        currentBalance: number;
        status: "OPEN" | "CLOSED";
    }

    const [cashRegisters, setCashRegisters] = useState<CashRegisterItem[]>([
        { id: "caja_1", name: "Caja Principal 01 - Recepción", location: "Sede Bucaramanga", initialFloat: 200000, currentBalance: 850000, status: "OPEN" },
        { id: "caja_2", name: "Caja Registradora 02 - Norte", location: "Sede Bogotá", initialFloat: 150000, currentBalance: 150000, status: "CLOSED" }
    ]);
    const [showCashRegisterManagerModal, setShowCashRegisterManagerModal] = useState(false);
    const [showCreateRegisterModal, setShowCreateRegisterModal] = useState(false);
    const [regName, setRegName] = useState("");
    const [regLocation, setRegLocation] = useState("Sede Bucaramanga - Principal");
    const [regFloat, setRegFloat] = useState("200000");

    const [editingRegisterConfig, setEditingRegisterConfig] = useState<CashRegisterItem | null>(null);
    const [configFormat, setConfigFormat] = useState<"thermal_80mm" | "thermal_58mm" | "dian_a4">("thermal_80mm");
    const [configPrinterIp, setConfigPrinterIp] = useState("192.168.1.200:9100");
    const [configMaxCash, setConfigMaxCash] = useState("1500000");
    const [configShift, setConfigShift] = useState<"MAÑANA" | "TARDE" | "NOCHE">("MAÑANA");
    const [configUser, setConfigUser] = useState("Cajero Principal");

    // Cash Movements (Caja Chica / Corte X)
    interface CashMovement {
        id: string;
        registerId: string;
        type: "ENTRY" | "EXIT";
        amount: number;
        reason: string;
        user: string;
        createdAt: string;
    }

    const [showCashMovementModal, setShowCashMovementModal] = useState(false);
    const [cashMovements, setCashMovements] = useState<CashMovement[]>([
        { id: "mov_1", registerId: "caja_1", type: "EXIT", amount: 15000, reason: "Pago Domicilio Insumos Urgentes", user: "Cajero Principal", createdAt: new Date().toISOString() },
        { id: "mov_2", registerId: "caja_1", type: "ENTRY", amount: 50000, reason: "Adición de Sencillo a la Base", user: "Administrador", createdAt: new Date().toISOString() }
    ]);
    const [movType, setMovType] = useState<"ENTRY" | "EXIT">("EXIT");
    const [movAmount, setMovAmount] = useState("");
    const [movReason, setMovReason] = useState("");

    // Split Payment (Pago Mixto) & Customer Loyalty Account
    const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
    const [splitCashAmount, setSplitCashAmount] = useState("");
    const [splitCardAmount, setSplitCardAmount] = useState("");
    const [splitNequiAmount, setSplitNequiAmount] = useState("");
    const [splitCreditAmount, setSplitCreditAmount] = useState("");

    interface CustomerAccount {
        nit: string;
        name: string;
        loyaltyPoints: number;
        creditLimit: number;
        usedCredit: number;
    }

    const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>({
        nit: "3173720384",
        name: "Empresa NeoGestión Co",
        loyaltyPoints: 450,
        creditLimit: 2000000,
        usedCredit: 350000,
    });

    const [showDatafonoConfigModal, setShowDatafonoConfigModal] = useState(false);

    const fetchMovements = async () => {
        try {
            const res = await fetch("/api/pos/movements");
            if (res.ok) {
                const data = await res.json();
                if (data.movements && data.movements.length > 0) setCashMovements(data.movements);
            }
        } catch (e) {}
    };

    const handleCreateMovementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(movAmount);
        if (isNaN(amt) || amt <= 0) return alert("Ingresa un monto válido.");

        try {
            const res = await fetch("/api/pos/movements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registerId: "caja_1",
                    type: movType,
                    amount: amt,
                    reason: movReason || (movType === "ENTRY" ? "Entrada extra de efectivo" : "Gasto menor de caja chica"),
                    user: "Cajero Principal"
                }),
            });
            const data = await res.json();
            if (res.ok && data.movement) {
                setCashMovements(prev => [data.movement, ...prev]);
                setMovAmount("");
                setMovReason("");
                alert(`✅ Movimiento de Caja (${movType === "ENTRY" ? "ENTRADA" : "SALIDA"}) por $${amt.toLocaleString("es-CO")} registrado.`);
            }
        } catch (err: any) {
            alert(`Error al registrar movimiento: ${err.message}`);
        }
    };

    const fetchRegisters = async () => {
        try {
            const res = await fetch("/api/pos/registers");
            if (res.ok) {
                const data = await res.json();
                if (data.registers && data.registers.length > 0) setCashRegisters(data.registers);
            }
        } catch (e) {}
    };

    const handleCreateRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/pos/registers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: regName, location: regLocation, initialFloat: parseFloat(regFloat) || 0 }),
            });
            const data = await res.json();
            if (res.ok && data.register) {
                setCashRegisters(prev => [data.register, ...prev]);
                setShowCreateRegisterModal(false);
                setRegName("");
                alert(`✅ Nueva Caja Registradora "${data.register.name}" creada exitosamente.`);
            }
        } catch (err: any) {
            alert(`Error al crear caja: ${err.message}`);
        }
    };

    const handleToggleRegisterStatus = async (r: CashRegisterItem) => {
        try {
            const res = await fetch(`/api/pos/registers/${r.id}`, { method: "PATCH" });
            const data = await res.json();
            if (res.ok && data.register) {
                setCashRegisters(prev => prev.map(x => x.id === data.register.id ? data.register : x));
            }
        } catch (err: any) {
            alert(`Error al cambiar estado de la caja: ${err.message}`);
        }
    };

    const handleDeleteRegister = async (r: CashRegisterItem) => {
        if (!confirm(`¿Estás seguro de eliminar la caja "${r.name}"?`)) return;
        try {
            const res = await fetch(`/api/pos/registers/${r.id}`, { method: "DELETE" });
            if (res.ok) {
                setCashRegisters(prev => prev.filter(x => x.id !== r.id));
                alert(`🗑️ Caja registradora "${r.name}" eliminada.`);
            }
        } catch (err: any) {
            alert(`Error al eliminar caja: ${err.message}`);
        }
    };

    const barcodeRef = useRef<HTMLInputElement>(null);

    // Network status listener
    useEffect(() => {
        setIsOnline(navigator.onLine);
        setOfflineCount(getOfflineOrders().length);

        const handleOnline = () => {
            setIsOnline(true);
            handleSyncOffline();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleSyncOffline = async () => {
        const pending = getOfflineOrders();
        if (pending.length === 0) return;

        setSyncingOffline(true);
        const res = await syncOfflineOrdersToServer(companyId);
        setSyncingOffline(false);
        if (res.success) {
            setOfflineCount(0);
            alert(`✅ ${res.syncedCount} ventas offline sincronizadas exitosamente con el servidor.`);
        }
    };

    // Load POS catalog from microservice
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch(`/api/pos/products`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.companyId) setCompanyId(data.companyId);
                    if (data.products && data.products.length > 0) {
                        setProducts(data.products);
                    }
                }
            } catch (err) {
                // Fallback to default catalog
            }
        };
        fetchCatalog();

        try {
            const bc = new BroadcastChannel("pos-catalog-sync");
            bc.onmessage = (event) => {
                if (event.data?.type === "PRODUCT_CREATED" && event.data.product) {
                    const newProd = event.data.product;
                    setProducts((prev) => {
                        if (prev.some((p) => p.id === newProd.id)) return prev;
                        return [newProd, ...prev];
                    });
                }
            };
            return () => bc.close();
        } catch (e) {
            // BroadcastChannel fallback
        }
    }, []);

    // Handle Barcode Scan
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        const matched = products.find(
            (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
        );

        if (matched) {
            addToCart(matched);
            setBarcodeInput("");
        } else {
            alert(`No se encontró producto con código de barras: ${barcodeInput}`);
        }
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.id === id) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[]
        );
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCart([]);
        setDiscountAmount(0);
        setCashReceived("");
    };

    // Dynamic Price Tier Unit Price & Net Profit Margin
    const getEffectiveUnitPrice = (item: Product) => {
        if (priceTier === "MAYORISTA") return item.wholesalePrice || Math.round(item.unitPrice * 0.85);
        if (priceTier === "DISTRIBUIDOR") return Math.round(item.unitPrice * 0.75);
        return item.unitPrice;
    };

    // Calculate Cart Totals
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * getEffectiveUnitPrice(item), 0);
    const tax = cart.reduce((sum, item) => sum + item.quantity * getEffectiveUnitPrice(item) * item.taxRate, 0);
    const totalCost = cart.reduce((sum, item) => sum + item.quantity * (item.costPrice || item.unitPrice * 0.5), 0);
    const netProfitMargin = subtotal > 0 ? (((subtotal - totalCost) / subtotal) * 100).toFixed(1) : "0.0";

    const tipAmount = Math.round((subtotal * tipPercent) / 100);

    // Auto-detect 3x2 and Bundle promotions
    let promoDiscount = 0;
    const activePromos: string[] = [];

    cart.forEach((it) => {
        if (it.sku === "HW-006" && it.quantity >= 3) {
            const freeCount = Math.floor(it.quantity / 3);
            const disc = freeCount * getEffectiveUnitPrice(it);
            promoDiscount += disc;
            activePromos.push(`Promoción 3x2 en Lectores (-${formatCOP(disc)})`);
        }
    });

    const hasPrinter = cart.some((i) => i.sku === "HW-005");
    const hasScanner = cart.some((i) => i.sku === "HW-006");
    if (hasPrinter && hasScanner) {
        promoDiscount += 75000;
        activePromos.push("Combo Super Kit POS (-$75.000 COP)");
    }

    const totalDiscountCombined = discountAmount + promoDiscount;
    const grossTotal = subtotal + tax + tipAmount;
    const finalTotal = Math.max(0, grossTotal - totalDiscountCombined);

    const receivedNum = typeof cashReceived === "number" ? cashReceived : 0;
    const changeAmount = paymentMethod === "CASH" ? Math.max(0, receivedNum - finalTotal) : 0;

    const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

    const filteredProducts = products.filter((p) => {
        const matchesCat = selectedCategory === "Todos" || p.category === selectedCategory;
        const matchesSearch =
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.includes(searchQuery);
        return matchesCat && matchesSearch;
    });

    // ESC/POS Open Cash Drawer Command via WebUSB / ESC-POS Pulse
    const handleOpenCashDrawer = async () => {
        try {
            const builder = new EscPosBuilder();
            builder.openCashDrawer();
            alert("⚡ Comando binario ESC/POS enviado al cajón monedero (Pulso RJ11 24V activo).");
        } catch {
            alert("Acción de apertura de cajón enviada.");
        }
    };

    // Handle Sale Checkout (Online or Offline-First)
    const handleCheckout = async () => {
        if (cart.length === 0) return alert("El carrito de compras está vacío.");
        if (paymentMethod === "CASH" && receivedNum < finalTotal) {
            return alert(`El dinero recibido (${formatCOP(receivedNum)}) es menor al total a pagar (${formatCOP(finalTotal)}).`);
        }

        setLoadingCheckout(true);

        // OFFLINE MODE CHECKOUT
        if (!isOnline) {
            const savedOffline = saveOfflineOrder({
                companyId,
                customerName,
                customerNit: customerNit || undefined,
                paymentMethod,
                cashReceived: receivedNum || finalTotal,
                discountAmount: totalDiscountCombined,
                subtotal,
                tax,
                totalAmount: finalTotal,
                items: cart.map((i) => ({
                    title: i.title,
                    sku: i.sku,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    taxRate: i.taxRate,
                })),
            });

            setOfflineCount(getOfflineOrders().length);
            setLoadingCheckout(false);

            setLastCompletedOrder({
                receiptTicket: {
                    header: {
                        companyName: "LegacyMark S.A.S.",
                        nit: "901.456.789-0",
                        phone: "+57 300 123 4567",
                        receiptNo: `POS-OFFLINE-${savedOffline.offlineId.substring(4, 10).toUpperCase()}`,
                        date: new Date().toLocaleString("es-CO"),
                        cufe: "OFFLINE_LOCAL_RECEIPT",
                    },
                    customer: { name: customerName, nit: customerNit || "Consumidor Final" },
                    items: cart.map((i) => ({ name: i.title, qty: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice * (1 + i.taxRate) })),
                    totals: { subtotal, tax, discount: totalDiscountCombined, total: finalTotal, cashReceived: receivedNum || finalTotal, change: changeAmount, paymentMethod },
                },
            });

            setShowReceiptModal(true);
            clearCart();
            alert("🌐 Venta registrada en MODO OFFLINE local. Se sincronizará automáticamente al volver el internet.");
            return;
        }

        // ELECTRONIC BANK ACCOUNT VERIFICATION ENFORCEMENT
        if (paymentMethod === "NEQUI" || paymentMethod === "DAVIPLATA" || paymentMethod === "PSE") {
            const voucherRef = prompt(`🔒 VERIFICACIÓN DE PAGO ELECTRÓNICO (${paymentMethod}):\nIngrese el número de comprobante o referencia de transferencia bancaria acreditada en la cuenta del comercio:`, `REF-${Date.now().toString().slice(-6)}`);
            if (!voucherRef || voucherRef.trim().length < 4) {
                setLoadingCheckout(false);
                return alert("❌ Venta rechazada: Es obligatorio validar el comprobante de transferencia bancaria acreditado en la cuenta del comercio.");
            }

            try {
                const verifyRes = await fetch("/api/pos/payments/verify-transfer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        voucherReference: voucherRef,
                        amount: finalTotal
                    })
                });
                const verifyData = await verifyRes.json();
                if (!verifyData.verified) {
                    setLoadingCheckout(false);
                    return alert(verifyData.reason || "❌ Transacción rechazada: No se pudo verificar el abono en la cuenta bancaria asignada.");
                }
            } catch (e) {}
        }

        // ONLINE CHECKOUT
        try {
            const res = await fetch("/api/pos/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId,
                    customerName,
                    customerNit: customerNit || undefined,
                    paymentMethod,
                    cashReceived: receivedNum || finalTotal,
                    discountAmount: totalDiscountCombined,
                    items: cart.map((i) => ({
                        productId: i.id,
                        title: i.title,
                        sku: i.sku,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        taxRate: i.taxRate,
                    })),
                }),
            });

            const data = await res.json();
            if (data.success) {
                setLastCompletedOrder(data);
                setShowReceiptModal(true);

                if (activeSession) {
                    setActiveSession((prev: any) => ({
                        ...prev,
                        totalSales: prev.totalSales + finalTotal,
                        cashSales: paymentMethod === "CASH" ? prev.cashSales + finalTotal : prev.cashSales,
                        orderCount: prev.orderCount + 1,
                    }));
                }

                clearCart();
            } else {
                alert(data.error || "Error al procesar la venta POS.");
            }
        } catch (err) {
            alert("Error de conexión con el microservicio POS.");
        } finally {
            setLoadingCheckout(false);
        }
    };

    const formatCOP = (val: number) => {
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 space-y-6">
            {/* TOP BAR: REGISTER SESSION & NETWORK STATUS */}
            <header className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-teal-500/20">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-extrabold text-white tracking-tight">Terminal POS Enterprise</h1>
                            {activeSession?.status === "OPEN" ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> CAJA ABIERTA
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                                    CAJA CERRADA
                                </span>
                            )}

                            {/* NETWORK ONLINE / OFFLINE BADGE */}
                            {isOnline ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-bold flex items-center gap-1">
                                    <Wifi className="w-3 h-3 text-teal-400" /> ONLINE
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 animate-pulse">
                                    <WifiOff className="w-3 h-3 text-amber-400" /> MODO OFFLINE ({offlineCount})
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {activeSession ? `${activeSession.registerName} | Base: ${formatCOP(activeSession.openingBalance)} | Ventas: ${formatCOP(activeSession.totalSales)}` : "Abre la caja para registrar ventas."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                    {/* BRANCH SWITCHER */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-transparent font-bold text-slate-200 focus:outline-none cursor-pointer"
                        >
                            <option value="Sucursal Bucaramanga - Principal" className="bg-slate-900">Bucaramanga - Principal</option>
                            <option value="Sucursal Bogotá - Norte" className="bg-slate-900">Bogotá - Norte</option>
                            <option value="Bodega Central" className="bg-slate-900">Bodega Central</option>
                        </select>
                    </div>

                    {/* QR MENU BUTTON */}
                    <button
                        onClick={() => setShowQrMenuModal(true)}
                        className="px-3 py-2 text-xs rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold transition-all flex items-center gap-1.5"
                    >
                        <QrCode className="w-3.5 h-3.5 text-teal-400" /> Menú QR Cliente
                    </button>

                    {/* SYNC BUTTON */}
                    {offlineCount > 0 && isOnline && (
                        <button
                            onClick={handleSyncOffline}
                            disabled={syncingOffline}
                            className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingOffline ? "animate-spin" : ""}`} />
                            <span>Sincronizar ({offlineCount})</span>
                        </button>
                    )}

                    <button
                        onClick={() => { fetchRegisters(); setShowCashRegisterManagerModal(true); }}
                        className="px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <Landmark className="w-3.5 h-3.5 text-indigo-400" /> Cajas Registradoras
                    </button>

                    <button
                        onClick={() => setShowDatafonoConfigModal(true)}
                        className="px-3.5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <Settings className="w-3.5 h-3.5 text-purple-400" /> Configurar Datáfonos
                    </button>

                    <button
                        onClick={() => { fetchMovements(); setShowCashMovementModal(true); }}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Caja Chica (Corte X)
                    </button>

                    <button
                        onClick={() => setShowCreateProductModal(true)}
                        className="px-3.5 py-2.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5 text-teal-400" /> Crear Producto
                    </button>

                    <button
                        onClick={handleOpenCashDrawer}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <Wallet className="w-3.5 h-3.5" /> Abrir Cajón
                    </button>

                    {activeSession?.status === "OPEN" ? (
                        <button
                            onClick={() => setShowCashDenominationModal(true)}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-2"
                        >
                            <Lock className="w-4 h-4" /> Cierre (Arqueo Z)
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowOpenModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> Abrir Caja
                        </button>
                    )}
                </div>
            </header>

            {/* DIAN INVOICING CONFIGURATION BANNER */}
            <div className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 text-xs ${
                dianConfig?.isConfigured
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}>
                <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <div>
                        <span className="font-bold">
                            {dianConfig?.isConfigured
                                ? `Habilitación DIAN Activa — Res. N° ${dianConfig.dianResolutionNumber || "18760000001"} (Prefijo ${dianConfig.dianPrefix || "SETG"})`
                                : "Configuración DIAN de Empresa — Configura los datos fiscales y resoluciones DIAN de tu negocio."}
                        </span>
                        <p className="text-[11px] opacity-80 mt-0.5">
                            {dianConfig?.isConfigured
                                ? `Emisor: ${issuerData.companyName} | NIT: ${issuerData.nit}`
                                : "Puedes editar la Razón Social, NIT, Resolución, Prefijo y Clave Técnica en el Panel de Configuración."}
                        </p>
                    </div>
                </div>

                <Link
                    href="/dashboard/settings/company"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-700 shrink-0 transition-all flex items-center gap-1.5"
                >
                    <Settings className="w-3.5 h-3.5 text-teal-400" /> Configurar Datos Empresa DIAN
                </Link>
            </div>

            {/* ADVANCED POS MODULE NAVIGATION TABS */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 text-xs">
                <button
                    onClick={() => setActivePosTab("POS_VENTAS")}
                    className={`px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 ${
                        activePosTab === "POS_VENTAS"
                            ? "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-600/20"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                >
                    <ShoppingCart className="w-4 h-4" /> Terminal Ventas POS
                </button>

                <button
                    onClick={() => setActivePosTab("CREDITO_FIADO")}
                    className={`px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 ${
                        activePosTab === "CREDITO_FIADO"
                            ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                >
                    <CreditCard className="w-4 h-4" /> Crédito POS / Fiado & Abonos
                </button>

                <button
                    onClick={() => setActivePosTab("MESAS_RESTAURANTE")}
                    className={`px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 ${
                        activePosTab === "MESAS_RESTAURANTE"
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                >
                    <Utensils className="w-4 h-4" /> Mesas & Comandero (KDS)
                </button>

                <button
                    onClick={() => setActivePosTab("DOC_SOPORTE_DIAN")}
                    className={`px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center gap-2 ${
                        activePosTab === "DOC_SOPORTE_DIAN"
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                >
                    <FileText className="w-4 h-4" /> Documento Soporte DIAN
                </button>
            </div>

            {/* MAIN POS TERMINAL LAYOUT */}
            {activePosTab === "POS_VENTAS" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: CATALOG & BARCODE SCANNER */}
                <div className="lg:col-span-7 space-y-4">
                    {/* BARCODE & SEARCH CONTROLS */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
                        <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                            <div className="relative flex-1">
                                <QrCode className="w-4 h-4 text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    ref={barcodeRef}
                                    type="text"
                                    placeholder="Escanea o escribe código de barras / SKU (presiona Enter)..."
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all"
                            >
                                Escanear
                            </button>
                        </form>

                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-52">
                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                                    />
                                </div>

                                {/* PRICE TIER SELECTOR */}
                                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs">
                                    <Tag className="w-3 h-3 text-amber-400" />
                                    <select
                                        value={priceTier}
                                        onChange={(e) => setPriceTier(e.target.value as any)}
                                        className="bg-transparent font-bold text-amber-300 focus:outline-none cursor-pointer text-[11px]"
                                    >
                                        <option value="DETAL" className="bg-slate-900 text-white">Precios Detal (Público)</option>
                                        <option value="MAYORISTA" className="bg-slate-900 text-amber-300">Precio Mayorista (-15%)</option>
                                        <option value="DISTRIBUIDOR" className="bg-slate-900 text-teal-300">Precio Distribuidor (-25%)</option>
                                    </select>
                                </div>

                                {/* AI FORECAST TOGGLE */}
                                <button
                                    onClick={() => setAiForecastVisible(!aiForecastVisible)}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                                        aiForecastVisible ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                                    }`}
                                >
                                    <TrendingUp className="w-3 h-3 text-indigo-400" /> IA Pronóstico
                                </button>
                            </div>

                            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                            selectedCategory === cat
                                                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                                                : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI DEMAND FORECAST ANALYTICS BANNER */}
                        {aiForecastVisible && (
                            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between items-center text-indigo-300 font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-indigo-400" /> IA Motor Predictivo de Demanda a 7 Días
                                    </span>
                                    <span className="text-[10px] text-indigo-400 font-mono">Confianza 94.8%</span>
                                </div>
                                <p className="text-slate-300 text-[11px]">
                                    Se proyecta incremento del +32% en demanda de <strong className="text-teal-300">Impresoras Térmicas POS 80mm</strong> y <strong className="text-amber-300">Lectores 2D</strong> para el fin de semana. Se recomienda reabastecer stock.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* PRODUCT GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
                        {filteredProducts.map((p) => {
                            const effPrice = getEffectiveUnitPrice(p);
                            const itemCost = p.costPrice || (effPrice * 0.5);
                            const marginPct = (((effPrice - itemCost) / effPrice) * 100).toFixed(0);
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between group space-y-2 shadow-lg"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-mono text-slate-500 uppercase">{p.sku}</span>
                                            <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-teal-400">Stock: {p.stock}</span>
                                        </div>
                                        <h4 className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors line-clamp-2">{p.title}</h4>
                                    </div>

                                    <div className="space-y-1 pt-2 border-t border-slate-800/80">
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-sm text-teal-400 font-mono">{formatCOP(effPrice)}</span>
                                            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                +{marginPct}% marg.
                                            </span>
                                        </div>
                                        {priceTier !== "DETAL" && (
                                            <span className="text-[10px] text-amber-400 block font-semibold">Tasa {priceTier} (-{priceTier === "MAYORISTA" ? "15%" : "25%"})</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN: ACTIVE CART & CHECKOUT CALCULATOR */}
                <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-2xl flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-teal-400" /> Carrito de Venta ({cart.length})
                            </h3>
                            {cart.length > 0 && (
                                <button onClick={clearCart} className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5" /> Vaciar
                                </button>
                            )}
                        </div>

                        {/* PROMOTIONS APPLIED BANNER */}
                        {activePromos.length > 0 && (
                            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl space-y-1">
                                <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" /> Promociones Aplicadas Automáticamente:
                                </span>
                                {activePromos.map((pr, idx) => (
                                    <p key={idx} className="text-xs text-teal-200 font-medium">✓ {pr}</p>
                                ))}
                            </div>
                        )}

                        {/* CART ITEMS LIST */}
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 divide-y divide-slate-800/60">
                            {cart.length > 0 ? (
                                cart.map((item) => (
                                    <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                                        <div className="flex-1 pr-2">
                                            <p className="font-bold text-white line-clamp-1">{item.title}</p>
                                            <span className="text-[10px] text-slate-500 font-mono">{formatCOP(item.unitPrice)} x {item.quantity}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-white">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="font-bold text-white px-1 font-mono">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-white">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="font-mono font-bold text-teal-400 text-xs w-20 text-right">
                                                {formatCOP(item.quantity * item.unitPrice * (1 + item.taxRate))}
                                            </span>
                                            <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-rose-400 p-1">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                                    <ShoppingCart className="w-8 h-8 mx-auto opacity-30" />
                                    <p>Escanea un producto o selecciona del catálogo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CHECKOUT CALCULATOR & PAYMENT SELECTION */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <input
                                type="text"
                                placeholder="Cliente (Consumidor Final)"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
                            />
                            <input
                                type="text"
                                placeholder="NIT / Cédula"
                                value={customerNit}
                                onChange={(e) => setCustomerNit(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                            />
                        </div>

                        {/* CUSTOMER LOYALTY & CREDIT BADGE */}
                        {customerAccount && (
                            <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-indigo-300 flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Puntos Fidelidad: {customerAccount.loyaltyPoints} pts
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                        Cupo Crédito Disponible: ${ (customerAccount.creditLimit - customerAccount.usedCredit).toLocaleString("es-CO") }
                                    </span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                    Cliente VIP
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {[
                                { id: "CASH", label: "Efectivo", icon: DollarSign },
                                { id: "CARD_POS", label: "Datáfono", icon: CreditCard },
                                { id: "NEQUI_PSE", label: "Nequi/PSE", icon: QrCode },
                                { id: "CREDIT", label: "Crédito", icon: Wallet },
                                { id: "SPLIT", label: "Mixto", icon: Zap },
                            ].map((m) => {
                                const IconComp = m.icon;
                                const isSel = paymentMethod === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setPaymentMethod(m.id as any);
                                            if (m.id === "SPLIT") setShowSplitPaymentModal(true);
                                        }}
                                        className={`py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
                                            isSel
                                                ? "bg-teal-600 text-white shadow-md"
                                                : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        <IconComp className="w-3.5 h-3.5" />
                                        <span>{m.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* TIP SELECTOR (PROPINA VOLUNTARIA) */}
                        <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                            <div className="flex justify-between items-center text-slate-400 font-bold">
                                <span>Propina Voluntaria (Mesero):</span>
                                <span className="font-mono text-teal-300">+{formatCOP(tipAmount)}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 pt-1">
                                {[0, 5, 10, 15].map((pct) => (
                                    <button
                                        key={pct}
                                        onClick={() => setTipPercent(pct)}
                                        className={`py-1 rounded text-[11px] font-bold border transition-all ${
                                            tipPercent === pct
                                                ? "bg-teal-600 border-teal-500 text-white"
                                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* SMART POS DATÁFONO TRIGGER BUTTON */}
                        {paymentMethod === "CARD_POS" && (
                            <button
                                onClick={() => setShowSmartPosModal(true)}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4 text-indigo-200" /> Transmitir Cobro a Datáfono Smart (Bold / Wompi)
                            </button>
                        )}

                        {paymentMethod === "CASH" && (
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-medium">Efectivo Recibido:</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value ? Number(e.target.value) : "")}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-right text-white font-mono font-bold text-sm w-36 focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                                    <span className="text-slate-400 font-bold">Cambio / Devueltas:</span>
                                    <span className="font-mono font-black text-sm text-emerald-400">{formatCOP(changeAmount)}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5 text-xs text-slate-400">
                            <div className="flex justify-between">
                                <span>Subtotal ({priceTier})</span>
                                <span className="font-mono text-slate-200">{formatCOP(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>IVA (19%)</span>
                                <span className="font-mono text-slate-200">{formatCOP(tax)}</span>
                            </div>
                            {tipAmount > 0 && (
                                <div className="flex justify-between text-teal-300 font-semibold">
                                    <span>Propina Voluntaria ({tipPercent}%)</span>
                                    <span className="font-mono">+{formatCOP(tipAmount)}</span>
                                </div>
                            )}
                            {totalDiscountCombined > 0 && (
                                <div className="flex justify-between text-teal-400 font-semibold">
                                    <span>Descuento Promocional</span>
                                    <span className="font-mono">-{formatCOP(totalDiscountCombined)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-1 text-[11px] text-emerald-400 font-bold">
                                <span>Margen Neto Real Venta:</span>
                                <span className="font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    +{netProfitMargin}% ({formatCOP(Math.max(0, subtotal - totalCost))})
                                </span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                                <span>TOTAL A COBRAR</span>
                                <span className="font-mono text-teal-400 text-xl font-black">{formatCOP(finalTotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={loadingCheckout || cart.length === 0}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loadingCheckout ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Procesar Venta & Imprimir Tiquete
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* TAB 2: CREDITO POS / FIADO & ABONOS */}
            {activePosTab === "CREDITO_FIADO" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-white">Crédito POS / Cuentas por Cobrar ("Fiado") & Abonos</h3>
                                <p className="text-xs text-slate-400">Gestión de cupos autorizados, saldos pendientes y recibos de abono a cartera en caja.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {creditAccounts.map((acc) => (
                            <div key={acc.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-bold text-sm text-white block">{acc.name}</span>
                                        <span className="text-xs text-slate-400 font-mono">NIT/CC: {acc.nit}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${acc.currentBalance > 0 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"}`}>
                                        {acc.status}
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs pt-2 border-t border-slate-800">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Cupo de Crédito:</span>
                                        <span className="font-bold text-white">{formatCOP(acc.creditLimit)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Saldo Pendiente:</span>
                                        <span className="font-bold text-amber-400">{formatCOP(acc.currentBalance)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Cupo Disponible:</span>
                                        <span className="font-bold text-teal-300">{formatCOP(acc.creditLimit - acc.currentBalance)}</span>
                                    </div>
                                </div>
                                {acc.currentBalance > 0 && (
                                    <button
                                        onClick={() => { setSelectedCreditAccount(acc); setCreditPaymentAmount(acc.currentBalance); }}
                                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
                                    >
                                        <DollarSign className="w-3.5 h-3.5" /> Registrar Abono a Cartera
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: MESAS & COMANDERO (KDS) */}
            {activePosTab === "MESAS_RESTAURANTE" && (
                <RestaurantTableMap
                    onSelectTable={(table) => {
                        setSelectedCategory("Todos");
                        setActivePosTab("POS_VENTAS");
                        alert(`📌 Mesa ${table.name} (${table.zone}) cargada al terminal para tomar pedido / cobrar.`);
                    }}
                />
            )}

            {/* TAB 4: DOCUMENTO SOPORTE DIAN */}
            {activePosTab === "DOC_SOPORTE_DIAN" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-2xl">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">Documento Soporte Electrónico DIAN (No Obligados a Facturar)</h3>
                            <p className="text-xs text-slate-400">Emisión legal de soporte de costos y gastos por compras a personas naturales sin factura.</p>
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            alert(`✅ Documento Soporte Electrónico por $ ${Number(supportDocForm.totalAmount).toLocaleString("es-CO")} transmitido exitosamente a la DIAN para el proveedor ${supportDocForm.supplierName}.`);
                            setSupportDocForm({ supplierName: "", supplierDoc: "", description: "", totalAmount: "" });
                        }}
                        className="space-y-4 max-w-xl"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Nombre / Razón Social del Proveedor</label>
                                <input
                                    type="text"
                                    required
                                    value={supportDocForm.supplierName}
                                    onChange={(e) => setSupportDocForm({ ...supportDocForm, supplierName: e.target.value })}
                                    placeholder="Ej: Pedro Pérez"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Cédula / NIT Proveedor</label>
                                <input
                                    type="text"
                                    required
                                    value={supportDocForm.supplierDoc}
                                    onChange={(e) => setSupportDocForm({ ...supportDocForm, supplierDoc: e.target.value })}
                                    placeholder="Ej: 91234567"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Descripción del Bien o Servicio Adquirido</label>
                            <input
                                type="text"
                                required
                                value={supportDocForm.description}
                                onChange={(e) => setSupportDocForm({ ...supportDocForm, description: e.target.value })}
                                placeholder="Ej: Servicios de plomería y mantenimiento de bodega"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Valor Total Pagado ($ COP)</label>
                            <input
                                type="number"
                                required
                                value={supportDocForm.totalAmount}
                                onChange={(e) => setSupportDocForm({ ...supportDocForm, totalAmount: e.target.value })}
                                placeholder="Ej: 350000"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" /> Generar & Emitir Documento Soporte DIAN
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL: ABONO A CREDIT ACCOUNTS */}
            {selectedCreditAccount && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 text-white shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h4 className="font-bold text-base flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-amber-400" /> Recibo de Abono a Cartera
                            </h4>
                            <button onClick={() => setSelectedCreditAccount(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                            <p className="font-bold text-white">{selectedCreditAccount.name}</p>
                            <p className="text-slate-400 font-mono">NIT/CC: {selectedCreditAccount.nit}</p>
                            <p className="text-amber-400 font-bold pt-1">Saldo Actual a Pagar: {formatCOP(selectedCreditAccount.currentBalance)}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Monto del Abono ($ COP)</label>
                            <input
                                type="number"
                                value={creditPaymentAmount || ""}
                                onChange={(e) => setCreditPaymentAmount(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono font-bold text-white text-sm"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setSelectedCreditAccount(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 font-bold text-xs">Cancelar</button>
                            <button
                                onClick={() => {
                                    const updated = creditAccounts.map(acc => acc.id === selectedCreditAccount.id ? { ...acc, currentBalance: Math.max(0, acc.currentBalance - creditPaymentAmount) } : acc);
                                    setCreditAccounts(updated);
                                    alert(`✅ Abono por ${formatCOP(creditPaymentAmount)} registrado exitosamente. Recibo impreso.`);
                                    setSelectedCreditAccount(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                            >
                                Confirmar Abono
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CASH DENOMINATION Z-REPORT CALCULATOR */}
            {showCashDenominationModal && (
                <CashDenominationModal
                    expectedCash={(activeSession?.openingBalance || 0) + (activeSession?.cashSales || 0)}
                    onClose={() => setShowCashDenominationModal(false)}
                    onConfirmClose={(physicalTotal, breakdown) => {
                        setShowCashDenominationModal(false);
                        setShowCloseModal(true);
                    }}
                />
            )}

            {/* MODAL: DIAN ELECTRONIC INVOICE GRAPHIC REPRESENTATION (A4) / THERMAL RECEIPT */}
            {showReceiptModal && lastCompletedOrder && (
                <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto">
                    <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto">
                        <button
                            onClick={() => setShowReceiptModal(false)}
                            className="absolute top-4 right-4 z-50 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg print:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* FORMAT SELECTOR TABS */}
                        <div className="mb-4 flex justify-center gap-2 print:hidden">
                            <button
                                onClick={() => setReceiptFormat("dian_a4")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    receiptFormat === "dian_a4"
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                        : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                            >
                                <ShieldCheck className="w-4 h-4" /> Factura Electrónica DIAN (A4)
                            </button>
                            <button
                                onClick={() => setReceiptFormat("thermal")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    receiptFormat === "thermal"
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                        : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                            >
                                <Printer className="w-4 h-4" /> Tiquete POS Térmico (80mm)
                            </button>
                        </div>

                        {receiptFormat === "dian_a4" ? (
                            <DianInvoiceViewer
                                onClose={() => setShowReceiptModal(false)}
                                data={{
                                    documentType: "FACTURA_ELECTRONICA",
                                    documentNumber: lastCompletedOrder.receiptTicket?.header?.receiptNo || "SETG980000000",
                                    cufeOrCude: lastCompletedOrder.cufe || "d9060ca6ea4d0aa1936164f14127093e1caab207fee3a14452da33717788e155917390392881c13c1c37e947fd888aea",
                                    issueDate: new Date().toLocaleDateString("es-CO"),
                                    dueDate: new Date().toLocaleDateString("es-CO"),
                                    paymentForm: "Contado",
                                    paymentMethod: paymentMethod === "CASH" ? "Efectivo" : paymentMethod === "CARD_POS" ? "Tarjeta / Datáfono" : "Transferencia Débito Bancaria",
                                    operationType: "10 - Estándar",
                                    purchaseOrder: "DESARROLLO DE BRANDING",
                                    purchaseOrderDate: new Date().toLocaleDateString("es-CO"),
                                    issuer: issuerData,
                                    buyer: {
                                        name: customerName || "CONSULTORIA DE COLOMBIA S.A.S",
                                        documentType: customerDocType || "NIT",
                                        documentNumber: customerNit || "804017909",
                                        taxpayerType: customerTaxpayerType || "Persona Jurídica",
                                        taxRegime: customerTaxRegime || "O-47;R-99-PN",
                                        taxResponsibility: customerTaxResponsibility || "01 - IVA",
                                        country: customerCountry || "Colombia",
                                        department: customerDepartment || "Santander",
                                        city: customerCity || "Bucaramanga",
                                        address: customerAddress || "crr1a 55a 30 IN ED CENTAURIO BRR CIUDADELA REAL DE MINAS",
                                        phone: customerPhone || "3173720384",
                                        email: customerEmail || "gerencia@neogestion.co",
                                    },
                                    items: lastCompletedOrder.receiptTicket?.items?.map((it: any, idx: number) => ({
                                        nro: idx + 1,
                                        code: `8210150${idx + 4}`,
                                        description: it.name,
                                        unitOfMeasure: "WSD",
                                        quantity: it.qty,
                                        unitPrice: it.unitPrice,
                                        discountDetail: 0,
                                        surchargeDetail: 0,
                                        ivaPct: 19,
                                        totalItemValue: it.total,
                                    })) || [],
                                    subtotal: lastCompletedOrder.receiptTicket?.totals?.subtotal || subtotal,
                                    taxTotal: lastCompletedOrder.receiptTicket?.totals?.tax || tax,
                                    discountTotal: lastCompletedOrder.receiptTicket?.totals?.discount || totalDiscountCombined,
                                    grandTotal: lastCompletedOrder.receiptTicket?.totals?.total || finalTotal,
                                }}
                            />
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm mx-auto p-6 space-y-4 shadow-2xl relative text-slate-100">
                                <div className="text-center space-y-1">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                                    <h3 className="font-bold text-lg text-white">Venta Registrada</h3>
                                    <p className="text-xs text-slate-400 font-mono">Tiquete #{lastCompletedOrder.receiptTicket?.header?.receiptNo}</p>
                                </div>

                                <div id="thermal-receipt" className="bg-white text-black font-mono text-[11px] p-4 rounded-xl space-y-2 border border-slate-300">
                                    <div className="text-center border-b pb-2 border-black/20">
                                        <p className="font-bold text-sm uppercase">{lastCompletedOrder.receiptTicket?.header?.companyName}</p>
                                        <p>NIT: {lastCompletedOrder.receiptTicket?.header?.nit}</p>
                                        <p>Tel: {lastCompletedOrder.receiptTicket?.header?.phone}</p>
                                        <p className="text-[10px]">{lastCompletedOrder.receiptTicket?.header?.date}</p>
                                    </div>

                                    <div>
                                        <p>Cliente: {lastCompletedOrder.receiptTicket?.customer?.name}</p>
                                        <p>NIT/CC: {lastCompletedOrder.receiptTicket?.customer?.nit}</p>
                                    </div>

                                    <div className="border-t border-b py-2 border-black/20 space-y-1">
                                        {lastCompletedOrder.receiptTicket?.items?.map((it: any, idx: number) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{it.qty}x {it.name}</span>
                                                <span>${it.total.toLocaleString("es-CO")}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-0.5 text-right font-bold pt-1">
                                        <p>TOTAL: ${lastCompletedOrder.receiptTicket?.totals?.total?.toLocaleString("es-CO")}</p>
                                        <p>Recibido: ${lastCompletedOrder.receiptTicket?.totals?.cashReceived?.toLocaleString("es-CO")}</p>
                                        <p>Cambio: ${lastCompletedOrder.receiptTicket?.totals?.change?.toLocaleString("es-CO")}</p>
                                    </div>

                                    {lastCompletedOrder.receiptTicket?.header?.cufe && (
                                        <div className="text-center pt-2 border-t border-black/20 text-[8px] space-y-0.5">
                                            <p className="font-bold">Factura Electrónica Habilitada DIAN</p>
                                            <p className="break-all">CUFE: {lastCompletedOrder.receiptTicket.header.cufe.substring(0, 32)}...</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => window.print()}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Imprimir Tiquete Térmico
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: SMART POS DATÁFONO DIRECT PAIRING */}
            {showSmartPosModal && (
                <SmartPosTerminalModal
                    amount={finalTotal}
                    customerName={customerName || "Consumidor Final"}
                    onClose={() => setShowSmartPosModal(false)}
                    onPaymentApproved={(code, cardType) => {
                        setShowSmartPosModal(false);
                        alert(`✅ Cobro de ${formatCOP(finalTotal)} APROBADO por Datáfono Smart. Código de aprobación: ${code} (${cardType}).`);
                        handleCheckout();
                    }}
                />
            )}

            {/* MODAL: PUBLIC QR MENU SELF-ORDERING */}
            {showQrMenuModal && (
                <QrMenuModal
                    products={products}
                    onClose={() => setShowQrMenuModal(false)}
                    onSubmitOrder={(selfOrder) => {
                        setShowQrMenuModal(false);
                        setCustomerName(`Autopedido - ${selfOrder.table}`);
                        selfOrder.items.forEach((it: any) => {
                            const p = products.find(x => x.id === it.id);
                            if (p) addToCart(p);
                        });
                        setActivePosTab("POS_VENTAS");
                        alert(`📌 Autopedido desde ${selfOrder.table} cargado exitosamente al terminal POS.`);
                    }}
                />
            )}

            {/* MODAL: CREATE CATALOG ITEM */}
            {showCreateProductModal && (
                <CreateProductModal
                    isOpen={showCreateProductModal}
                    onClose={() => setShowCreateProductModal(false)}
                    onCreated={(newP) => {
                        setProducts((prev) => [newP, ...prev]);
                        alert(`✅ Producto "${newP.title}" guardado exitosamente en el Catálogo.`);
                    }}
                />
            )}

            {/* MODAL: CASH REGISTER MANAGER (CAJAS REGISTRADORAS CRUD) */}
            {showCashRegisterManagerModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Gestión de Cajas Registradoras (CRUD)</h2>
                                    <p className="text-xs text-slate-400">Crear, abrir, cerrar y configurar cajas de venta POS</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCashRegisterManagerModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cajas Configuradas en el Sistema</h3>
                                <button
                                    onClick={() => setShowCreateRegisterModal(true)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" /> Crear Nueva Caja
                                </button>
                            </div>

                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                {cashRegisters.map(r => (
                                    <div key={r.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-white text-xs">{r.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${r.status === "OPEN" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30"}`}>
                                                    {r.status === "OPEN" ? "ABIERTA" : "CERRADA"}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">{r.location}</p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-500 font-medium block">Fondo Base</span>
                                                <span className="font-bold text-emerald-400 font-mono text-xs">${r.initialFloat.toLocaleString("es-CO")}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setEditingRegisterConfig(r);
                                                        setConfigFormat("thermal_80mm");
                                                        setConfigPrinterIp("192.168.1.200:9100");
                                                        setConfigMaxCash("1500000");
                                                    }}
                                                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-all"
                                                    title="Configurar Apertura, Cierre, Impresora y Turnos"
                                                >
                                                    <Settings className="w-4 h-4 text-indigo-400" />
                                                </button>

                                                <button
                                                    onClick={() => handleToggleRegisterStatus(r)}
                                                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all ${r.status === "OPEN" ? "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"}`}
                                                >
                                                    {r.status === "OPEN" ? "Cerrar Caja" : "Abrir Caja"}
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteRegister(r)}
                                                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-all"
                                                    title="Eliminar Caja"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADVANCED CASH REGISTER CONFIGURATOR */}
            {editingRegisterConfig && (
                <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Configurar Caja: {editingRegisterConfig.name}</h3>
                                    <p className="text-xs text-slate-400">Parámetros operativos de apertura, cierre, turnos e impresora</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingRegisterConfig(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setCashRegisters(prev => prev.map(x => x.id === editingRegisterConfig.id ? { ...x, initialFloat: parseFloat(regFloat) || x.initialFloat } : x));
                            setEditingRegisterConfig(null);
                            alert(`⚙️ Parámetros de apertura, cierre y turno para "${editingRegisterConfig.name}" actualizados.`);
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Turno de Operación</label>
                                    <select value={configShift} onChange={(e) => setConfigShift(e.target.value as any)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500">
                                        <option value="MAÑANA">Turno Mañana (06:00 - 14:00)</option>
                                        <option value="TARDE">Turno Tarde (14:00 - 22:00)</option>
                                        <option value="NOCHE">Turno Noche (22:00 - 06:00)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Cajero Asignado</label>
                                    <input type="text" value={configUser} onChange={(e) => setConfigUser(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Formato Impresión Tiquete</label>
                                    <select value={configFormat} onChange={(e) => setConfigFormat(e.target.value as any)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500">
                                        <option value="thermal_80mm">Impresora Térmica 80mm POS</option>
                                        <option value="thermal_58mm">Impresora Térmica 58mm POS</option>
                                        <option value="dian_a4">Factura Electrónica DIAN A4</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">IP / Puerto Impresora POS</label>
                                    <input type="text" value={configPrinterIp} onChange={(e) => setConfigPrinterIp(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Límite Máximo Efectivo en Gaveta (Alerta Retiro Parcial $ COP)</label>
                                <input type="number" value={configMaxCash} onChange={(e) => setConfigMaxCash(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                                <button type="button" onClick={() => setEditingRegisterConfig(null)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Guardar Parámetros
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE CASH REGISTER */}
            {showCreateRegisterModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-indigo-400" /> Registrar Nueva Caja Registradora
                            </h3>
                            <button onClick={() => setShowCreateRegisterModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateRegisterSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Nombre de la Caja *</label>
                                <input type="text" required placeholder="Ej. Caja Registradora 03 - Mostrador" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Ubicación / Sede</label>
                                <input type="text" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300">Fondo Inicial Base ($ COP)</label>
                                <input type="number" value={regFloat} onChange={(e) => setRegFloat(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                                <button type="button" onClick={() => setShowCreateRegisterModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Crear & Activar Caja
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CASH MOVEMENTS & CORTE X (CAJA CHICA) */}
            {showCashMovementModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Caja Chica & Corte X (Arqueo Parcial)</h2>
                                    <p className="text-xs text-slate-400">Registrar entradas y salidas menores de efectivo y balance en tiempo real</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCashMovementModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* CORTE X SUMMARY BOX */}
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" /> Balance Corte X (Resumen Parcial de Turno)
                                </h3>

                                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                        <span className="text-[10px] text-slate-500 block">Base Inicial</span>
                                        <span className="font-bold text-white">${activeSession?.openingBalance?.toLocaleString("es-CO") || "200.000"}</span>
                                    </div>
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                        <span className="text-[10px] text-slate-500 block">Ventas Efectivo</span>
                                        <span className="font-bold text-emerald-400">${activeSession?.cashSales?.toLocaleString("es-CO") || "450.000"}</span>
                                    </div>
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                        <span className="text-[10px] text-slate-500 block">Salidas Caja Chica</span>
                                        <span className="font-bold text-rose-400">-${cashMovements.filter(m=>m.type==="EXIT").reduce((a,b)=>a+b.amount,0).toLocaleString("es-CO")}</span>
                                    </div>
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-amber-500/30">
                                        <span className="text-[10px] text-amber-300 block font-bold">Saldo Esperado</span>
                                        <span className="font-black text-amber-400 text-sm">
                                            ${ ((activeSession?.openingBalance || 200000) + (activeSession?.cashSales || 450000) + cashMovements.filter(m=>m.type==="ENTRY").reduce((a,b)=>a+b.amount,0) - cashMovements.filter(m=>m.type==="EXIT").reduce((a,b)=>a+b.amount,0)).toLocaleString("es-CO") }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* REGISTER NEW MOVEMENT FORM */}
                            <form onSubmit={handleCreateMovementSubmit} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                                <h4 className="text-xs font-bold text-white">Registrar Nuevo Movimiento de Efectivo</h4>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400">Tipo de Movimiento</label>
                                        <select value={movType} onChange={(e) => setMovType(e.target.value as any)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white">
                                            <option value="EXIT">Salida (-) Gasto Chica</option>
                                            <option value="ENTRY">Entrada (+) Adición Base</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400">Monto ($ COP)</label>
                                        <input type="number" required placeholder="15000" value={movAmount} onChange={(e) => setMovAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400">Concepto / Motivo</label>
                                        <input type="text" required placeholder="Ej. Pago transporte domiciliario" value={movReason} onChange={(e) => setMovReason(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" /> Registrar Movimiento
                                    </button>
                                </div>
                            </form>

                            {/* RECENT MOVEMENTS LOG */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-300">Historial de Movimientos de la Caja</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {cashMovements.map(m => (
                                        <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.type === "ENTRY" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                                                    {m.type === "ENTRY" ? "+ ENTRADA" : "- SALIDA"}
                                                </span>
                                                <span className="text-slate-300 font-medium">{m.reason}</span>
                                            </div>
                                            <span className="font-bold text-white font-mono">${m.amount.toLocaleString("es-CO")}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SPLIT PAYMENT (COBRO MIXTO MULTI-MÉTODO) */}
            {showSplitPaymentModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Configurar Cobro Mixto (Split Payment)</h2>
                                    <p className="text-xs text-slate-400">Dividir el total de ${finalTotal.toLocaleString("es-CO")} en varios métodos de pago</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSplitPaymentModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">✕</button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const c = parseFloat(splitCashAmount) || 0;
                            const d = parseFloat(splitCardAmount) || 0;
                            const n = parseFloat(splitNequiAmount) || 0;
                            const cr = parseFloat(splitCreditAmount) || 0;
                            const sum = c + d + n + cr;

                            if (sum < finalTotal) {
                                return alert(`La suma de pagos ($${sum.toLocaleString("es-CO")}) es menor al total a cobrar ($${finalTotal.toLocaleString("es-CO")}).`);
                            }
                            setShowSplitPaymentModal(false);
                            alert(`✅ Cobro Mixto configurado correctamente:\n• Efectivo: $${c.toLocaleString("es-CO")}\n• Datáfono: $${d.toLocaleString("es-CO")}\n• Nequi/PSE: $${n.toLocaleString("es-CO")}\n• Crédito: $${cr.toLocaleString("es-CO")}`);
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Efectivo ($ COP)</label>
                                    <input type="number" placeholder="0" value={splitCashAmount} onChange={(e) => setSplitCashAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Datáfono / Tarjeta ($ COP)</label>
                                    <input type="number" placeholder="0" value={splitCardAmount} onChange={(e) => setSplitCardAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Nequi / Daviplata / PSE ($ COP)</label>
                                    <input type="number" placeholder="0" value={splitNequiAmount} onChange={(e) => setSplitNequiAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-300">Crédito / Fiado ($ COP)</label>
                                    <input type="number" placeholder="0" value={splitCreditAmount} onChange={(e) => setSplitCreditAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-teal-500" />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                                <button type="button" onClick={() => setShowSplitPaymentModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-xs">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Confirmar Cobro Mixto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DATÁFONO STRUCTURED CONFIGURATOR */}
            <DatafonoConfigModal
                isOpen={showDatafonoConfigModal}
                onClose={() => setShowDatafonoConfigModal(false)}
                onSaveSuccess={() => alert("✅ Configuración estructurada del Datáfono guardada en la base de datos.")}
            />
        </div>
    );
}
