"use client";

import React, { useEffect, useRef } from "react";


function ParticlesCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            mousePosition.current = { x: event.clientX, y: event.clientY };
        };

        window.addEventListener("mousemove", handleMouseMove);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
                this.color = `rgba(0, 255, 255, ${Math.random() * 0.5})`;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                // Mouse interaction
                const dx = mousePosition.current.x - this.x;
                const dy = mousePosition.current.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    this.x -= dx * 0.05;
                    this.y -= dy * 0.05;
                }

                if (this.x > canvas!.width) this.x = 0;
                if (this.x < 0) this.x = canvas!.width;
                if (this.y > canvas!.height) this.y = 0;
                if (this.y < 0) this.y = canvas!.height;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particles = [];
            // Reduced particle count for better performance on mobile
            const particleCount = window.innerWidth < 768 ? 50 : 80;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            particles.forEach((a, index) => {
                for (let j = index; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 - distance / 1000})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []); // Re-bind effect if mouse position logic changes substantially, though ref usage is better for per-frame updates. 
    // Optimization: In a real high-perf scenario, we'd use a ref for mouse pos to avoid re-triggering effect, 
    // but for this effect binding it is okay or we can just read the latest ref value in animation loop.
    // The current useMousePosition hook causes re-renders on every move, which might re-trigger this effect if passed as dep.
    // Actually, useMousePosition returns state, so it triggers re-render. 
    // To avoid effect re-creation, we should NOT pass mousePosition to dependency array if we want persistence, 
    // but we need the latest value. Re-creating the effect on every mouse move is bad for canvas.
    // FIXME: I will refactor to use a ref for mouse position inside the component to avoid effect re-runs.

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export default React.memo(ParticlesCanvas);

