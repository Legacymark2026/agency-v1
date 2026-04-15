"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-9xl font-black text-gray-900 tracking-tighter">404</h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                    Página no encontrada
                </h2>
                <p className="mt-6 text-base leading-7 text-gray-600 max-w-md mx-auto">
                    Lo sentimos, no pudimos encontrar la página que buscas. Pudo haber sido movida o eliminada.
                </p>

                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link href="/">
                        <Button size="lg" className="gap-2">
                            <Home size={18} />
                            Volver al Inicio
                        </Button>
                    </Link>
                    <Link href="/contacto">
                        <Button variant="outline" size="lg" className="gap-2">
                            <ArrowLeft size={18} />
                            Contactar Soporte
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
