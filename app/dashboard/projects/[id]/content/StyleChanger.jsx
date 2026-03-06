"use client";

import { useState, useRef, useEffect } from "react";
import { Palette, Wand2, AlertTriangle, X, Loader2, Coins, FileText, Pencil, Image, Save, Rocket, Check, Hourglass, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { changeProjectStyleAction } from "@/app/actions/change-style";
import { STYLES } from "@/lib/styles";
import { useToast } from "@/app/dashboard/components/ToastProvider";
import { ExtendedWaitBanner } from "@/app/dashboard/components/ExtendedWaitMessages";

const CATEGORIES = ['Moderno & Tehnološki', 'Kreativno & Odvažno', 'Elegantno & Premium', 'Specifične niše'];
const STYLE_COST = 500;

// ─── Generation Phases for the multi-step loader ────────────────────────────
const REGEN_PHASES = [
    { from: 0,  label: "Priprema sadržaja za novi stil...",        Icon: FileText },
    { from: 8,  label: "Webica AI piše novi dizajn...",              Icon: Pencil },
    { from: 30, label: "Generiranje slika i vizualnog stila...",    Icon: Image },
    { from: 55, label: "Provjera kvalitete i spremanje...",         Icon: Save },
    { from: 80, label: "Koristi se jači AI model...",               Icon: Rocket },
];

// ─── Regeneration Overlay (multi-step progress) ────────────────────────────
function RegenerationOverlay({ seconds, styleName }) {
    const phase = [...REGEN_PHASES].reverse().find(p => seconds >= p.from) || REGEN_PHASES[0];
    const progress = Math.min(97, 80 * (1 - Math.exp(-seconds / 160)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                style={{ background: 'var(--db-bg-alt)', border: '1px solid rgba(168,85,247,0.25)' }}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'rgba(168,85,247,0.15)' }} />
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#a855f7' }} />
                    </div>
                    <h3 className="text-lg font-bold flex items-center justify-center gap-2" style={{ color: 'var(--db-heading)' }}>
                        <Palette size={18} style={{ color: '#a855f7' }} /> Regeneracija u stilu „{styleName}“
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--db-text-muted)' }}>
                        Generiranje traje u prosjeku 3–5 minuta.
                    </p>
                </div>

                {/* Timer */}
                <div className="mx-6 mb-4 rounded-2xl px-5 py-3 flex items-center justify-between" style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <motion.span
                            key={phase.Icon.displayName || phase.from}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center"
                        ><phase.Icon size={18} style={{ color: '#a855f7' }} /></motion.span>
                        <motion.p
                            key={phase.label}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs font-medium"
                            style={{ color: 'var(--db-text-secondary)' }}
                        >{phase.label}</motion.p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-2xl font-bold tabular-nums" style={{ color: '#a855f7' }}>{seconds}s</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mx-6 mb-4">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--db-surface)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #a855f7, #c084fc)' }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>Obrada u tijeku</span>
                        <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>{seconds > 180 ? 'Koristi se jači model...' : '~3-5 min prosječno'}</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="mx-6 mb-4 space-y-1.5">
                    {REGEN_PHASES.map((p, i) => {
                        const isDone = seconds > p.from + 10;
                        const isActive = phase.from === p.from;
                        return (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                                style={{
                                    background: isActive ? 'rgba(168,85,247,0.08)' : isDone ? 'rgba(34,197,94,0.05)' : 'transparent',
                                    border: isActive ? '1px solid rgba(168,85,247,0.2)' : '1px solid transparent'
                                }}>
                                <span className="text-sm w-5 text-center flex-shrink-0 flex items-center justify-center">
                                    {isDone ? <Check size={14} className="text-emerald-400" /> : isActive ? <Hourglass size={14} style={{ color: '#a855f7' }} /> : '○'}
                                </span>
                                <span className="text-xs" style={{ color: isActive ? 'var(--db-heading)' : isDone ? 'var(--db-text-secondary)' : 'var(--db-text-muted)' }}>
                                    {p.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <ExtendedWaitBanner seconds={seconds} showAfterSeconds={90} accentColor="#a855f7" />

                {/* Warning */}
                <div className="mx-6 mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                    <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>
                        <strong>Ne osvježavaj stranicu!</strong> Generiranje je u tijeku — prekidanje može oštetiti sadržaj.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function StyleChanger({ project, userTokens }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState(null); // null = AI odabir
    const [showConfirm, setShowConfirm] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [regenSeconds, setRegenSeconds] = useState(0);
    const timerRef = useRef(null);
    const toast = useToast();

    // Cleanup timer on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleStyleClick = (styleKey) => {
        setSelectedStyle(styleKey);
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        setIsGenerating(true);
        setShowConfirm(false); // Close confirm dialog, show full-screen loader

        // Start timer
        setRegenSeconds(0);
        timerRef.current = setInterval(() => setRegenSeconds(s => s + 1), 1000);

        const result = await changeProjectStyleAction(
            project.id,
            selectedStyle ?? 'auto'
        );

        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsGenerating(false);

        if (result.error) {
            toast.error(result.error);
            setShowConfirm(true); // Re-open confirm so user sees error
            return;
        }

        // Success — reload the page to show new site
        window.location.reload();
    };

    const stylesInCategory = Object.entries(STYLES).filter(
        ([, s]) => s.category === activeCategory
    );

    const selectedStyleInfo = selectedStyle ? STYLES[selectedStyle] : null;
    const selectedStyleName = selectedStyleInfo?.label ?? 'AI odabir';
    const hasEnoughTokens = userTokens >= STYLE_COST;

    return (
        <div className="db-card p-5 mt-5">
            {/* Full-screen regeneration overlay */}
            {isGenerating && (
                <RegenerationOverlay seconds={regenSeconds} styleName={selectedStyleName} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--db-heading)' }}>
                        <Palette size={16} className="text-purple-400" />
                        Promijeni vizualni stil
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--db-text-muted)' }}>
                        Generiraj cijelu novu stranicu s istim sadržajem u drugom stilu
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Token cost badge */}
                    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                            background: hasEnoughTokens ? 'rgba(234,179,8,0.1)' : 'rgba(248,113,113,0.1)',
                            color: hasEnoughTokens ? '#ca8a04' : '#f87171',
                            border: `1px solid ${hasEnoughTokens ? 'rgba(234,179,8,0.2)' : 'rgba(248,113,113,0.2)'}`,
                        }}>
                        <Coins size={11} /> {STYLE_COST} tokena
                    </span>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}
                    >
                        {isOpen ? 'Zatvori' : 'Odaberi stil'}
                    </button>
                </div>
            </div>

            {/* Info warning */}
            {!hasEnoughTokens && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}>
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                        Nemate dovoljno tokena (imate {userTokens}, treba {STYLE_COST}).{' '}
                        <a href={`/dashboard/projects/${project.id}/tokens`} style={{ color: '#f87171', fontWeight: 700, textDecoration: 'underline' }}>
                            Kupite tokene →
                        </a>
                    </span>
                </div>
            )}

            {/* Important notice */}
            {isOpen && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)', color: '#c084fc' }}>
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                        <strong>Važno:</strong> Odabirom novog stila generirat će se <strong>potpuno nova stranica</strong> s istim sadržajem i u novom vizualnom stilu.
                        Sve ručne izmjene iz Editora bit će izgubljene. Košta <strong>{STYLE_COST} tokena</strong>.
                    </span>
                </div>
            )}

            {/* Style picker */}
            {isOpen && (
                <div>
                    {/* Category tabs */}
                    <div className="flex gap-1.5 flex-wrap mb-4">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                                style={{
                                    background: activeCategory === cat ? 'var(--db-heading)' : 'var(--db-surface)',
                                    color: activeCategory === cat ? 'var(--db-bg)' : 'var(--db-text-muted)',
                                    border: '1px solid var(--db-border)',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Style grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {/* AI odabir */}
                        {activeCategory === CATEGORIES[0] && (
                            <button
                                onClick={() => handleStyleClick(null)}
                                disabled={!hasEnoughTokens}
                                className="flex flex-col gap-1 p-3 rounded-xl text-left transition-all disabled:opacity-40"
                                style={{ border: '1px solid var(--db-border)', background: 'var(--db-surface)' }}
                            >
                                <Bot size={20} />
                                <span className="text-xs font-bold" style={{ color: 'var(--db-heading)' }}>AI odabir</span>
                                <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>AI sam bira stil</span>
                            </button>
                        )}

                        {stylesInCategory.map(([key, style]) => (
                            <button
                                key={key}
                                onClick={() => handleStyleClick(key)}
                                disabled={!hasEnoughTokens}
                                className="flex flex-col gap-1 p-3 rounded-xl text-left transition-all hover:bg-white/5 disabled:opacity-40"
                                style={{ border: '1px solid var(--db-border)', background: 'var(--db-surface)' }}
                            >
                                <span className="text-lg leading-none">{style.emoji}</span>
                                <span className="text-xs font-bold leading-tight" style={{ color: 'var(--db-heading)' }}>{style.label}</span>
                                <span className="text-[10px] leading-tight" style={{ color: 'var(--db-text-muted)' }}>{style.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Confirm popup */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                    <div className="max-w-md w-full p-6 rounded-2xl db-fade-in relative"
                        style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                        {/* Close */}
                        <button onClick={() => { setShowConfirm(false); }}
                            className="absolute top-4 right-4 p-1" style={{ color: 'var(--db-text-muted)' }}>
                            <X size={18} />
                        </button>

                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                                {selectedStyleInfo ? selectedStyleInfo.emoji : <Bot size={24} />}
                            </div>

                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--db-heading)' }}>
                                Regeneriraj u stilu „{selectedStyleName}"?
                            </h3>

                            <p className="text-sm mb-4" style={{ color: 'var(--db-text-muted)' }}>
                                Generirat će se <strong style={{ color: 'var(--db-heading)' }}>potpuno nova stranica</strong> s istim sadržajem u novom vizualnom stilu.
                                Sve ručne izmjene bit će izgubljene.
                            </p>

                            {/* Cost */}
                            <div className="flex items-center justify-center gap-2 mb-5 py-2.5 px-4 rounded-xl"
                                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
                                <Coins size={16} className="text-yellow-500" />
                                <span className="text-sm font-bold text-yellow-500">{STYLE_COST} tokena</span>
                                <span className="text-xs" style={{ color: 'var(--db-text-muted)' }}>
                                    (imat ćete {userTokens - STYLE_COST} tokena)
                                </span>
                            </div>



                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowConfirm(false); }}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                                    style={{ background: 'var(--db-bg)', color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}
                                >
                                    Odustani
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex items-center justify-center gap-2"
                                    style={{ background: 'rgba(168,85,247,0.85)', color: '#fff' }}
                                >
                                    <Wand2 size={16} /> Generiraj ({STYLE_COST} <Coins size={14} className="inline" />)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
