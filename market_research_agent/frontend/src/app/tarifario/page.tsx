"use client"

import { motion } from "framer-motion"
import { Check, Zap, Rocket, Crown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

const plans = [
    {
        name: "Básico",
        price: "499",
        description: "Ideal para pequeños negocios que comienzan en el mundo digital.",
        icon: Zap,
        features: [
            "Gestión de 2 redes sociales",
            "10 publicaciones mensuales",
            "Diseño de publicaciones",
            "Reporte mensual básico",
            "Atención al cliente por email",
        ],
        cta: "Empezar",
        popular: false,
    },
    {
        name: "Profesional",
        price: "999",
        description: "La opción perfecta para hacer crecer tu marca.",
        icon: Rocket,
        features: [
            "Gestión de 4 redes sociales",
            "20 publicaciones mensuales",
            "Diseño + Videos cortos",
            "Reporte semanal detallado",
            "Gestión de ads ($500 presupuesto)",
            "Atención al cliente prioritaria",
        ],
        cta: "Elegir Profesional",
        popular: true,
    },
    {
        name: "Empresarial",
        price: "1999",
        description: "Solución completa para grandes empresas.",
        icon: Crown,
        features: [
            "Gestión de todas las redes",
            "Publicaciones ilimitadas",
            "Producción de video y foto",
            "Estrategia de contenido completa",
            "Gestión de ads (presupuesto incluido)",
            "Analítica avanzada y reuniones",
            "Gerente de cuenta dedicado",
        ],
        cta: "Contactarnos",
        popular: false,
    },
]

export default function TarifarioPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-white text-black pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-black mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al inicio
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Tarifarios</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Elige el plan que mejor se adapte a tus necesidades. Todos incluyen estrategia personalizada.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative rounded-3xl p-8 border ${
                                    plan.popular
                                        ? "border-blue-600 bg-gradient-to-b from-blue-50 to-white shadow-xl shadow-blue-100"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                } transition-all hover:shadow-lg`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                                        Más Popular
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        plan.popular ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                                    }`}>
                                        <plan.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                        <p className="text-sm text-gray-500">{plan.description}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <span className="text-4xl font-bold">${plan.price}</span>
                                    <span className="text-gray-500">/mes</span>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-gray-600">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                plan.popular ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                                            }`}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button className={`w-full py-4 rounded-xl font-semibold transition-all ${
                                    plan.popular
                                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                                        : "bg-black text-white hover:bg-gray-800"
                                }`}>
                                    {plan.cta}
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-20 text-center bg-gray-50 rounded-3xl p-12"
                    >
                        <h2 className="text-3xl font-bold mb-4">¿Necesitas algo personalizado?</h2>
                        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
                            Podemos crear un plan a tu medida con servicios específicos para tu industria.
                        </p>
                        <Link href="/" className="inline-block px-8 py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors">
                            Contactar Ventas
                        </Link>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    )
}
