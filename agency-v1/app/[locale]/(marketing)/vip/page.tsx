import { VIPForm } from "@/components/forms/vip-form";
import { Sparkles, Zap, Lock, Crown, TrendingUp } from "lucide-react";
import { InfiniteLogos } from "@/components/sections/infinite-logos";

export const metadata = {
    title: "VIP Strategic Access | Legacy Marketing",
    description: "Priority channel for exclusive partners.",
};

export default function VIPPage() {
    return (
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#030014] pt-20 pb-0">
            {/* Background Effects */}
            <div className="bg-noise" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-purple-900/20 blur-[130px] rounded-full pointer-events-none opacity-40 mix-blend-screen" />

            {/* Hero Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center mb-12">

                {/* Left Column: Value Prop */}
                <div className="text-center lg:text-left space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-900/10 backdrop-blur-md">
                        <Crown className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-200 uppercase tracking-widest">
                            Invitación Exclusiva
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                        Tu Atajo al <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-purple-300 to-cyan-300">Crecimiento Exponencial</span>
                    </h1>

                    <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
                        Si tienes nuestra tarjeta, es porque vemos en tu marca un potencial <strong className="text-white font-semibold">fuera de serie</strong>.
                        Omitimos la burocracia para conectarte directo con nuestros estrategas senior.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <Zap className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-medium">Prioridad Máxima</p>
                                <p className="text-xs">Atención en &lt; 24h</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <TrendingUp className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-medium">ROI Focus</p>
                                <p className="text-xs">Estrategias de alto impacto</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="relative w-full max-w-md mx-auto lg:mr-0">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-30 blur-xl animate-pulse-slow" />
                    <VIPForm />
                </div>
            </div>

            {/* Social Proof Footer */}
            <div className="relative z-10 w-full bg-black/20 backdrop-blur-sm border-t border-white/5 mt-auto">
                <InfiniteLogos />
            </div>
        </main>
    );
}
