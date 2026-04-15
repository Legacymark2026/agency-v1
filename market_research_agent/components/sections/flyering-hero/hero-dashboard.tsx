import { memo } from "react";
import { motion, MotionValue } from "framer-motion";
import { BarChart3, Globe, ShieldCheck } from "lucide-react";

interface HeroDashboardProps {
    rotateX: MotionValue<number>;
    rotateY: MotionValue<number>;
    layer1X: MotionValue<number>;
    layer1Y: MotionValue<number>;
    layer2X: MotionValue<number>;
    layer2Y: MotionValue<number>;
}

export const HeroDashboard = memo(function HeroDashboard({
    rotateX,
    rotateY,
    layer1X,
    layer1Y,
    layer2X,
    layer2Y
}: HeroDashboardProps) {
    return (
        <div className="w-full max-w-6xl mt-20 perspective-[2000px] relative z-10 group/dashboard">
            <motion.div
                style={{ rotateX, rotateY }}
                className="relative aspect-[16/9] md:aspect-[21/9] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Layer 0: Grid Background */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] invert" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />

                {/* Layer 1: Base UI */}
                <motion.div style={{ x: layer1X, y: layer1Y }} className="absolute inset-0 p-8 flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="font-mono text-xs text-slate-500">MARKETING_DASHBOARD_V2.0</div>
                    </div>
                    {/* Footer Graph Lines (Teal) */}
                    <div className="flex gap-1 items-end h-16 opacity-30">
                        {[40, 60, 35, 80, 50, 90, 20, 70, 45, 60, 80, 50].map((h, i) => (
                            <div key={i} className="flex-1 bg-teal-500 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </motion.div>

                {/* Layer 2: Floating Cards */}
                <motion.div style={{ x: layer2X, y: layer2Y }} className="absolute inset-0 pointer-events-none">
                    {/* Card 1: Activity */}
                    <div className="absolute top-1/4 left-1/4 -translate-x-1/2 p-4 rounded-xl bg-white border border-gray-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] max-w-xs transform hover:scale-105 transition-transform duration-300 pointer-events-auto cursor-help">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><BarChart3 size={18} /></div>
                            <div>
                                <div className="text-xs text-gray-500 font-medium">Conversión</div>
                                <div className="text-lg font-bold text-slate-900">+450%</div>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 w-[75%]" />
                        </div>
                    </div>

                    {/* Card 2: Globe */}
                    <div className="absolute top-1/3 right-1/4 translate-x-1/2 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl max-w-xs hidden md:block transform hover:scale-105 transition-transform duration-300 pointer-events-auto">
                        <div className="flex items-center gap-3">
                            <Globe className="text-teal-400" size={20} />
                            <div className="text-xs text-slate-200">
                                <div>Alcance Global</div>
                                <div className="text-teal-400 font-bold">Activo</div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Security Badge */}
                    <div className="absolute bottom-1/4 left-1/3 p-3 rounded-lg bg-white border border-teal-100 flex items-center gap-3 shadow-lg">
                        <ShieldCheck size={16} className="text-teal-600" />
                        <span className="text-xs font-bold text-slate-700">VERIFIED</span>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
});
