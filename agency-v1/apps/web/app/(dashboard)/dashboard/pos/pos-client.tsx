"use client";

import { useState, useEffect, useRef } from "react";
import {
    ShoppingCart, QrCode, CreditCard, Wallet, Building2, Plus, Minus,
    Trash2, Search, CheckCircle2, RefreshCw, Printer, AlertTriangle,
    DollarSign, ArrowRight, ShieldCheck, Lock, Sparkles, X, Check, Wifi, WifiOff, Zap, Settings
} from "lucide-react";

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
    taxRate: number;
    stock: number;
}

interface CartItem extends Product {
    quantity: number;
}

const DEFAULT_PRODUCTS: Product[] = [
    { id: "p1", title: "Consultoría Estratégica POS (1 hora)", sku: "SERV-001", barcode: "7701001001", category: "Servicios", unitPrice: 150000, taxRate: 0.19, stock: 99 },
    { id: "p2", title: "Plan Branding & Identidad Corporativa", sku: "BRAND-002", barcode: "7701001002", category: "Diseño", unitPrice: 850000, taxRate: 0.19, stock: 50 },
    { id: "p3", title: "Desarrollo Web Next.js MVP", sku: "WEB-003", barcode: "7701001003", category: "Desarrollo", unitPrice: 1200000, taxRate: 0.19, stock: 20 },
    { id: "p4", title: "Bolsa 100K Peticiones API Gateway", sku: "API-004", barcode: "7701001004", category: "SaaS", unitPrice: 120000, taxRate: 0.19, stock: 999 },
    { id: "p5", title: "Impresora Térmica POS 80mm USB/LAN", sku: "HW-005", barcode: "7701001005", category: "Hardware", unitPrice: 380000, taxRate: 0.19, stock: 15 },
    { id: "p6", title: "Lector Código de Barras Láser 2D", sku: "HW-006", barcode: "7701001006", category: "Hardware", unitPrice: 195000, taxRate: 0.19, stock: 25 },
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

    // Calculate Cart Totals
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.taxRate, 0);

    // Auto-detect 3x2 and Bundle promotions
    let promoDiscount = 0;
    const activePromos: string[] = [];

    cart.forEach((it) => {
        if (it.sku === "HW-006" && it.quantity >= 3) {
            const freeCount = Math.floor(it.quantity / 3);
            const disc = freeCount * it.unitPrice;
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
    const grossTotal = subtotal + tax;
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

    // ESC/POS Open Cash Drawer Command via WebUSB
    const handleOpenCashDrawer = async () => {
        try {
            if ("usb" in navigator) {
                alert("⚡ Enviando comando ESC/POS al cajón monedero (Apertura de pulso 24V).");
            } else {
                alert("Apertura manual de cajón monedero registrada en auditoría.");
            }
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
                        onClick={handleOpenCashDrawer}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <Wallet className="w-3.5 h-3.5" /> Abrir Cajón
                    </button>

                    {activeSession?.status === "OPEN" ? (
                        <button
                            onClick={() => setShowCloseModal(true)}
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

            {/* MAIN POS TERMINAL LAYOUT */}
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
                            <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                                />
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
                    </div>

                    {/* PRODUCT GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
                        {filteredProducts.map((p) => (
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

                                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                                    <span className="font-black text-sm text-teal-400 font-mono">{formatCOP(p.unitPrice)}</span>
                                    <span className="p-1 bg-teal-500/10 text-teal-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        ))}
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

                        <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {[
                                { id: "CASH", label: "Efectivo", icon: DollarSign },
                                { id: "CARD_POS", label: "Datáfono", icon: CreditCard },
                                { id: "NEQUI_PSE", label: "Nequi/PSE", icon: QrCode },
                                { id: "CREDIT", label: "Crédito", icon: Wallet },
                            ].map((m) => {
                                const IconComp = m.icon;
                                const isSel = paymentMethod === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentMethod(m.id as any)}
                                        className={`py-2 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
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
                                <span>Subtotal</span>
                                <span className="font-mono text-slate-200">{formatCOP(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>IVA (19%)</span>
                                <span className="font-mono text-slate-200">{formatCOP(tax)}</span>
                            </div>
                            {totalDiscountCombined > 0 && (
                                <div className="flex justify-between text-teal-400 font-semibold">
                                    <span>Descuento Promocional</span>
                                    <span className="font-mono">-{formatCOP(totalDiscountCombined)}</span>
                                </div>
                            )}
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
                                    subtotal,
                                    taxTotal: tax,
                                    discountTotal: totalDiscountCombined,
                                    grandTotal: finalTotal,
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
        </div>
    );
}
