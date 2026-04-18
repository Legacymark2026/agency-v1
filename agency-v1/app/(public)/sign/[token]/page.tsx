"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle, Edit, Shield, Clock, FileText, Loader2 } from "lucide-react";

export default function SignProposalPage({ params }: { params: Promise<{ token: string }> }) {
    const [token, setToken] = useState<string>("");
    const [proposal, setProposal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signed, setSigned] = useState(false);
    const [signingLoading, setSigningLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        params.then(p => {
            setToken(p.token);
            fetch(`/api/proposals/${p.token}/sign?token=${p.token}`)
                .then(r => r.json())
                .then(d => {
                    if (d.data) setProposal(d.data);
                    else setError(d.error ?? "Propuesta no encontrada");
                })
                .catch(() => setError("Error al cargar la propuesta"))
                .finally(() => setLoading(false));
        });
    }, [params]);

    // Canvas signature logic
    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        if ("touches" in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const pos = getPos(e, canvas);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = "#0d9488";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSign = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !proposal) return;
        const signature = canvas.toDataURL("image/png");
        setSigningLoading(true);
        try {
            const res = await fetch(`/api/proposals/${proposal.id}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature }),
            });
            const data = await res.json();
            if (data.success) setSigned(true);
            else setError(data.error ?? "Error al firmar");
        } catch { setError("Error de conexión"); }
        setSigningLoading(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#020817' }}>
            <Loader2 className="animate-spin text-teal-400" size={32} />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#020817' }}>
            <div className="text-center">
                <p className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">{error}</p>
            </div>
        </div>
    );

    if (signed) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#020817', backgroundImage: "url('/grid.svg')" }}>
            <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)' }}>
                    <CheckCircle size={36} className="text-teal-400" />
                </div>
                <h1 className="font-mono text-2xl font-black text-slate-100 mb-3">¡Propuesta Firmada!</h1>
                <p className="font-mono text-xs text-slate-500">Tu firma ha sido registrada exitosamente. Recibirás una copia por email.</p>
                <p className="font-mono text-xs text-slate-700 mt-4">{new Date().toLocaleString()}</p>
            </div>
        </div>
    );

    const items = proposal?.items ?? [];
    const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

    return (
        <div className="min-h-screen py-12 px-4" style={{ background: '#020817' }}>
            <div className="max-w-2xl mx-auto space-y-6" style={{ backgroundImage: "url('/grid.svg')", backgroundSize: 'contain', opacity: 0.03 }}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 font-mono text-xs text-teal-400" style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
                        <Shield size={10} />FIRMA DIGITAL SEGURA
                    </div>
                    <h1 className="font-mono text-2xl font-black text-slate-100">{proposal?.title}</h1>
                    <p className="font-mono text-xs text-slate-500 mt-2">{proposal?.company?.name}</p>
                </div>

                {/* Proposal details */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(15,20,35,0.9)', border: '1px solid rgba(30,41,59,0.8)' }}>
                    <p className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-4">Detalle de la Propuesta</p>
                    <div className="space-y-2 mb-4">
                        {items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                                <div>
                                    <p className="font-mono text-xs text-slate-200">{item.title}</p>
                                    {item.description && <p className="font-mono text-xs text-slate-600">{item.description}</p>}
                                </div>
                                <p className="font-mono text-xs font-bold text-slate-100">${(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <p className="font-mono text-xs font-bold text-slate-400">TOTAL</p>
                        <p className="font-mono text-2xl font-black text-teal-400">${total.toLocaleString()}</p>
                    </div>
                    {proposal?.expiresAt && (
                        <div className="flex items-center gap-2 mt-4 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Clock size={12} className="text-amber-400" />
                            <p className="font-mono text-xs text-amber-400">Vence: {new Date(proposal.expiresAt).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>

                {/* Signature pad */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(15,20,35,0.9)', border: '1px solid rgba(30,41,59,0.8)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">Firma Digital</p>
                        {hasSignature && (
                            <button onClick={clearSignature} className="font-mono text-xs text-slate-600 hover:text-slate-400 transition-colors">
                                Limpiar
                            </button>
                        )}
                    </div>
                    <canvas ref={canvasRef} width={560} height={160}
                        className="w-full rounded-xl cursor-crosshair select-none"
                        style={{ background: 'rgba(30,41,59,0.3)', border: `1px solid ${hasSignature ? 'rgba(13,148,136,0.4)' : 'rgba(30,41,59,0.8)'}`, touchAction: "none" }}
                        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)}
                        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)}
                    />
                    {!hasSignature && (
                        <p className="font-mono text-xs text-slate-700 text-center mt-2">Dibuja tu firma con el mouse o el dedo</p>
                    )}
                </div>

                {/* Legal & Sign button */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(15,20,35,0.9)', border: '1px solid rgba(30,41,59,0.8)' }}>
                    <p className="font-mono text-xs text-slate-600 text-center mb-4 leading-relaxed">
                        Al firmar este documento, confirmo que he leído y acepto los términos y condiciones de la propuesta. Esta firma electrónica tiene validez legal.
                    </p>
                    <button onClick={handleSign} disabled={!hasSignature || signingLoading}
                        className="w-full py-4 rounded-xl font-mono text-[12px] font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)', boxShadow: hasSignature ? '0 0 30px rgba(13,148,136,0.4)' : 'none' }}>
                        {signingLoading ? "Registrando firma..." : "Firmar y Aceptar Propuesta"}
                    </button>
                </div>
            </div>
        </div>
    );
}
