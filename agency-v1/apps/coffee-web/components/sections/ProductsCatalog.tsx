"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { 
  Filter, Search, ShoppingCart, Plus, Minus, Trash2, X, 
  ChevronRight, Info, Sparkles, Check, ArrowLeft, SlidersHorizontal 
} from "lucide-react";
import { checkoutAction } from "@/actions/checkout";

// Technical specs of the 8 products
const PRODUCTS = [
  {
    id: "ethiopia-yirgacheffe",
    image: "/images/product-1.jpg",
    basePrice: 24.00,
    origin: "africa",
    roast: "light",
    process: "washed",
    altitude: "1,900m - 2,200m",
    acidity: 5,
    body: 2,
    roastIntensity: 1,
    originLabel: "Ethiopia",
    processLabel: "Washed / Lavado"
  },
  {
    id: "colombia-huila",
    image: "/images/product-2.jpg",
    basePrice: 22.00,
    origin: "south_america",
    roast: "medium",
    process: "washed",
    altitude: "1,550m - 1,800m",
    acidity: 4,
    body: 3,
    roastIntensity: 3,
    originLabel: "Colombia",
    processLabel: "Washed / Lavado"
  },
  {
    id: "brasil-cerrado",
    image: "/images/product-3.jpg",
    basePrice: 20.00,
    origin: "south_america",
    roast: "medium",
    process: "natural",
    altitude: "1,000m - 1,200m",
    acidity: 2,
    body: 4,
    roastIntensity: 3,
    originLabel: "Brasil",
    processLabel: "Natural"
  },
  {
    id: "signature-blend",
    image: "/images/product-4.jpg",
    basePrice: 26.00,
    origin: "south_america", // Blend primarily South American
    roast: "medium",
    process: "washed",
    altitude: "1,200m - 1,800m",
    acidity: 3,
    body: 4,
    roastIntensity: 4,
    originLabel: "House Blend",
    processLabel: "Blend / Mezcla"
  },
  {
    id: "panama-geisha",
    image: "/images/product-5.png",
    basePrice: 38.00,
    origin: "central_america",
    roast: "light",
    process: "washed",
    altitude: "1,800m - 2,100m",
    acidity: 5,
    body: 1,
    roastIntensity: 1,
    originLabel: "Panama",
    processLabel: "Washed / Lavado"
  },
  {
    id: "kenya-aa",
    image: "/images/product-6.png",
    basePrice: 28.00,
    origin: "africa",
    roast: "light",
    process: "natural",
    altitude: "1,700m - 1,900m",
    acidity: 5,
    body: 3,
    roastIntensity: 2,
    originLabel: "Kenya",
    processLabel: "Natural"
  },
  {
    id: "costa-rica",
    image: "/images/product-7.png",
    basePrice: 25.00,
    origin: "central_america",
    roast: "medium",
    process: "honey",
    altitude: "1,400m - 1,600m",
    acidity: 3,
    body: 3,
    roastIntensity: 3,
    originLabel: "Costa Rica",
    processLabel: "Honey"
  },
  {
    id: "sumatra-mandheling",
    image: "/images/product-8.png",
    basePrice: 23.00,
    origin: "asia",
    roast: "dark",
    process: "natural",
    altitude: "1,100m - 1,400m",
    acidity: 1,
    body: 5,
    roastIntensity: 5,
    originLabel: "Sumatra",
    processLabel: "Wet Hulled / Giling Basah"
  }
];

interface CartItem {
  id: string; // unique item id based on product, grind and size
  productId: string;
  grind: string;
  size: string;
  quantity: number;
  price: number;
}

