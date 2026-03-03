"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Type, Image, Save, MousePointer2, Pencil, Check } from "lucide-react";

// ─── Animated Demos ──────────────────────────────────────────────────────────

function TextEditDemo() {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 800),   // cursor moves to text
            setTimeout(() => setPhase(2), 1800),   // text selected
            setTimeout(() => setPhase(3), 2800),   // typing new text
            setTimeout(() => setPhase(4), 4200),   // done
        ];
        const loop = setTimeout(() => setPhase(0), 5800);
        return () => { timers.forEach(clearTimeout); clearTimeout(loop); };
    }, [phase === 0 ? 0 : null]);

    // Reset loop
    useEffect(() => {
        if (phase === 4) {
            const t = setTimeout(() => setPhase(0), 1600);
            return () => clearTimeout(t);
        }
    }, [phase]);

    return (
        <div className="relative rounded-xl overflow-hidden" style={{ background: '#fafafa', border: '1px solid #e4e4e7' }}>
            {/* Fake website preview */}
            <div className="p-5">
                {/* Nav */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500" />
                        <div className="w-16 h-2 rounded bg-gray-300" />
                    </div>
                    <div className="flex gap-3">
                        <div className="w-10 h-1.5 rounded bg-gray-200" />
                        <div className="w-10 h-1.5 rounded bg-gray-200" />
                        <div className="w-10 h-1.5 rounded bg-gray-200" />
                    </div>
                </div>

                {/* Hero text area */}
                <div className="mb-3">
                    <div className="relative inline-block">
                        <motion.div
                            className="text-sm font-bold text-gray-800 relative"
                            animate={{
                                backgroundColor: phase === 2 ? 'rgba(59,130,246,0.15)' : 'transparent',
                                borderBottom: phase >= 1 && phase <= 3 ? '2px dashed #3b82f6' : '2px dashed transparent',
                            }}
                            transition={{ duration: 0.3 }}
                            style={{ padding: '2px 4px', borderRadius: 4 }}
                        >
                            {phase >= 3 ? (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.1 }}
                                >
                                    <span className="text-blue-600">Najbolji frizer u gradu</span>
                                    {phase === 3 && (
                                        <motion.span
                                            className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5"
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                            style={{ verticalAlign: 'middle' }}
                                        />
                                    )}
                                </motion.span>
                            ) : (
                                "Dobrodošli u naš salon"
                            )}
                        </motion.div>

                        {/* Cursor */}
                        <AnimatePresence>
                            {phase >= 1 && phase <= 3 && (
                                <motion.div
                                    initial={{ x: -20, y: 20, opacity: 0, scale: 0.5 }}
                                    animate={{
                                        x: phase === 1 ? 50 : phase === 2 ? 30 : 155,
                                        y: phase === 1 ? 5 : phase === 2 ? 0 : 0,
                                        opacity: 1,
                                        scale: 1
                                    }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                                    className="absolute z-10"
                                    style={{ top: 0 }}
                                >
                                    <MousePointer2 size={16} className="text-blue-500 drop-shadow-md" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Subtitle */}
                <div className="w-48 h-2 rounded bg-gray-200 mb-2" />
                <div className="w-36 h-2 rounded bg-gray-200 mb-4" />

                {/* CTA button */}
                <div className="w-24 h-6 rounded-md bg-blue-500" />
            </div>

            {/* Phase indicator */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute bottom-0 left-0 right-0 py-2 px-4 text-center text-[11px] font-medium"
                    style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', borderTop: '1px solid rgba(59,130,246,0.15)' }}
                >
                    {phase === 0 && "Kliknite na bilo koji tekst..."}
                    {phase === 1 && "Kursor se pojavljuje na elementu"}
                    {phase === 2 && "Tekst se označi za uređivanje"}
                    {phase === 3 && "Upišite novi tekst..."}
                    {phase === 4 && "✓ Tekst je promijenjen!"}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function ImageEditDemo() {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 800),   // cursor hovers on image
            setTimeout(() => setPhase(2), 1800),   // overlay appears
            setTimeout(() => setPhase(3), 2800),   // "picker" opens
            setTimeout(() => setPhase(4), 4200),   // new image
        ];
        return () => timers.forEach(clearTimeout);
    }, [phase === 0 ? 0 : null]);

    useEffect(() => {
        if (phase === 4) {
            const t = setTimeout(() => setPhase(0), 1600);
            return () => clearTimeout(t);
        }
    }, [phase]);

    return (
        <div className="relative rounded-xl overflow-hidden" style={{ background: '#fafafa', border: '1px solid #e4e4e7' }}>
            <div className="p-5">
                {/* Nav */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500" />
                        <div className="w-16 h-2 rounded bg-gray-300" />
                    </div>
                    <div className="flex gap-3">
                        <div className="w-10 h-1.5 rounded bg-gray-200" />
                        <div className="w-10 h-1.5 rounded bg-gray-200" />
                    </div>
                </div>

                {/* Image area */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="w-full h-2.5 rounded bg-gray-300 mb-2" />
                        <div className="w-3/4 h-2 rounded bg-gray-200 mb-2" />
                        <div className="w-1/2 h-2 rounded bg-gray-200" />
                    </div>

                    <motion.div
                        className="relative w-28 h-20 rounded-lg overflow-hidden flex-shrink-0"
                        animate={{
                            boxShadow: phase >= 1 && phase <= 3 ? '0 0 0 2px #3b82f6, 0 0 20px rgba(59,130,246,0.2)' : '0 0 0 0px transparent',
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* The image */}
                        <motion.div
                            className="absolute inset-0"
                            animate={{
                                background: phase >= 4 ? 'linear-gradient(135deg, #34d399, #059669)' : 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
                            }}
                            transition={{ duration: 0.4 }}
                        />

                        {/* Image icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image size={20} className={phase >= 4 ? "text-white/80" : "text-white/50"} />
                        </div>

                        {/* Hover overlay */}
                        <AnimatePresence>
                            {phase >= 2 && phase <= 3 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{ background: 'rgba(0,0,0,0.5)' }}
                                >
                                    <motion.div
                                        initial={{ scale: 0.5 }}
                                        animate={{ scale: 1 }}
                                        className="bg-white rounded-lg px-2 py-1 text-[10px] font-bold text-gray-800 flex items-center gap-1"
                                    >
                                        <Image size={10} /> Zamijeni
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Cursor */}
                        <AnimatePresence>
                            {phase >= 1 && phase <= 2 && (
                                <motion.div
                                    initial={{ x: -10, y: 30, opacity: 0 }}
                                    animate={{ x: 40, y: 8, opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", damping: 20 }}
                                    className="absolute z-10"
                                >
                                    <MousePointer2 size={16} className="text-blue-500" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Mini media picker popup */}
            <AnimatePresence>
                {phase === 3 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-4 right-4 rounded-xl shadow-2xl p-3 w-36"
                        style={{ background: '#18181b', border: '1px solid #3f3f46' }}
                    >
                        <p className="text-[9px] font-bold text-zinc-400 mb-2 uppercase">Mediji</p>
                        <div className="grid grid-cols-3 gap-1">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <motion.div
                                    key={i}
                                    className="aspect-square rounded"
                                    style={{ background: i === 2 ? '#059669' : `hsl(${i * 40}, 20%, ${35 + i * 5}%)` }}
                                    animate={i === 2 ? { boxShadow: '0 0 0 2px #3b82f6' } : {}}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase indicator */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute bottom-0 left-0 right-0 py-2 px-4 text-center text-[11px] font-medium"
                    style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', borderTop: '1px solid rgba(16,185,129,0.15)' }}
                >
                    {phase === 0 && "Kliknite na sliku koju želite promijeniti..."}
                    {phase === 1 && "Kursor se pomiče prema slici"}
                    {phase === 2 && "Pojavljuje se opcija zamjene"}
                    {phase === 3 && "Odaberite novu sliku iz medija"}
                    {phase === 4 && "✓ Slika je zamijenjena!"}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function SaveDemo() {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 800),   // changes indicator
            setTimeout(() => setPhase(2), 2000),   // cursor moves to save
            setTimeout(() => setPhase(3), 3000),   // click save
            setTimeout(() => setPhase(4), 4000),   // saved!
        ];
        return () => timers.forEach(clearTimeout);
    }, [phase === 0 ? 0 : null]);

    useEffect(() => {
        if (phase === 4) {
            const t = setTimeout(() => setPhase(0), 1600);
            return () => clearTimeout(t);
        }
    }, [phase]);

    return (
        <div className="relative rounded-xl overflow-hidden" style={{ background: '#fafafa', border: '1px solid #e4e4e7' }}>
            {/* Fake editor toolbar */}
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: '#18181b', borderBottom: '1px solid #3f3f46' }}>
                <span className="text-[11px] font-bold text-zinc-300">Live Preview</span>
                <div className="flex items-center gap-1.5">
                    {/* Visual Edit button (active) */}
                    <div className="px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <Pencil size={10} /> Uređivanje ON
                    </div>

                    {/* Save button */}
                    <motion.div
                        className="relative px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1"
                        animate={{
                            background: phase >= 3 ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                            color: phase >= 3 ? '#22c55e' : '#3b82f6',
                            border: phase >= 3 ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(59,130,246,0.3)',
                            scale: phase === 3 ? 0.95 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        {phase >= 4 ? <Check size={10} /> : <Save size={10} />}
                        {phase >= 4 ? 'Spremljeno!' : 'Spremi'}

                        {/* Cursor */}
                        <AnimatePresence>
                            {phase === 2 && (
                                <motion.div
                                    initial={{ x: -30, y: 15, opacity: 0 }}
                                    animate={{ x: 5, y: 5, opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: "spring", damping: 15 }}
                                    className="absolute z-10"
                                    style={{ right: -5, bottom: -10 }}
                                >
                                    <MousePointer2 size={16} className="text-blue-500" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Preview content with edited text highlighted */}
            <div className="p-5">
                <motion.div
                    className="text-sm font-bold text-gray-800 mb-2 inline-block px-1 rounded"
                    animate={{
                        backgroundColor: phase >= 1 ? 'rgba(59,130,246,0.08)' : 'transparent',
                        borderLeft: phase >= 1 ? '2px solid #3b82f6' : '2px solid transparent',
                    }}
                    style={{ paddingLeft: 8 }}
                >
                    Najbolji frizer u gradu
                </motion.div>
                <div className="w-40 h-2 rounded bg-gray-200 mb-2 ml-2" />
                <div className="w-32 h-2 rounded bg-gray-200 mb-4 ml-2" />

                {/* Changed indicator */}
                <AnimatePresence>
                    {phase >= 1 && phase < 4 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium mb-3 inline-flex"
                            style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)' }}
                        >
                            <Pencil size={9} /> Imate nespremljene promjene
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {phase >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium inline-flex"
                            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                        >
                            <Check size={9} /> Promjene su spremljene!
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Phase indicator */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute bottom-0 left-0 right-0 py-2 px-4 text-center text-[11px] font-medium"
                    style={{ background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', borderTop: '1px solid rgba(139,92,246,0.15)' }}
                >
                    {phase === 0 && "Nakon uređivanja..."}
                    {phase === 1 && "Vidite indikator nespremljenih promjena"}
                    {phase === 2 && "Kliknite 'Spremi promjene'"}
                    {phase === 3 && "Spremanje u tijeku..."}
                    {phase === 4 && "✓ Sve je spremljeno na server!"}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ─── Steps Definition ────────────────────────────────────────────────────────

const HELP_STEPS = [
    {
        id: 'text',
        title: 'Izmjena teksta',
        subtitle: 'Kliknite na tekst i izravno ga promijenite',
        icon: Type,
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.1)',
        Demo: TextEditDemo,
        tips: [
            'Kliknite na bilo koji naslov, paragraf ili gumb',
            'Tekst postaje odmah uređiv — samo tipkajte',
            'Potpuno besplatno — ne troši tokene!',
        ],
    },
    {
        id: 'image',
        title: 'Zamjena slika',
        subtitle: 'Kliknite na sliku i odaberite novu iz medija',
        icon: Image,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        Demo: ImageEditDemo,
        tips: [
            'Kliknite na sliku — pojavit će se opcija zamjene',
            'Odaberite novu sliku iz vašeg Media Picker-a',
            'Možete uploadati novu ili koristiti postojeću',
        ],
    },
    {
        id: 'save',
        title: 'Spremanje promjena',
        subtitle: 'Vaše promjene se spremaju jednim klikom',
        icon: Save,
        color: '#8b5cf6',
        bg: 'rgba(139,92,246,0.1)',
        Demo: SaveDemo,
        tips: [
            'Gumb \'Spremi\' se pojavi kad uređivanje aktivirate',
            'Pojavi se indikator ako imate nespremljene promjene',
            'Kliknite \'Spremi promjene\' — gotovo!',
        ],
    },
];

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function VisualEditorHelp({ isOpen, onClose }) {
    const [step, setStep] = useState(0);

    // Reset step when opened
    useEffect(() => {
        if (isOpen) setStep(0);
    }, [isOpen]);

    const current = HELP_STEPS[step];
    const Icon = current.icon;
    const Demo = current.Demo;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                        style={{ background: 'var(--lp-bg-alt, #18181b)', border: '1px solid var(--lp-border, #3f3f46)' }}
                    >
                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                            style={{ color: 'var(--lp-text-muted)' }}
                        >
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3 mb-1">
                                <motion.div
                                    key={step}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", damping: 15 }}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: current.bg, border: `1px solid ${current.color}30` }}
                                >
                                    <Icon size={20} style={{ color: current.color }} />
                                </motion.div>
                                <div>
                                    <motion.h2
                                        key={`title-${step}`}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-lg font-bold"
                                        style={{ color: 'var(--lp-heading, #fff)' }}
                                    >
                                        {current.title}
                                    </motion.h2>
                                    <motion.p
                                        key={`sub-${step}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-xs"
                                        style={{ color: 'var(--lp-text-muted, #71717a)' }}
                                    >
                                        {current.subtitle}
                                    </motion.p>
                                </div>
                            </div>
                        </div>

                        {/* Demo Area */}
                        <div className="px-6 mb-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Demo />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Tips */}
                        <div className="px-6 mb-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-1.5"
                                >
                                    {current.tips.map((tip, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                                                style={{ background: current.bg, color: current.color }}>
                                                {i + 1}
                                            </span>
                                            <span style={{ color: 'var(--lp-text-secondary, #a1a1aa)' }}>{tip}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Progress dots + Navigation */}
                        <div className="px-6 pb-6 flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {HELP_STEPS.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setStep(i)}
                                        className="h-1.5 rounded-full transition-all duration-300"
                                        style={{
                                            width: i === step ? 24 : 8,
                                            background: i === step ? current.color : 'var(--lp-border, #3f3f46)',
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                {step > 0 && (
                                    <button
                                        onClick={() => setStep(s => s - 1)}
                                        className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all hover:bg-white/5"
                                        style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border, #3f3f46)' }}
                                    >
                                        <ChevronLeft size={14} /> Natrag
                                    </button>
                                )}
                                {step < HELP_STEPS.length - 1 ? (
                                    <button
                                        onClick={() => setStep(s => s + 1)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all hover:scale-105"
                                        style={{ background: current.color, color: '#fff' }}
                                    >
                                        Dalje <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all hover:scale-105"
                                        style={{ background: '#22c55e', color: '#fff' }}
                                    >
                                        <Check size={14} /> Razumijem!
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
