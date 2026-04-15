"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, RefreshCw, HandCoins, Rocket } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Option = {
    id: string;
    label: string;
    price: number;
    description: string;
};

const PROJECT_TYPES: Option[] = [
    { id: "landing", label: "Landing Page", price: 800, description: "Una página optimizada para convertir." },
    { id: "corporate", label: "Sitio Corporativo", price: 1500, description: "Múltiples páginas, blog y CMS." },
    { id: "ecommerce", label: "E-commerce", price: 3000, description: "Tienda online completa con pagos." },
    { id: "webapp", label: "Web App / SaaS", price: 5000, description: "Funcionalidad compleja y bases de datos." },
];

const DESIGN_LEVELS: Option[] = [
    { id: "template", label: "Plantilla Moderna", price: 0, description: "Diseño limpio y rápido basado en UI kits." },
    { id: "custom", label: "Diseño Amedida", price: 1000, description: "Branding único y layout exclusivo." },
    { id: "premium", label: "Experiencia Premium", price: 2500, description: "Animaciones, 3D y detalles de lujo." },
];

const EXTRAS: Option[] = [
    { id: "cms", label: "CMS Autoadministrable", price: 500, description: "Edita tu contenido sin código." },
    { id: "seo", label: "SEO Pack Avanzado", price: 600, description: "Estructura optimizada para Google." },
    { id: "copy", label: "Redacción de Textos", price: 400, description: "Copywriting persuasivo profesional." },
    { id: "multi", label: "Multilenguaje", price: 800, description: "Soporte para múltiples idiomas." },
];

export function ProjectEstimator() {
    const [type, setType] = useState<string | null>(null);
    const [design, setDesign] = useState<string | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [showResult, setShowResult] = useState(false);

    const toggleExtra = (id: string) => {
        setSelectedExtras(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const calculateTotal = () => {
        let total = 0;
        if (type) total += PROJECT_TYPES.find(x => x.id === type)?.price || 0;
        if (design) total += DESIGN_LEVELS.find(x => x.id === design)?.price || 0;
        selectedExtras.forEach(id => {
            total += EXTRAS.find(x => x.id === id)?.price || 0;
        });
        return total;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    };

    const reset = () => {
        setType(null);
        setDesign(null);
        setSelectedExtras([]);
        setShowResult(false);
    };

    const isComplete = type && design;

    return (
        <section id="estimator" className="py-24 bg-gray-50 border-t border-gray-200">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-16">
                    <p className="text-sm font-bold text-green-600 uppercase tracking-widest mb-2">Estimador de Costos</p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Cotiza tu Proyecto en Segundos</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Selecciona las características que necesitas y obtén un rango de precio estimado al instante.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Step 1: Type */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">1</span>
                                ¿Qué tipo de proyecto necesitas?
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {PROJECT_TYPES.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setType(opt.id)}
                                        className={cn(
                                            "flex flex-col text-left p-4 rounded-xl border-2 transition-all hover:border-green-200",
                                            type === opt.id ? "border-green-600 bg-green-50 shadow-md transform scale-[1.02]" : "border-gray-100 bg-gray-50/50"
                                        )}
                                    >
                                        <div className="flex justify-between w-full mb-1">
                                            <span className="font-bold text-gray-900">{opt.label}</span>
                                            {type === opt.id && <Check className="text-green-600" size={20} />}
                                        </div>
                                        <span className="text-sm text-gray-500">{opt.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Design */}
                        <div className={cn("bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-opacity duration-300",
                            !type ? "opacity-50 pointer-events-none grayscale" : "opacity-100"
                        )}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">2</span>
                                Nivel de Diseño
                            </h3>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {DESIGN_LEVELS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDesign(opt.id)}
                                        className={cn(
                                            "flex flex-col text-left p-4 rounded-xl border-2 transition-all hover:border-green-200",
                                            design === opt.id ? "border-green-600 bg-green-50 shadow-md transform scale-[1.02]" : "border-gray-100 bg-gray-50/50"
                                        )}
                                    >
                                        <span className="font-bold text-gray-900 mb-1">{opt.label}</span>
                                        <span className="text-xs text-gray-500">{opt.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Extras */}
                        <div className={cn("bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-opacity duration-300",
                            !design ? "opacity-50 pointer-events-none grayscale" : "opacity-100"
                        )}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">3</span>
                                Extras Opcionales
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {EXTRAS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => toggleExtra(opt.id)}
                                        className={cn(
                                            "flex items-center gap-3 text-left p-4 rounded-xl border transition-all hover:border-green-200",
                                            selectedExtras.includes(opt.id) ? "border-green-600 bg-green-50/50" : "border-gray-100 bg-white"
                                        )}
                                    >
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                            selectedExtras.includes(opt.id) ? "bg-green-600 border-green-600" : "border-gray-300"
                                        )}>
                                            {selectedExtras.includes(opt.id) && <Check size={14} className="text-white" />}
                                        </div>
                                        <div>
                                            <span className="block font-medium text-gray-900 text-sm">{opt.label}</span>
                                            <span className="block text-xs text-gray-500">{opt.description}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Summary */}
                    <div className="lg:col-span-1 lg:sticky lg:top-24">
                        <Card className="border-green-100 shadow-xl overflow-hidden">
                            <CardHeader className="bg-green-600 text-white pb-8">
                                <CardTitle className="flex items-center gap-2">
                                    <HandCoins className="text-green-100" />
                                    Resumen Estimado
                                </CardTitle>
                                <CardDescription className="text-green-100/80">Basado en condiciones estándar del mercado.</CardDescription>
                            </CardHeader>
                            <CardContent className="-mt-4 bg-white rounded-t-3xl pt-8 relative">
                                {!isComplete ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Rocket className="mx-auto mb-3 text-gray-300" size={48} />
                                        <p>Completa los pasos para ver tu estimado 🚀</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold mb-1">Rango de Inversión</p>
                                            <div className="text-4xl font-bold text-gray-900">
                                                {formatPrice(calculateTotal())}
                                                <span className="text-lg text-gray-400 font-normal ml-1">*</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">*Precio final sujeto a revisión de requerimientos.</p>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-gray-100">
                                            {type && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Base ({PROJECT_TYPES.find(t => t.id === type)?.label})</span>
                                                    <span className="font-medium">{formatPrice(PROJECT_TYPES.find(t => t.id === type)?.price || 0)}</span>
                                                </div>
                                            )}
                                            {design && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Diseño ({DESIGN_LEVELS.find(t => t.id === design)?.label})</span>
                                                    <span className="font-medium">{formatPrice(DESIGN_LEVELS.find(t => t.id === design)?.price || 0)}</span>
                                                </div>
                                            )}
                                            {selectedExtras.length > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Extras ({selectedExtras.length})</span>
                                                    <span className="font-medium">
                                                        {formatPrice(selectedExtras.reduce((acc, curr) => acc + (EXTRAS.find(e => e.id === curr)?.price || 0), 0))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-gray-50 flex flex-col gap-3 p-6">
                                <Link
                                    href={`/contacto?subject=Cotizacion%20Web&type=${type || ''}&budget=${calculateTotal()}`}
                                    className="w-full"
                                >
                                    <Button disabled={!isComplete} className="w-full bg-green-600 hover:bg-green-700 text-lg h-12 shadow-md">
                                        Agendar Consultoría Gratis
                                        <ArrowRight className="ml-2" />
                                    </Button>
                                </Link>
                                <Button variant="ghost" size="sm" onClick={reset} className="text-gray-400 hover:text-gray-600">
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Reiniciar
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
