import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Mail, Phone, Clock, Calendar, Tag, Star, TrendingUp, TrendingDown, Bell } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

// Helper: Star Rating component
function StarRating({ priority }: { priority: string }) {
    const stars = priority === 'HIGH' ? 5 : priority === 'MEDIUM' ? 3 : 1;
    return (
        <div className="flex gap-0.5" title={`Priority: ${priority}`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`w-2.5 h-2.5 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
}

export function DealCard({ deal, onQuickUpdate }: { deal: any, onQuickUpdate?: (id: string, updates: any) => void }) {
    const daysSinceAction = deal.lastActivity
        ? Math.floor((new Date().getTime() - new Date(deal.lastActivity).getTime()) / (1000 * 3600 * 24))
        : 0;

    // Phase 15: Deal Age
    const dealAge = deal.createdAt ? differenceInDays(new Date(), new Date(deal.createdAt)) : 0;

    const isStagnant = daysSinceAction > 7;
    const isOverdue = deal.expectedClose && new Date(deal.expectedClose) < new Date();
    const isHot = daysSinceAction <= 1; // Fuego: Actividad muy reciente

    // State for Inline Editing
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [editValue, setEditValue] = useState(deal.value?.toString() || "0");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingValue && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingValue]);

    const handleSaveValue = () => {
        setIsEditingValue(false);
        const numVal = parseFloat(editValue);
        if (!isNaN(numVal) && numVal !== deal.value && onQuickUpdate) {
            onQuickUpdate(deal.id, { value: numVal });
        }
    };


    // Phase 15: Value Trend (simulated - would come from DB in real app)
    const valueTrend = deal.previousValue ? (deal.value > deal.previousValue ? 'up' : deal.value < deal.previousValue ? 'down' : null) : null;

    // Phase 15: Next Action Reminder (days until expected close or follow-up)
    const daysUntilAction = deal.expectedClose
        ? differenceInDays(new Date(deal.expectedClose), new Date())
        : null;

    // Phase 15 Batch D: AI Deal Score (0-100 based on signals)
    const calculateDealScore = () => {
        let score = 50; // Base score
        // Positive signals
        if (deal.probability >= 70) score += 15;
        else if (deal.probability >= 50) score += 10;
        if (deal.value >= 10000) score += 10;
        if (deal.source === 'Referral') score += 10;
        if (deal.contactEmail && deal.contactPhone) score += 5;
        // Negative signals
        if (isStagnant) score -= 15;
        if (isOverdue) score -= 20;
        if (!deal.expectedClose) score -= 10;
        if (deal.priority === 'LOW') score -= 5;
        return Math.max(0, Math.min(100, score));
    };
    const dealScore = calculateDealScore();

    return (
        <Card className={`mb-3 cursor-grab active:cursor-grabbing hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 group relative border-l-4 overflow-hidden bg-white/80 backdrop-blur-md border border-slate-200/50 hover:bg-white/95 
            ${isStagnant ? 'ring-2 ring-cyan-200/40 bg-cyan-50/10' : ''} 
            ${isHot ? 'ring-2 ring-orange-200/50 bg-orange-50/10' : ''} 
            ${isOverdue ? 'ring-2 ring-red-400/30' : ''}`}
            style={{ borderLeftColor: deal.priority === 'HIGH' ? '#ef4444' : deal.priority === 'MEDIUM' ? '#3b82f6' : '#e5e7eb' }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <CardContent className="p-3.5 relative z-10">
                {/* Phase 15: Deal Age Badge & AI Score - Top Right Corner */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-sm border ${dealScore >= 70 ? 'bg-green-50 text-green-700 border-green-200 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                            dealScore >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}
                        title={`AI Score: ${dealScore}/100`}
                    >
                        {dealScore >= 70 ? '🔥 ' : ''}{dealScore}
                    </span>
                </div>

                {/* Header: Title, Stars, Source */}
                <div className="flex justify-between items-start mb-3 pr-12">
                    <div className="space-y-1.5 w-full">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-[13px] text-gray-800 line-clamp-2 leading-tight flex-1 group-hover:text-blue-600 transition-colors">{deal.title}</h4>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <StarRating priority={deal.priority} />

                            {deal.source && deal.source !== 'Unknown' && (
                                <Badge variant="outline" className="text-xs h-4 px-1.5 py-0 bg-blue-50/50 text-blue-700 border-blue-100 font-medium">
                                    <Tag className="w-2.5 h-2.5 mr-1 opacity-70" />{deal.source}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Value Row with Trend */}
                <div className="flex items-end justify-between mb-3 bg-gray-50/50 rounded-lg p-2 border border-gray-100/50">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.1em] mb-0.5">Valor Estimado</span>
                        <div
                            className="flex items-center gap-2 cursor-pointer group/value"
                            title="Haz doble clic para editar"
                            onDoubleClick={(e) => { e.stopPropagation(); setIsEditingValue(true); }}
                        >
                            {isEditingValue ? (
                                <Input
                                    ref={inputRef}
                                    type="number"
                                    className="h-6 w-24 text-sm font-extrabold px-1 font-mono border-blue-400 focus-visible:ring-1"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleSaveValue}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveValue();
                                        if (e.key === 'Escape') setIsEditingValue(false);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="text-[17px] font-extrabold tracking-tighter text-slate-800 font-mono group-hover/value:text-blue-600 transition-colors">
                                    {formatCurrency(deal.value)}
                                </span>
                            )}
                            {/* Phase 15: Value Trend Icon */}
                            {valueTrend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 stroke-[3]" />}
                            {valueTrend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 stroke-[3]" />}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        {isOverdue && (
                            <div className="flex items-center text-xs font-extrabold uppercase tracking-wide text-rose-600 bg-rose-100/90 px-2 py-0.5 rounded-md shadow-sm border border-rose-200/50" title="Overdue!">
                                <Calendar className="w-3 h-3 mr-1" />
                                Vencido
                            </div>
                        )}
                        {isStagnant && (
                            <div className="group/stagnant flex items-center bg-cyan-50/80 rounded-md shadow-sm pl-1.5 pr-1 py-0.5 border border-cyan-200/60" title="Ice: Stagnant > 7 days">
                                ❄️
                                <span className="text-xs font-bold text-cyan-700 mr-1 opacity-90 ml-1">
                                    {daysSinceAction}d congelado
                                </span>
                                {deal.contactEmail && (
                                    <a href={`mailto:${deal.contactEmail}?subject=Seguimiento%20sobre:%20${encodeURIComponent(deal.title)}&body=Hola%20${encodeURIComponent(deal.contactName?.split(' ')[0] || 'allí')},%0A%0A`}
                                        className="bg-white p-1 rounded-md text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all shadow-sm border border-cyan-200/50 ml-0.5"
                                        title="Enviar Email para calentar deal"
                                        onClick={(e) => { e.stopPropagation(); }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        <Mail className="w-2.5 h-2.5" />
                                    </a>
                                )}
                            </div>
                        )}
                        {isHot && !isStagnant && !isOverdue && (
                            <div className="group/hot flex items-center bg-orange-50/80 rounded-md shadow-sm px-1.5 py-0.5 border border-orange-200/60" title="Hot Deal! Activity < 24h">
                                🔥 <span className="text-xs font-bold text-orange-700 ml-1">Caliente</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Company & Probability */}
                <div className="flex justify-between items-center mb-0 gap-2">
                    <div className="flex items-center gap-2 bg-white/60 px-2 py-1.5 rounded-lg border border-slate-200/50 shadow-sm max-w-[50%] group-hover:bg-white transition-colors">
                        <img
                            src={`https://logo.clearbit.com/${deal.company?.domain || deal.contactEmail?.split('@')[1] || 'example.com'}`}
                            alt=""
                            className="w-4 h-4 rounded-full bg-slate-100 ring-1 ring-slate-200"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-xs font-bold text-slate-700 truncate">{deal.company?.name || 'Empresa'}</span>
                    </div>

                    {deal.probability > 0 ? (
                        <div className="w-[45%] flex flex-col items-end">
                            <span className="text-xs font-extrabold text-slate-400 mb-1">{deal.probability}% WIN PROB.</span>
                            <Progress value={deal.probability} className="h-1.5 w-full bg-slate-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-blue-600" />
                        </div>
                    ) : (
                        <span className="text-xs font-bold text-slate-400">Sin prob.</span>
                    )}
                </div>

                {/* Phase 15: Next Action Reminder */}
                {daysUntilAction !== null && daysUntilAction > 0 && daysUntilAction <= 7 && (
                    <div className="text-xs font-medium text-purple-700 bg-purple-50/80 px-2.5 py-1.5 rounded-md mb-3 flex items-center border border-purple-100/50">
                        <Bell className="w-3 h-3 mr-1.5 text-purple-500" />
                        Seguimiento en {daysUntilAction} día{daysUntilAction !== 1 ? 's' : ''}
                    </div>
                )}

                {/* Expected Close Date */}
                {deal.expectedClose && !isOverdue && daysUntilAction && daysUntilAction > 7 && (
                    <div className="text-xs font-medium text-gray-500 mb-3 flex items-center">
                        <Calendar className="w-3 h-3 mr-1.5 text-gray-400" />
                        Cierra en {formatDistanceToNow(new Date(deal.expectedClose))}
                    </div>
                )}

                {/* Contact Row with Quick Actions */}
                <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 ring-2 ring-white shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${deal.contactName}`} />
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-bold">{deal.contactName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 truncate max-w-[100px] leading-tight">{deal.contactName || 'Sin Contacto'}</span>
                            <span className="text-xs text-gray-400 font-medium">Hace {dealAge} días</span>
                        </div>
                    </div>

                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        {deal.contactEmail && (
                            <a href={`mailto:${deal.contactEmail}`} className="p-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-md text-gray-400 transition-colors shadow-sm border border-gray-100" title="Enviar Email">
                                <Mail className="w-3.5 h-3.5" />
                            </a>
                        )}
                        {deal.contactPhone && (
                            <a href={`tel:${deal.contactPhone}`} className="p-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-600 rounded-md text-gray-400 transition-colors shadow-sm border border-gray-100" title="Llamar">
                                <Phone className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
