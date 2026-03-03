"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, ExternalLink, ArrowRight } from "lucide-react";

// ─── Canvas Confetti ─────────────────────────────────────────────────────────
function ConfettiCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const COLORS = ["#4ade80", "#22c55e", "#fbbf24", "#f97316", "#a855f7", "#3b82f6", "#ec4899", "#14b8a6"];
        const particles = [];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 8 + 4,
                h: Math.random() * 4 + 2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 8,
                opacity: 1,
            });
        }

        let animId;
        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;
            let alive = false;
            for (const p of particles) {
                p.x += p.vx;
                p.vy += 0.04; // gravity
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                if (frame > 80) p.opacity = Math.max(0, p.opacity - 0.008);

                if (p.opacity > 0 && p.y < canvas.height + 20) {
                    alive = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = p.opacity;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                }
            }
            if (alive) animId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[60] pointer-events-none"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
}

// ─── Success Celebration Overlay ─────────────────────────────────────────────
export default function SuccessCelebration({ seconds, onDismiss, projectId }) {
    return (
        <>
            <ConfettiCanvas />
            <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                    className="rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden text-center"
                    style={{ background: 'var(--lp-bg-alt)', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                    {/* Emoji + glow */}
                    <div className="pt-8 pb-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                            className="relative inline-flex items-center justify-center w-20 h-20 mx-auto"
                        >
                            <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', filter: 'blur(12px)' }} />
                            <span className="text-5xl relative z-10">🎉</span>
                        </motion.div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold px-6 mt-2" style={{ color: 'var(--lp-heading)' }}>
                        Web stranica je spremna!
                    </h2>

                    {/* Time badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                        <span className="text-lg">⚡</span>
                        <span className="text-sm font-bold" style={{ color: '#4ade80' }}>
                            Generirano za {seconds} {seconds === 1 ? 'sekundu' : seconds < 5 ? 'sekunde' : 'sekundi'}
                        </span>
                    </motion.div>

                    <p className="text-xs mt-3 px-6" style={{ color: 'var(--lp-text-muted)' }}>
                        Webica AI je upravo kreirala vašu web stranicu. Možete je pregledati, uređivati i objaviti.
                    </p>

                    {/* Actions */}
                    <div className="px-6 pb-6 pt-5 space-y-2.5">
                        <button
                            onClick={onDismiss}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}
                        >
                            <ArrowRight size={16} />
                            Pregledaj stranicu
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
