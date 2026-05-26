"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Cpu, TrendingUp, Megaphone, Share2, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface Point3D {
    x: number;
    y: number;
    z: number;
}

const CHART_ITEMS = [
    { base: 4, variation: 2.0, duration: 1.8 },
    { base: 8, variation: 3.0, duration: 2.3 },
    { base: 5, variation: 1.8, duration: 1.6 },
    { base: 9, variation: 2.5, duration: 2.1 },
    { base: 6, variation: 2.0, duration: 1.9 },
    { base: 8, variation: 2.8, duration: 2.4 },
    { base: 4, variation: 1.5, duration: 1.7 }
];

export function HologramGlobe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState({ aiAccuracy: 98.4, marketingReach: 1420, activeAgents: 8 });

    useEffect(() => {
        const handle = requestAnimationFrame(() => {
            setMounted(true);
        });
        return () => cancelAnimationFrame(handle);
    }, []);

    // Randomize some metrics for real-time vibe
    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => {
            setStats(prev => ({
                aiAccuracy: Number((98.2 + Math.random() * 0.5).toFixed(2)),
                marketingReach: prev.marketingReach + Math.floor(Math.random() * 5) - 2,
                activeAgents: 8 + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0),
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        const width = canvas.width = 400;
        const height = canvas.height = 400;

        // Spherical coordinates distribution (Fibonacci spiral)
        const points: Point3D[] = [];
        const numPoints = 180;
        for (let i = 0; i < numPoints; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            points.push({
                x: Math.cos(theta) * Math.sin(phi),
                y: Math.sin(theta) * Math.sin(phi),
                z: Math.cos(phi),
            });
        }

        // Orbit particles
        const orbits = [
            { radius: 1.3, speed: 0.008, color: "rgba(20, 184, 166, 0.4)", tiltX: 0.5, tiltY: 0.3, progress: 0 },
            { radius: 1.5, speed: -0.005, color: "rgba(167, 139, 250, 0.4)", tiltX: -0.3, tiltY: 0.6, progress: Math.PI },
        ];

        let angleX = 0;
        let angleY = 0;
        let mouseX = 0;
        let mouseY = 0;

        // Interaction
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
            mouseY = (e.clientY - rect.top - height / 2) / (height / 2);
        };

        canvas.addEventListener("mousemove", handleMouseMove);

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Dynamic rotation speed based on hover
            angleY += 0.006 + mouseX * 0.02;
            angleX += 0.002 + mouseY * 0.01;

            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);

            const distance = 2.4;
            const radiusScale = 110;

            // Project and draw connection lines first (wireframe mesh)
            const projected: { sx: number; sy: number; sz: number; opacity: number }[] = [];

            points.forEach(p => {
                // Y-axis rotation
                const x1 = p.x * cosY - p.z * sinY;
                const z1 = p.x * sinY + p.z * cosY;

                // X-axis rotation
                const y2 = p.y * cosX - z1 * sinX;
                const z2 = p.y * sinX + z1 * cosX;

                // Camera projection
                const perspective = radiusScale / (z2 + distance);
                const sx = x1 * perspective + width / 2;
                const sy = y2 * perspective + height / 2;
                const opacity = (z2 + 1) / 2 * 0.5 + 0.15; // Depth shading

                projected.push({ sx, sy, sz: z2, opacity });
            });

            // Draw neural wireframe edges between close points
            ctx.lineWidth = 0.5;
            for (let i = 0; i < projected.length; i++) {
                const p1 = points[i];
                const proj1 = projected[i];
                if (proj1.sz > 0.4) continue; // Skip connections for back side points to avoid clutter

                let connections = 0;
                for (let j = i + 1; j < points.length; j++) {
                    if (connections >= 2) break; // Limit edges per node for HUD clarity
                    
                    const p2 = points[j];
                    const proj2 = projected[j];
                    
                    // 3D Euclidean distance
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dz = p1.z - p2.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                    if (dist < 0.28) {
                        ctx.beginPath();
                        ctx.moveTo(proj1.sx, proj1.sy);
                        ctx.lineTo(proj2.sx, proj2.sy);
                        ctx.strokeStyle = `rgba(20, 184, 166, ${proj1.opacity * 0.12})`;
                        ctx.stroke();
                        connections++;
                    }
                }
            }

            // Draw globe points
            projected.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, p.sz < 0 ? 1 : 1.5, 0, Math.PI * 2);
                ctx.fillStyle = p.sz < 0 ? `rgba(167, 139, 250, ${p.opacity})` : `rgba(20, 184, 166, ${p.opacity * 1.2})`;
                ctx.fill();
            });

            // Draw orbiting rings
            orbits.forEach(orbit => {
                orbit.progress += orbit.speed;
                
                // Draw 3D orbit ring path
                ctx.beginPath();
                for (let a = 0; a < Math.PI * 2; a += 0.1) {
                    const ox = Math.cos(a) * orbit.radius;
                    const oy = Math.sin(a) * orbit.radius;
                    
                    // Tilt calculations
                    const rx = ox;
                    const ry = oy * Math.cos(orbit.tiltX);
                    const rz = oy * Math.sin(orbit.tiltX);

                    const finalX = rx * Math.cos(orbit.tiltY) - rz * Math.sin(orbit.tiltY);
                    const finalZ = rx * Math.sin(orbit.tiltY) + rz * Math.cos(orbit.tiltY);
                    
                    const perspective = radiusScale / (finalZ + distance);
                    const sx = finalX * perspective + width / 2;
                    const sy = ry * perspective + height / 2;

                    if (a === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.strokeStyle = orbit.color;
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // Draw pulsing node on the orbit
                const ox = Math.cos(orbit.progress) * orbit.radius;
                const oy = Math.sin(orbit.progress) * orbit.radius;
                
                const rx = ox;
                const ry = oy * Math.cos(orbit.tiltX);
                const rz = oy * Math.sin(orbit.tiltX);

                const finalX = rx * Math.cos(orbit.tiltY) - rz * Math.sin(orbit.tiltY);
                const finalZ = rx * Math.sin(orbit.tiltY) + rz * Math.cos(orbit.tiltY);
                
                const perspective = radiusScale / (finalZ + distance);
                const sx = finalX * perspective + width / 2;
                const sy = ry * perspective + height / 2;

                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fillStyle = orbit.radius > 1.4 ? "#a78bfa" : "#2dd4bf";
                ctx.fill();
                
                // Pulse ring
                ctx.beginPath();
                ctx.arc(sx, sy, 8 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
                ctx.strokeStyle = orbit.radius > 1.4 ? "rgba(167, 139, 250, 0.3)" : "rgba(45, 212, 191, 0.3)";
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Draw HUD target crosshairs in center (sci-fi background details)
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 160, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(20, 184, 166, 0.05)";
            ctx.stroke();
            
            // Draw ticking radar line
            const radarAngle = (Date.now() * 0.0005) % (Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(width / 2, height / 2);
            ctx.lineTo(width / 2 + Math.cos(radarAngle) * 160, height / 2 + Math.sin(radarAngle) * 160);
            ctx.strokeStyle = "rgba(20, 184, 166, 0.03)";
            ctx.stroke();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, [mounted]);

    if (!mounted) return null;

    return (
        <div className="relative w-full h-[400px] flex items-center justify-center select-none">
            {/* Ambient Background Spotlights */}
            <div className="absolute w-[280px] h-[280px] bg-teal-500/5 blur-[90px] rounded-full pointer-events-none" />
            <div className="absolute w-[200px] h-[200px] bg-purple-500/5 blur-[90px] rounded-full pointer-events-none" />

            {/* Core HTML5 3D Sphere Canvas */}
            <canvas
                ref={canvasRef}
                className="relative z-10 cursor-pointer"
                style={{ width: "400px", height: "400px" }}
            />

            {/* Orbiting Tech Badges / Floating Icons with CSS orbits */}
            
            {/* AI Node (Top Left) */}
            <div className="absolute top-8 left-4 z-20 flex items-center gap-3 bg-slate-950/70 border border-teal-500/20 px-3 py-1.5 rounded-[0.15rem] backdrop-blur-md shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
                    <Cpu className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div>
                    <p className="text-[9px] font-mono text-teal-400 font-bold tracking-widest uppercase leading-none">AI CORE STATE</p>
                    <p className="text-[11px] font-mono text-white font-bold leading-none mt-1">ACC: {stats.aiAccuracy}%</p>
                </div>
            </div>

            {/* Marketing Stats Node (Bottom Right) */}
            <div className="absolute bottom-8 right-4 z-20 flex items-center gap-3 bg-slate-950/70 border border-purple-500/20 px-3 py-1.5 rounded-[0.15rem] backdrop-blur-md shadow-[0_0_15px_rgba(167,139,250,0.1)]">
                <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                    <p className="text-[9px] font-mono text-purple-400 font-bold tracking-widest uppercase leading-none">MARKETING SYNC</p>
                    <p className="text-[11px] font-mono text-white font-bold leading-none mt-1">REACH: +{stats.marketingReach}k</p>
                </div>
            </div>

            {/* Live Chart HUD overlay (Bottom Left) */}
            <div className="absolute bottom-10 left-4 z-20 w-24 space-y-1.5 bg-slate-950/50 border border-slate-900 rounded-[0.15rem] p-2 backdrop-blur-sm pointer-events-none">
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider leading-none">AGENT STREAM</p>
                <div className="flex items-end gap-1 h-8 pt-2">
                    {CHART_ITEMS.map((item, i) => (
                        <motion.div
                            key={i}
                            animate={{ height: [`${item.base * 10}%`, `${(item.base + item.variation) * 10}%`, `${item.base * 10}%`] }}
                            transition={{ duration: item.duration, repeat: Infinity }}
                            className="w-1.5 bg-teal-500/60 rounded-t-sm"
                        />
                    ))}
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1 leading-none">
                    <span className="flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5 text-teal-400" /> ACTIVE
                    </span>
                    <span className="font-bold text-white">{stats.activeAgents}</span>
                </div>
            </div>

            {/* Floating Orbits Icons (Brain, Megaphone, Share2) orbiting abstractly */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-12 z-20 w-8 h-8 rounded-full border border-purple-500/30 bg-purple-950/50 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(167,139,250,0.2)]"
            >
                <Brain className="w-4 h-4" />
            </motion.div>

            <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[45%] right-2 z-20 w-8 h-8 rounded-full border border-teal-500/30 bg-teal-950/50 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
            >
                <Megaphone className="w-4 h-4" />
            </motion.div>

            <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[35%] left-1 z-20 w-8 h-8 rounded-full border border-teal-500/20 bg-teal-950/30 flex items-center justify-center text-teal-500"
            >
                <Share2 className="w-4 h-4" />
            </motion.div>
        </div>
    );
}