export default function ProductsCatalog() {
  const t = useTranslations("catalog");
  
  // Filtering & Sorting State
  const [search, setSearch] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedRoast, setSelectedRoast] = useState("all");
  const [selectedProcess, setSelectedProcess] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  
  // Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [qvSize, setQvSize] = useState("250g");
  const [qvGrind, setQvGrind] = useState("whole");
  const [qvQuantity, setQvQuantity] = useState(1);
  const [qvAdded, setQvAdded] = useState(false);

  // Coffee Finder Quiz State
  const [quizStep, setQuizStep] = useState(-1); // -1: Intro, 0, 1, 2: Questions, 3: Result
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [recommendedProduct, setRecommendedProduct] = useState<typeof PRODUCTS[0] | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const qvRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("goldneez_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("goldneez_cart", JSON.stringify(cart));
  }, [cart]);

  // GSAP animation for product grid item mount/update
  useEffect(() => {
    if (gridRef.current) {
      const items = gridRef.current.querySelectorAll(".product-card-anim");
      gsap.killTweensOf(items);
      gsap.fromTo(
        items,
        { opacity: 0, y: 30, scale: 0.98 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.5, 
          stagger: 0.08, 
          ease: "power2.out",
          overwrite: "auto"
        }
      );
    }
  }, [search, selectedOrigin, selectedRoast, selectedProcess, sortBy]);

  // Handle Quick View mounting animation
  useEffect(() => {
    if (quickViewProduct && qvRef.current) {
      gsap.fromTo(
        qvRef.current.querySelector(".modal-content-anim"),
        { opacity: 0, scale: 0.9, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [quickViewProduct]);

  // Filtered and Sorted Products
  const filteredProducts = PRODUCTS.filter(product => {
    const name = t(`items.${product.id}.name`).toLowerCase();
    const description = t(`items.${product.id}.description`).toLowerCase();
    const notes = t(`items.${product.id}.notes`).toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || 
                          description.includes(search.toLowerCase()) || 
                          notes.includes(search.toLowerCase()) ||
                          product.originLabel.toLowerCase().includes(search.toLowerCase());
    
    const matchesOrigin = selectedOrigin === "all" || product.origin === selectedOrigin;
    const matchesRoast = selectedRoast === "all" || product.roast === selectedRoast;
    const matchesProcess = selectedProcess === "all" || product.process === selectedProcess;
    
    return matchesSearch && matchesOrigin && matchesRoast && matchesProcess;
  }).sort((a, b) => {
    if (sortBy === "price_asc") {
      return a.basePrice - b.basePrice;
    }
    if (sortBy === "price_desc") {
      return b.basePrice - a.basePrice;
    }
    if (sortBy === "intensity") {
      return b.roastIntensity - a.roastIntensity;
    }
    return 0; // default sort (unordered)
  });

  // Size price multiplier helper
  const getPriceForSize = (basePrice: number, size: string) => {
    if (size === "500g") return basePrice * 1.8; // 10% discount on bulk
    if (size === "1kg") return basePrice * 3.4; // 15% discount on bulk
    return basePrice;
  };

  // Add to Cart handler
  const handleAddToCart = (productId: string, size: string, grind: string, quantity: number) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const unitPrice = getPriceForSize(product.basePrice, size);
    const cartItemId = `${productId}-${size}-${grind}`;

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === cartItemId);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        return [...prevCart, {
          id: cartItemId,
          productId,
          grind,
          size,
          quantity,
          price: unitPrice
        }];
      }
    });

    // Animate item added response
    setQvAdded(true);
    setTimeout(() => setQvAdded(false), 2000);
    
    // Open cart drawer automatically for visual confirmation
    setTimeout(() => setCartOpen(true), 300);
  };

  const updateCartItemQuantity = (itemId: string, delta: number) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null)
    );
  };

  const removeCartItem = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    
    // Configurar datos del cliente (intentar cargar datos reales o invitados)
    let userDetails = {
      name: "Invitado de Café",
      email: "guest-checkout@goldneez.com",
      address: "Envío a Domicilio",
      city: "Bogotá"
    };

    const currentUser = localStorage.getItem("goldneez_current_user");
    if (currentUser) {
      try {
        const parsed = JSON.parse(currentUser);
        // Si el usuario está registrado, podemos obtener su dirección guardada si existe
        const savedProfileJson = localStorage.getItem("goldneez_user");
        let savedAddress = "Envío a Domicilio";
        let savedCity = "Bogotá";
        if (savedProfileJson) {
          try {
            const savedProfile = JSON.parse(savedProfileJson);
            if (savedProfile.address) savedAddress = savedProfile.address;
            if (savedProfile.city) savedCity = savedProfile.city;
          } catch {}
        }
        
        userDetails = {
          name: parsed.name || "Cliente Goldneez",
          email: parsed.email || "cliente@goldneez.com",
          address: savedAddress,
          city: savedCity
        };
      } catch {}
    }

    try {
      const res = await checkoutAction(cart, cartSubtotal, userDetails);
      if (res.error) {
        alert(res.error);
        setCheckoutLoading(false);
      } else {
        setCheckoutLoading(false);
        setCheckoutSuccess(true);
        setCart([]);
        
        // Actualizar puntos acumulados en la interfaz local
        if (res.newTotalPoints !== undefined && currentUser) {
          try {
            const parsed = JSON.parse(currentUser);
            const updated = { ...parsed, points: res.newTotalPoints };
            localStorage.setItem("goldneez_current_user", JSON.stringify(updated));
            localStorage.setItem("goldneez_user", JSON.stringify(updated));
          } catch {}
        }

        setTimeout(() => {
          setCheckoutSuccess(false);
          setCartOpen(false);
        }, 3500);
      }
    } catch (err) {
      console.error("[handleCheckout] Error:", err);
      alert("Ocurrió un error al procesar el pago. Intente nuevamente.");
      setCheckoutLoading(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setSelectedOrigin("all");
    setSelectedRoast("all");
    setSelectedProcess("all");
    setSortBy("default");
  };

  // Quiz Matcher Logic
  const handleQuizAnswer = (optionIdx: number) => {
    const newAnswers = [...quizAnswers, optionIdx];
    setQuizAnswers(newAnswers);

    if (quizStep < 2) {
      setQuizStep(prev => prev + 1);
    } else {
      // Calculate scores
      // Answers maps to: 
      // q0 (take coffee): 0 = Black, 1 = With milk, 2 = Cold Brew
      // q1 (flavor): 0 = Fruity/Floral, 1 = Sweet/Chocolate, 2 = Bold/Earthy
      // q2 (brewing): 0 = Drip, 1 = Espresso/Moka, 2 = French Press
      
      let bestProduct = PRODUCTS[0];
      let maxScore = -999;

      PRODUCTS.forEach(p => {
        let score = 0;

        // Alignment with Q1 (Milk/Cold compatibility)
        if (newAnswers[0] === 0) { // Solo
          if (p.roast === "light") score += 3;
          if (p.roast === "medium") score += 2;
        } else if (newAnswers[0] === 1) { // Milk
          if (p.roast === "dark") score += 3;
          if (p.roast === "medium" && p.body >= 4) score += 2;
        } else if (newAnswers[0] === 2) { // Cold
          if (p.origin === "africa") score += 3;
          if (p.roast === "light") score += 2;
        }

        // Alignment with Q2 (Flavor profile)
        if (newAnswers[1] === 0) { // Fruity/floral
          if (p.roast === "light") score += 4;
          if (p.process === "washed" && p.acidity >= 4) score += 2;
        } else if (newAnswers[1] === 1) { // Sweet/Chocolate
          if (p.roast === "medium") score += 4;
          if (p.id === "colombia-huila" || p.id === "brasil-cerrado") score += 3;
        } else if (newAnswers[1] === 2) { // Intense/Earthy
          if (p.roast === "dark") score += 4;
          if (p.body === 5 || p.id === "sumatra-mandheling") score += 3;
        }

        // Alignment with Q3 (Brewing method)
        if (newAnswers[2] === 0) { // Drip
          if (p.roast === "light") score += 3;
          if (p.process === "washed") score += 2;
        } else if (newAnswers[2] === 1) { // Espresso
          if (p.roast === "dark" || p.id === "signature-blend") score += 3;
          if (p.body >= 4) score += 2;
        } else if (newAnswers[2] === 2) { // French Press
          if (p.id === "sumatra-mandheling" || p.process === "honey") score += 3;
          if (p.body >= 3) score += 1;
        }

        if (score > maxScore) {
          maxScore = score;
          bestProduct = p;
        }
      });

      setRecommendedProduct(bestProduct);
      setQuizStep(3); // Result page
    }
  };

  const restartQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setRecommendedProduct(null);
  };

  return (
    <div className="bg-black text-aluminum min-h-screen pt-28 pb-20 px-6 sm:px-10 lg:px-20 relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 rounded-full bg-amber/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 rounded-full bg-amber/5 blur-[120px] pointer-events-none z-0" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Floating Cart Trigger */}
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-8 right-8 z-40 bg-amber hover:bg-amber-light text-black p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group"
          aria-label="Open Cart"
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-black font-cinzel text-xs font-bold w-6 h-6 rounded-full border-2 border-black flex items-center justify-center animate-pulse">
              {cart.reduce((qty, item) => qty + item.quantity, 0)}
            </span>
          )}
        </button>

        {/* Back Link */}
        <a 
          href="/" 
          className="inline-flex items-center gap-2 font-quattrocento text-xs uppercase tracking-widest text-aluminum-dark hover:text-amber mb-8 transition-colors duration-300"
        >
          <ArrowLeft size={14} /> Volver al Inicio
        </a>

        {/* Header Title */}
        <div className="mb-12 max-w-[800px]">
          <h1 className="font-cinzel text-amber text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            {t("title")}
          </h1>
          <p className="font-quattrocento text-aluminum-dark text-base sm:text-lg leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Coffee Finder Quiz Section */}
        <div className="mb-16 rounded-2xl border border-amber/20 bg-gradient-to-r from-amber/5 to-transparent p-6 sm:p-8 backdrop-blur-sm">
          {quizStep === -1 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="font-cinzel text-amber text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                  <Sparkles size={20} className="animate-spin-slow text-amber" />
                  {t("quiz_title")}
                </h3>
                <p className="font-quattrocento text-sm text-aluminum-dark mt-1">
                  {t("quiz_subtitle")}
                </p>
              </div>
              <button
                onClick={() => setQuizStep(0)}
                className="btn-primary py-2 px-6 text-xs whitespace-nowrap cursor-pointer hover:scale-105 transition-transform"
              >
                {t("quiz_start")}
              </button>
            </div>
          ) : quizStep >= 0 && quizStep <= 2 ? (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <span className="font-cinzel text-xs text-amber tracking-widest uppercase">
                  Pregunta {quizStep + 1} de 3
                </span>
                <button 
                  onClick={() => setQuizStep(-1)}
                  className="text-aluminum-dark hover:text-aluminum cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              
              <h4 className="font-cinzel text-aluminum text-base sm:text-lg font-bold mb-6">
                {quizStep === 0 && t("quiz_q1")}
                {quizStep === 1 && t("quiz_q2")}
                {quizStep === 2 && t("quiz_q3")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Options mapping */}
                {quizStep === 0 && [
                  { label: t("quiz_q1_o1"), val: 0 },
                  { label: t("quiz_q1_o2"), val: 1 },
                  { label: t("quiz_q1_o3"), val: 2 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => handleQuizAnswer(opt.val)}
                    className="p-4 rounded-xl border border-aluminum/10 bg-black/40 text-left text-sm font-quattrocento hover:border-amber/50 hover:bg-amber/5 text-aluminum hover:text-amber transition-all cursor-pointer select-none"
                  >
                    {opt.label}
                  </button>
                ))}

                {quizStep === 1 && [
                  { label: t("quiz_q2_o1"), val: 0 },
                  { label: t("quiz_q2_o2"), val: 1 },
                  { label: t("quiz_q2_o3"), val: 2 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => handleQuizAnswer(opt.val)}
                    className="p-4 rounded-xl border border-aluminum/10 bg-black/40 text-left text-sm font-quattrocento hover:border-amber/50 hover:bg-amber/5 text-aluminum hover:text-amber transition-all cursor-pointer select-none"
                  >
                    {opt.label}
                  </button>
                ))}

                {quizStep === 2 && [
                  { label: t("quiz_q3_o1"), val: 0 },
                  { label: t("quiz_q3_o2"), val: 1 },
                  { label: t("quiz_q3_o3"), val: 2 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => handleQuizAnswer(opt.val)}
                    className="p-4 rounded-xl border border-aluminum/10 bg-black/40 text-left text-sm font-quattrocento hover:border-amber/50 hover:bg-amber/5 text-aluminum hover:text-amber transition-all cursor-pointer select-none"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn flex flex-col md:flex-row items-center justify-between gap-6">
              {recommendedProduct && (
                <>
                  <div className="flex items-center gap-4">
                    <img 
                      src={recommendedProduct.image} 
                      alt={t(`items.${recommendedProduct.id}.name`)} 
                      className="w-16 h-16 object-cover rounded-lg border border-amber/30"
                    />
                    <div>
                      <span className="font-cinzel text-xs text-amber tracking-widest uppercase">
                        {t("quiz_result")}
                      </span>
                      <h4 className="font-cinzel text-aluminum text-lg font-bold">
                        {t(`items.${recommendedProduct.id}.name`)}
                      </h4>
                      <p className="font-quattrocento text-xs text-aluminum-dark">
                        {t(`items.${recommendedProduct.id}.notes`)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setQuickViewProduct(recommendedProduct)}
                      className="px-5 py-2.5 rounded-lg border border-amber/30 bg-amber/5 text-amber text-xs font-bold font-quattrocento uppercase tracking-widest hover:bg-amber hover:text-black transition-all cursor-pointer"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={restartQuiz}
                      className="px-5 py-2.5 rounded-lg text-aluminum-dark hover:text-aluminum text-xs font-bold font-quattrocento uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      {t("quiz_retry")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Filters and Toolbar */}
        <div className="mb-8 border border-aluminum/10 bg-black/40 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-aluminum-dark" size={18} />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/60 border border-aluminum/10 focus:border-amber/50 rounded-xl py-3 pl-12 pr-4 text-sm font-quattrocento placeholder-aluminum-dark text-aluminum focus:outline-none transition-all"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-aluminum-dark hover:text-aluminum"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-3">
              <label htmlFor="sorting-select" className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark shrink-0">
                {t("sort_title")}:
              </label>
              <select
                id="sorting-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/60 border border-aluminum/10 focus:border-amber/50 rounded-xl px-4 py-3 text-sm font-quattrocento text-aluminum focus:outline-none cursor-pointer transition-all min-w-[200px]"
              >
                <option value="default">Por defecto</option>
                <option value="price_asc">{t("sort_price_asc")}</option>
                <option value="price_desc">{t("sort_price_desc")}</option>
                <option value="intensity">{t("sort_intensity")}</option>
              </select>
            </div>

          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap items-center gap-6 border-t border-aluminum/10 pt-6">
            
            {/* Origin Filter */}
            <div className="flex items-center gap-2">
              <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mr-2">
                {t("filter_origin")}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "all", label: t("filter_all") },
                  { value: "africa", label: t("origin_africa") },
                  { value: "south_america", label: t("origin_south_america") },
                  { value: "central_america", label: t("origin_central_america") },
                  { value: "asia", label: t("origin_asia") },
                ].map((origin) => (
                  <button
                    key={origin.value}
                    onClick={() => setSelectedOrigin(origin.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-quattrocento cursor-pointer transition-all border ${
                      selectedOrigin === origin.value
                        ? "bg-amber border-amber text-black font-bold shadow-[0_0_10px_rgba(249,178,51,0.15)]"
                        : "border-aluminum/10 bg-black/40 hover:border-aluminum/30 text-aluminum-dark hover:text-aluminum"
                    }`}
                  >
                    {origin.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roast Filter */}
            <div className="flex items-center gap-2">
              <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mr-2">
                {t("filter_roast")}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "all", label: t("filter_all") },
                  { value: "light", label: t("roast_light") },
                  { value: "medium", label: t("roast_medium") },
                  { value: "dark", label: t("roast_dark") },
                ].map((roast) => (
                  <button
                    key={roast.value}
                    onClick={() => setSelectedRoast(roast.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-quattrocento cursor-pointer transition-all border ${
                      selectedRoast === roast.value
                        ? "bg-amber border-amber text-black font-bold shadow-[0_0_10px_rgba(249,178,51,0.15)]"
                        : "border-aluminum/10 bg-black/40 hover:border-aluminum/30 text-aluminum-dark hover:text-aluminum"
                    }`}
                  >
                    {roast.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            {(search || selectedOrigin !== "all" || selectedRoast !== "all" || selectedProcess !== "all" || sortBy !== "default") && (
              <button
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1.5 text-xs text-amber hover:text-amber-light font-quattrocento uppercase tracking-widest cursor-pointer"
              >
                <SlidersHorizontal size={14} /> Limpiar Filtros
              </button>
            )}

          </div>

        </div>

        {/* Product Catalog Grid */}
        {filteredProducts.length > 0 ? (
          <div 
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="product-card-anim border border-aluminum/10 bg-black/40 hover:bg-black/60 rounded-2xl p-4 transition-all duration-500 hover:border-amber/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.8)] group flex flex-col justify-between"
              >
                <div>
                  {/* Image wrapper */}
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-black/50 border border-aluminum/5 mb-5 flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={t(`items.${product.id}.name`)} 
                      className="w-full h-full object-cover group-hover:scale-108 transition-all duration-700"
                      loading="lazy"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Quick view link overlay */}
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 border border-amber/30 text-amber font-quattrocento text-xs uppercase tracking-widest px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 hover:bg-amber hover:text-black cursor-pointer shadow-lg"
                    >
                      {t("quick_view")}
                    </button>
                  </div>

                  {/* Brand & Technical Info */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-cinzel text-xs text-amber tracking-widest uppercase font-bold">
                      {product.originLabel}
                    </span>
                    <span className="font-quattrocento text-xs text-aluminum-dark uppercase font-medium">
                      {t(`roast_${product.roast}`)}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-cinzel text-aluminum group-hover:text-amber text-lg font-bold tracking-wide mb-3 transition-colors duration-300">
                    {t(`items.${product.id}.name`)}
                  </h3>

                  {/* Tasting notes */}
                  <p className="font-quattrocento text-xs text-aluminum-dark/80 italic mb-4 leading-normal">
                    {t(`items.${product.id}.notes`)}
                  </p>
                </div>

                <div>
                  {/* Price and Cart Action */}
                  <div className="flex items-center justify-between border-t border-aluminum/10 pt-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="font-cinzel text-amber text-lg font-bold">
                        ${product.basePrice.toFixed(2)}
                      </span>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider">
                        250g
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setQuickViewProduct(product);
                      }}
                      className="p-3 bg-amber/10 hover:bg-amber rounded-xl text-amber hover:text-black transition-all duration-300 cursor-pointer border border-amber/20 hover:border-amber group-hover:scale-105 active:scale-95"
                      title={t("quick_view")}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-aluminum/10 rounded-2xl bg-black/20">
            <Info size={40} className="mx-auto text-aluminum-dark mb-4 animate-bounce" />
            <h3 className="font-cinzel text-aluminum text-lg font-bold mb-2">Sin Resultados</h3>
            <p className="font-quattrocento text-aluminum-dark text-sm max-w-sm mx-auto">
              No encontramos ningún café que coincida con tus filtros. Intenta cambiar los criterios de búsqueda.
            </p>
          </div>
        )}

      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div 
          ref={qvRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none animate-fadeIn"
          onClick={() => setQuickViewProduct(null)}
        >
          <div 
            className="modal-content-anim max-w-3xl w-full bg-black/90 border border-aluminum/15 rounded-3xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 text-aluminum-dark hover:text-amber rounded-full hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Product Image */}
              <div className="relative bg-black/40 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-aluminum/10">
                <img 
                  src={quickViewProduct.image} 
                  alt={t(`items.${quickViewProduct.id}.name`)} 
                  className="w-full max-h-[300px] md:max-h-full object-contain rounded-2xl"
                />
                <div className="absolute bottom-4 left-4 bg-black/75 px-3 py-1.5 rounded-lg border border-amber/30">
                  <span className="font-cinzel text-amber text-xs font-bold uppercase tracking-widest">
                    {quickViewProduct.originLabel}
                  </span>
                </div>
              </div>

              {/* Product Info & Configurations */}
              <div className="p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
                <div>
                  <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-2">
                    {t(`items.${quickViewProduct.id}.name`)}
                  </h3>
                  <p className="font-quattrocento text-xs text-aluminum-dark italic mb-4 leading-relaxed">
                    {t(`items.${quickViewProduct.id}.notes`)}
                  </p>
                  <p className="font-quattrocento text-sm text-aluminum-dark leading-relaxed mb-6">
                    {t(`items.${quickViewProduct.id}.description`)}
                  </p>

                  {/* Technical Specifications */}
                  <div className="grid grid-cols-2 gap-4 mb-6 border-y border-aluminum/10 py-4">
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                        {t("specs_altitude")}
                      </span>
                      <span className="font-cinzel text-xs text-aluminum font-bold">
                        {quickViewProduct.altitude}
                      </span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                        {t("specs_process")}
                      </span>
                      <span className="font-cinzel text-xs text-aluminum font-bold">
                        {quickViewProduct.processLabel}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                        {t("specs_acidity")}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2.5 h-1.5 rounded-full ${
                              i < quickViewProduct.acidity ? "bg-amber" : "bg-aluminum/15"
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                        {t("specs_body")}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2.5 h-1.5 rounded-full ${
                              i < quickViewProduct.body ? "bg-amber" : "bg-aluminum/15"
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Config size */}
                  <div className="mb-4">
                    <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum font-bold block mb-2">
                      {t("size_title")}
                    </span>
                    <div className="flex gap-2">
                      {["250g", "500g", "1kg"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setQvSize(size)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-quattrocento border transition-all cursor-pointer ${
                            qvSize === size
                              ? "bg-amber border-amber text-black font-bold"
                              : "border-aluminum/10 bg-black/40 hover:border-aluminum/30 text-aluminum-dark hover:text-aluminum"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Config grind */}
                  <div className="mb-6">
                    <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum font-bold block mb-2">
                      {t("grind_title")}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "whole", label: t("grind_whole") },
                        { value: "espresso", label: t("grind_espresso") },
                        { value: "filter", label: t("grind_filter") },
                        { value: "french", label: t("grind_french") },
                      ].map((grind) => (
                        <button
                          key={grind.value}
                          onClick={() => setQvGrind(grind.value)}
                          className={`py-2 px-3 rounded-lg text-xs text-left font-quattrocento border transition-all cursor-pointer ${
                            qvGrind === grind.value
                              ? "bg-amber border-amber text-black font-bold"
                              : "border-aluminum/10 bg-black/40 hover:border-aluminum/30 text-aluminum-dark hover:text-aluminum"
                          }`}
                        >
                          {grind.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final Actions */}
                <div className="border-t border-aluminum/10 pt-5 mt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-cinzel text-amber text-2xl font-bold">
                      ${(getPriceForSize(quickViewProduct.basePrice, qvSize) * qvQuantity).toFixed(2)}
                    </span>
                    <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider mt-0.5">
                      IVA Incluido
                    </span>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center border border-aluminum/15 rounded-xl bg-black/40 px-2 py-1 gap-3">
                    <button
                      onClick={() => setQvQuantity(prev => Math.max(1, prev - 1))}
                      className="p-1 text-aluminum-dark hover:text-amber transition-colors cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-cinzel text-sm text-aluminum font-bold w-6 text-center select-none">
                      {qvQuantity}
                    </span>
                    <button
                      onClick={() => setQvQuantity(prev => prev + 1)}
                      className="p-1 text-aluminum-dark hover:text-amber transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add action */}
                  <button
                    onClick={() => handleAddToCart(quickViewProduct.id, qvSize, qvGrind, qvQuantity)}
                    className="btn-primary py-2.5 px-6 text-xs cursor-pointer hover:scale-103 transition-transform"
                  >
                    {qvAdded ? (
                      <span className="flex items-center gap-1">
                        <Check size={14} /> {t("added_to_cart")}
                      </span>
                    ) : (
                      t("add_to_cart")
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      {cartOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs select-none"
          onClick={() => setCartOpen(false)}
        >
          <div 
            ref={cartRef}
            className="w-full max-w-md bg-black/95 border-l border-aluminum/10 shadow-2xl h-full flex flex-col justify-between p-6 sm:p-8 animate-slideLeft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-aluminum/10 pb-4">
              <h3 className="font-cinzel text-amber text-xl font-bold tracking-wide flex items-center gap-2">
                <ShoppingCart size={22} />
                {t("cart_title")}
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 text-aluminum-dark hover:text-amber rounded-full hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-4">
              {checkoutSuccess ? (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full animate-fadeIn">
                  <div className="p-4 bg-amber/10 rounded-full text-amber mb-4 border border-amber/20 animate-pulse">
                    <Check size={40} />
                  </div>
                  <h4 className="font-cinzel text-amber text-lg font-bold mb-2">¡Pago Exitoso!</h4>
                  <p className="font-quattrocento text-sm text-aluminum-dark max-w-xs mx-auto leading-relaxed">
                    {t("cart_checkout_success")}
                  </p>
                </div>
              ) : checkoutLoading ? (
                <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-full border-[3px] border-amber/20 border-t-amber animate-spin mb-4" />
                  <p className="font-quattrocento text-sm text-aluminum-dark">
                    {t("cart_checkout_loading")}
                  </p>
                </div>
              ) : cart.length > 0 ? (
                cart.map((item) => {
                  const product = PRODUCTS.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-start gap-4 border-b border-aluminum/5 pb-4 animate-fadeIn"
                    >
                      <img 
                        src={product.image} 
                        alt={t(`items.${product.id}.name`)} 
                        className="w-16 h-16 object-cover rounded-lg border border-aluminum/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-cinzel text-aluminum text-sm font-bold truncate">
                          {t(`items.${product.id}.name`)}
                        </h4>
                        <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-widest block mt-0.5">
                          {item.size} | {t(`grind_${item.grind}`)}
                        </span>
                        
                        <div className="flex items-center justify-between mt-3">
                          {/* Item Quantity control */}
                          <div className="flex items-center border border-aluminum/10 bg-black/40 rounded-lg px-1 py-0.5 gap-2">
                            <button
                              onClick={() => updateCartItemQuantity(item.id, -1)}
                              className="p-1 text-aluminum-dark hover:text-amber transition-colors cursor-pointer"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="font-cinzel text-xs text-aluminum font-bold w-4 text-center select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartItemQuantity(item.id, 1)}
                              className="p-1 text-aluminum-dark hover:text-amber transition-colors cursor-pointer"
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          {/* Item Price and delete */}
                          <div className="flex items-center gap-3">
                            <span className="font-cinzel text-amber text-sm font-bold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeCartItem(item.id)}
                              className="text-aluminum-dark hover:text-red-400 transition-colors cursor-pointer"
                              title="Eliminar item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                  <ShoppingCart size={32} className="text-aluminum-dark mb-4 opacity-50" />
                  <p className="font-quattrocento text-sm text-aluminum-dark max-w-[280px] leading-relaxed">
                    {t("cart_empty")}
                  </p>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && !checkoutLoading && !checkoutSuccess && (
              <div className="border-t border-aluminum/10 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-quattrocento text-sm text-aluminum-dark uppercase tracking-wider">
                    {t("cart_subtotal")}
                  </span>
                  <span className="font-cinzel text-amber text-2xl font-bold">
                    ${cartSubtotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full btn-primary py-3 text-xs tracking-widest uppercase font-bold text-center cursor-pointer hover:scale-102 transition-transform shadow-[0_0_15px_rgba(249,178,51,0.2)]"
                >
                  {t("cart_checkout")}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
