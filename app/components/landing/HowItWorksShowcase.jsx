'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
    ClipboardList,
    Sparkles,
    MessageSquare,
    Globe,
    CheckCircle,
    ArrowRight,
    Zap,
    RotateCcw,
    Send,
    Eye,
    ExternalLink,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Step definitions
───────────────────────────────────────────── */
const STEPS = [
    {
        id: 0,
        icon: ClipboardList,
        label: 'Ispuni formu',
        sublabel: '2 minute',
        color: '#a1a1aa',
        desc: 'Unesite naziv biznisa i kratki opis. Naš AI razumije vaš jezik i industriju.',
    },
    {
        id: 1,
        icon: Sparkles,
        label: 'AI generira',
        sublabel: '30 sekundi',
        color: '#a78bfa',
        desc: 'Umjetna inteligencija kreira kompletnu web stranicu — dizajn, tekstove, slike, SEO.',
    },
    {
        id: 2,
        icon: MessageSquare,
        label: 'Uredi chatom',
        sublabel: 'U realnom vremenu',
        color: '#34d399',
        desc: 'Razgovarajte s AI-om kao s dizajnerom. Svaka promjena se odmah vidi. Undo u jednom kliku.',
    },
    {
        id: 3,
        icon: Globe,
        label: 'Objavi',
        sublabel: 'Odmah online',
        color: '#60a5fa',
        desc: 'Vaša stranica je odmah dostupna na webica.hr subdomeni ili vašoj vlastitoj domeni.',
    },
];

/* ─────────────────────────────────────────────
   Mockup: Step 0 — Form
───────────────────────────────────────────── */
function MockupForm() {
    const [typed, setTyped] = useState('');
    const [phase, setPhase] = useState(0); // 0=typing name, 1=done name, 2=typing desc, 3=done
    const nameText = 'Frizerski salon Petra';
    const descText = 'Salon za šišanje i bojanje kose u Splitu. Nudimo premium usluge za muškarce i žene.';

    useEffect(() => {
        setTyped(''); setPhase(0);
        let i = 0;
        const typeInterval = setInterval(() => {
            i++;
            setTyped(nameText.slice(0, i));
            if (i >= nameText.length) {
                clearInterval(typeInterval);
                setPhase(1);
                setTimeout(() => {
                    setPhase(2);
                    let j = 0;
                    const type2 = setInterval(() => {
                        j++;
                        setTyped(descText.slice(0, j));
                        if (j >= descText.length) { clearInterval(type2); setPhase(3); }
                    }, 22);
                }, 700);
            }
        }, 55);
        return () => clearInterval(typeInterval);
    }, []);

    return (
        <div className="w-full space-y-4 p-1">
            {/* Field 1 */}
            <div>
                <label className="text-xs text-zinc-500 mb-1.5 block font-medium uppercase tracking-wide">Naziv biznisa</label>
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white flex items-center gap-1 min-h-[44px]">
                    {phase < 2 ? (
                        <><span>{typed}</span><span className="w-0.5 h-4 bg-white animate-pulse ml-0.5" /></>
                    ) : (
                        <span className="text-white flex items-center gap-2">{nameText} <CheckCircle size={14} className="text-green-400" /></span>
                    )}
                </div>
            </div>
            {/* Field 2 */}
            <div>
                <label className="text-xs text-zinc-500 mb-1.5 block font-medium uppercase tracking-wide">Kratki opis</label>
                <div className="bg-zinc-900 border rounded-xl px-4 py-3 text-sm min-h-[80px] transition-colors duration-300"
                    style={{ borderColor: phase >= 2 ? '#52525b' : '#3f3f46' }}>
                    {phase >= 2 ? (
                        <><span className="text-white">{typed}</span>{phase === 2 && <span className="w-0.5 h-4 bg-white animate-pulse ml-0.5 inline-block" />}</>
                    ) : (
                        <span className="text-zinc-600 text-xs">Opišite vaš biznis...</span>
                    )}
                </div>
            </div>
            {/* Industry chips */}
            <div className="flex flex-wrap gap-2">
                {['Frizerski salon', 'Restoran', 'Odvjetnik', 'Fitness'].map((tag, i) => (
                    <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                        className="text-xs px-3 py-1 rounded-full border transition-all cursor-default"
                        style={{
                            background: i === 0 ? 'rgba(161,161,170,0.15)' : 'transparent',
                            borderColor: i === 0 ? '#71717a' : '#3f3f46',
                            color: i === 0 ? '#e4e4e7' : '#52525b',
                        }}
                    >
                        {tag}
                    </motion.span>
                ))}
            </div>
            {/* CTA */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 3 ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-default"
            >
                Generiraj moju stranicu <ArrowRight size={16} />
            </motion.div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Mockup: Step 1 — AI Generation
───────────────────────────────────────────── */
function MockupGenerate() {
    const [stage, setStage] = useState(0);
    const stages = [
        { label: 'Analiziranje biznisa...', pct: 15 },
        { label: 'Kreiranje dizajna...', pct: 38 },
        { label: 'Pisanje tekstova...', pct: 62 },
        { label: 'Generiranje slika...', pct: 80 },
        { label: 'SEO optimizacija...', pct: 93 },
        { label: 'Finalizacija...', pct: 100 },
    ];

    useEffect(() => {
        setStage(0);
        const timers = stages.map((_, i) =>
            setTimeout(() => setStage(i), i === 0 ? 0 : i * 900)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    const current = stages[Math.min(stage, stages.length - 1)];

    return (
        <div className="w-full space-y-6 p-1">
            {/* AI Brain animation */}
            <div className="flex items-center justify-center">
                <div className="relative w-20 h-20">
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.3), transparent)' }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    />
                    <div className="absolute inset-2 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                        <Sparkles size={26} className="text-violet-400" />
                    </div>
                    {/* Orbiting dots */}
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-violet-400"
                            style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
                            animate={{ rotate: 360 + i * 120 }}
                            initial={{ rotate: i * 120 }}
                            transition={{ repeat: Infinity, duration: 2 + i * 0.5, ease: 'linear' }}
                            // This creates an orbit effect via translateX
                        >
                            <motion.div
                                className="w-2 h-2 rounded-full bg-violet-400 opacity-80"
                                style={{ transform: 'translateX(28px)' }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Stage label */}
            <div className="text-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={stage}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-sm font-medium text-zinc-300"
                    >
                        {current.label}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-600">
                    <span>Napredak</span>
                    <motion.span
                        key={current.pct}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-violet-400 font-bold"
                    >
                        {current.pct}%
                    </motion.span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
                        animate={{ width: `${current.pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Log lines */}
            <div className="space-y-1.5 font-mono text-xs">
                {stages.slice(0, stage + 1).map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-zinc-500"
                    >
                        <span className="text-green-400">✓</span>
                        <span>{s.label.replace('...', '')}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Mockup: Step 2 — Chat Editor
───────────────────────────────────────────── */
function MockupChat() {
    const conversation = [
        { role: 'user', text: 'Promijeni boju gumba u zelenu' },
        { role: 'ai', text: 'Napravljeno! Gumbi su sada zeleni. 🎨' },
        { role: 'user', text: 'Dodaj recenziju od Marije Horvat' },
        { role: 'ai', text: 'Dodano! Recenzija je vidljiva na stranici. ⭐' },
    ];

    const [visible, setVisible] = useState(0);

    useEffect(() => {
        setVisible(0);
        const timers = conversation.map((_, i) =>
            setTimeout(() => setVisible(i + 1), i === 0 ? 500 : i * 1600 + 500)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    const btnGreen = visible >= 2;
    const showReview = visible >= 4;

    return (
        <div className="w-full flex flex-col gap-3 p-1">

            {/* ── Mini website preview ── */}
            <div className="rounded-xl overflow-hidden border border-zinc-700/60" style={{ background: '#0f0f0f' }}>
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/80">
                    <span className="w-2 h-2 rounded-full bg-red-500/60" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                    <span className="w-2 h-2 rounded-full bg-green-500/60" />
                    <div className="flex-1 mx-2 bg-zinc-800 rounded px-2 py-0.5">
                        <span className="text-[10px] text-zinc-500 truncate">frizerskisalon-petra.webica.hr</span>
                    </div>
                    <Eye size={10} className="text-zinc-600" />
                </div>

                {/* Website wireframe */}
                <div>
                    {/* Nav */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50">
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-zinc-700" />
                            <div className="h-2 w-16 bg-zinc-700 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-7 bg-zinc-800 rounded" />
                            <div className="h-1.5 w-7 bg-zinc-800 rounded" />
                            <motion.div
                                className="h-5 px-2 rounded flex items-center"
                                animate={{ background: btnGreen ? '#22c55e' : '#52525b' }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="text-[9px] text-white font-bold">Kontakt</span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Hero */}
                    <div className="px-3 py-3 flex gap-3">
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-4/5 bg-zinc-700 rounded" />
                            <div className="h-2 w-3/5 bg-zinc-800 rounded" />
                            <div className="h-2 w-full bg-zinc-800/60 rounded mt-1" />
                            <div className="h-2 w-4/5 bg-zinc-800/60 rounded" />
                            <div className="flex gap-2 mt-2">
                                <motion.div
                                    className="h-6 px-3 rounded-lg flex items-center"
                                    animate={{ background: btnGreen ? '#22c55e' : '#52525b' }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <span className="text-[9px] text-white font-bold">Rezerviraj</span>
                                </motion.div>
                                <div className="h-6 px-3 rounded-lg border border-zinc-700 flex items-center">
                                    <span className="text-[9px] text-zinc-500">Usluge</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-20 h-16 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-zinc-700" />
                        </div>
                    </div>

                    {/* Services */}
                    <div className="px-3 pb-2 flex gap-1.5">
                        {[['Šišanje', '20€'], ['Bojanje', '50€'], ['Styling', '30€']].map(([name, price]) => (
                            <div key={name} className="flex-1 rounded-lg border border-zinc-800 p-1.5 space-y-1">
                                <div className="h-5 bg-zinc-800 rounded" />
                                <div className="h-1.5 w-3/4 bg-zinc-800/60 rounded" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] text-zinc-500">{name}</span>
                                    <span className="text-[8px] font-bold text-zinc-400">{price}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Review — animates in when AI adds it */}
                    <div className="px-3 pb-3">
                        <AnimatePresence>
                            {showReview && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: 6 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    transition={{ duration: 0.45, ease: 'easeOut' }}
                                    className="overflow-hidden"
                                >
                                    <motion.div
                                        className="border rounded-lg p-2"
                                        initial={{ borderColor: '#22c55e60', background: '#22c55e08' }}
                                        animate={{ borderColor: '#3f3f46', background: '#18181b' }}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="w-5 h-5 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                                                <span className="text-[8px] text-zinc-300 font-bold">M</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <span className="text-[9px] font-bold text-zinc-300">Marija Horvat</span>
                                                    <span className="text-[8px] text-yellow-400">★★★★★</span>
                                                </div>
                                                <p className="text-[8px] text-zinc-500 leading-relaxed">
                                                    "Odličan salon, Petra je prava profesionalka!"
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Chat messages ── */}
            <div className="space-y-2 overflow-hidden">
                {conversation.slice(0, visible).map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'ai' && (
                            <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center mr-1.5 mt-0.5 flex-shrink-0">
                                <Sparkles size={9} className="text-white" />
                            </div>
                        )}
                        <div
                            className="max-w-[80%] px-3 py-1.5 text-xs leading-relaxed"
                            style={{
                                background: msg.role === 'user' ? '#27272a' : '#18181b',
                                color: msg.role === 'user' ? '#e4e4e7' : '#a1a1aa',
                                borderRadius: msg.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                                border: '1px solid',
                                borderColor: msg.role === 'user' ? '#3f3f46' : '#27272a',
                            }}
                        >
                            {msg.text}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Input bar ── */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2">
                <span className="text-xs text-zinc-600 flex-1">Pitajte AI editora...</span>
                <div className="flex items-center gap-1.5">
                    <RotateCcw size={12} className="text-zinc-600" />
                    <Send size={12} className="text-zinc-400" />
                </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-700">
                <Zap size={10} /> <span>480 tokena preostalo</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Mockup: Step 3 — Publish
───────────────────────────────────────────── */
function MockupPublish() {
    const [published, setPublished] = useState(false);

    useEffect(() => {
        setPublished(false);
        const t = setTimeout(() => setPublished(true), 1200);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="w-full space-y-4 p-1">
            {/* Domain options */}
            <div className="space-y-2.5">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wide block">Vaša adresa</label>
                {/* Subdomain */}
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    <span className="text-sm text-white font-mono">frizerskisalon-petra</span>
                    <span className="text-sm text-zinc-500 font-mono">.webica.hr</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Uključeno</span>
                </div>
                {/* Custom domain */}
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 opacity-70">
                    <Globe size={14} className="text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-zinc-400 font-mono">www.mojasalon.hr</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">Custom</span>
                </div>
            </div>

            {/* Stats preview */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Posjeta', val: '0', unit: '/dan' },
                    { label: 'Status', val: '✓', unit: 'Online' },
                    { label: 'SSL', val: '🔒', unit: 'Aktivan' },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: published ? 1 : 0, y: published ? 0 : 10 }}
                        transition={{ delay: i * 0.15 + 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
                    >
                        <div className="text-lg font-bold text-white">{s.val}</div>
                        <div className="text-xs text-zinc-500">{s.unit}</div>
                    </motion.div>
                ))}
            </div>

            {/* Publish button */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    {!published ? (
                        <motion.button
                            key="btn"
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-default"
                            style={{ background: '#22c55e', color: 'white' }}
                        >
                            <Globe size={16} />
                            Objavi stranicu
                        </motion.button>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white' }}
                        >
                            <CheckCircle size={16} />
                            Stranica je uživo! 🎉
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Live link */}
            <AnimatePresence>
                {published && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2 text-xs text-blue-400 cursor-default"
                    >
                        <ExternalLink size={12} />
                        <span className="font-mono">frizerskisalon-petra.webica.hr</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Mockup switcher
───────────────────────────────────────────── */
const MOCKUPS = [MockupForm, MockupGenerate, MockupChat, MockupPublish];

/* ─────────────────────────────────────────────
   Mobile step wrapper — restarts mockup animations
   each time the element enters the viewport
───────────────────────────────────────────── */
function MobileStepWrapper({ step, index: i, StepMockup }) {
    const Icon = step.icon;
    const mockupRef = useRef(null);
    const isInView = useInView(mockupRef, { once: false, margin: '-80px 0px' });

    // Bump key every time element enters view → remounts mockup → restarts useEffect timers
    const [playKey, setPlayKey] = useState(0);
    const prevInView = useRef(false);
    useEffect(() => {
        if (isInView && !prevInView.current) {
            setPlayKey(k => k + 1);
        }
        prevInView.current = isInView;
    }, [isInView]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
        >
            {/* Step header card */}
            <div
                className="rounded-2xl p-4 mb-3"
                style={{
                    background: 'var(--lp-surface)',
                    border: '1px solid',
                    borderColor: step.color + '35',
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: step.color + '18',
                            border: '1px solid ' + step.color + '35',
                        }}
                    >
                        <Icon size={18} style={{ color: step.color }} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span
                                className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: step.color }}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                    background: 'var(--lp-bg)',
                                    color: 'var(--lp-text-muted)',
                                    border: '1px solid var(--lp-border)',
                                }}
                            >
                                {step.sublabel}
                            </span>
                        </div>
                        <h3
                            className="text-base font-bold"
                            style={{ color: 'var(--lp-heading)' }}
                        >
                            {step.label}
                        </h3>
                    </div>
                </div>
                <p
                    className="text-sm leading-relaxed mt-3"
                    style={{ color: 'var(--lp-text-secondary)' }}
                >
                    {step.desc}
                </p>
            </div>

            {/* Mockup window — ref here so we can detect viewport entry */}
            <div
                ref={mockupRef}
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--lp-surface)',
                    border: '1px solid var(--lp-border)',
                    boxShadow: `0 0 40px ${step.color}12`,
                }}
            >
                {/* Window chrome */}
                <div
                    className="flex items-center gap-2 px-4 py-3 border-b"
                    style={{ borderColor: 'var(--lp-border)' }}
                >
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div
                            className="flex items-center gap-2 text-xs"
                            style={{ color: 'var(--lp-text-muted)' }}
                        >
                            <Icon size={11} style={{ color: step.color }} />
                            {step.label}
                        </div>
                    </div>
                    <div className="w-12" />
                </div>
                {/* key changes on each viewport entry → full remount → animations restart */}
                <div className="p-4">
                    <StepMockup key={playKey} />
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function HowItWorksShowcase() {
    const [active, setActive] = useState(0);
    const [autoplay, setAutoplay] = useState(true);
    const timerRef = useRef(null);

    const startAutoplay = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setActive(prev => (prev + 1) % STEPS.length);
        }, 5500);
    };

    useEffect(() => {
        if (autoplay) startAutoplay();
        return () => clearInterval(timerRef.current);
    }, [autoplay]);

    const handleStepClick = (i) => {
        setActive(i);
        setAutoplay(false);
        clearInterval(timerRef.current);
    };

    const ActiveMockup = MOCKUPS[active];

    return (
        <section
            id="how-it-works"
            className="py-24 relative overflow-hidden"
            style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}
        >
            {/* Subtle background glow */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse, ${STEPS[active].color}0f 0%, transparent 70%)`,
                    transition: 'background 0.5s ease',
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                        style={{
                            background: 'var(--lp-surface)',
                            border: '1px solid var(--lp-border)',
                            color: 'var(--lp-text-muted)',
                        }}
                    >
                        Kako funkcionira
                    </div>
                    <h2
                        className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-4"
                        style={{ color: 'var(--lp-heading)' }}
                    >
                        Od ideje do weba{' '}
                        <span style={{ color: 'var(--lp-text-muted)' }}>u 4 koraka</span>
                    </h2>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--lp-text-secondary)' }}>
                        Nikakvo tehničko znanje nije potrebno. Nikakav dizajner. Samo vi i vaš biznis.
                    </p>
                </motion.div>

                {/* ════════════════════════════════
                    MOBILE layout — tab + mockup interleaved
                ════════════════════════════════ */}
                <div className="lg:hidden space-y-8">
                    {STEPS.map((step, i) => (
                        <MobileStepWrapper key={step.id} step={step} index={i} StepMockup={MOCKUPS[i]} />
                    ))}
                </div>

                {/* ════════════════════════════════
                    DESKTOP layout — tabs left, sticky mockup right
                ════════════════════════════════ */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_480px] gap-12 items-start">

                    {/* LEFT — Step list */}
                    <div className="space-y-3">
                        {STEPS.map((step, i) => {
                            const Icon = step.icon;
                            const isActive = active === i;
                            return (
                                <motion.button
                                    key={step.id}
                                    onClick={() => handleStepClick(i)}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="w-full text-left rounded-2xl transition-all duration-300 overflow-hidden"
                                    style={{
                                        background: isActive ? 'var(--lp-surface)' : 'transparent',
                                        border: '1px solid',
                                        borderColor: isActive ? step.color + '40' : 'var(--lp-border)',
                                    }}
                                >
                                    <div className="p-5 flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="flex-shrink-0">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                                                style={{
                                                    background: isActive ? step.color + '20' : 'var(--lp-surface)',
                                                    border: '1px solid',
                                                    borderColor: isActive ? step.color + '40' : 'var(--lp-border)',
                                                }}
                                            >
                                                <Icon
                                                    size={18}
                                                    style={{ color: isActive ? step.color : 'var(--lp-text-muted)' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="text-xs font-bold uppercase tracking-widest"
                                                    style={{ color: step.color, opacity: isActive ? 1 : 0.5 }}
                                                >
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>
                                                <span
                                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: 'var(--lp-bg)',
                                                        color: 'var(--lp-text-muted)',
                                                        border: '1px solid var(--lp-border)',
                                                    }}
                                                >
                                                    {step.sublabel}
                                                </span>
                                            </div>
                                            <h3
                                                className="text-lg font-bold mb-1 transition-colors"
                                                style={{ color: isActive ? 'var(--lp-heading)' : 'var(--lp-text-muted)' }}
                                            >
                                                {step.label}
                                            </h3>
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.p
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="text-sm leading-relaxed overflow-hidden"
                                                        style={{ color: 'var(--lp-text-secondary)' }}
                                                    >
                                                        {step.desc}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Arrow */}
                                        <motion.div
                                            animate={{ x: isActive ? 0 : -4, opacity: isActive ? 1 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ArrowRight size={16} style={{ color: step.color }} />
                                        </motion.div>
                                    </div>

                                    {/* Progress bar */}
                                    {isActive && autoplay && (
                                        <motion.div
                                            className="h-0.5 w-full"
                                            style={{ background: step.color, transformOrigin: 'left' }}
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ duration: 5.5, ease: 'linear' }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* RIGHT — Sticky mockup window */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:sticky lg:top-24"
                    >
                        <div
                            className="rounded-2xl overflow-hidden shadow-2xl"
                            style={{
                                background: 'var(--lp-surface)',
                                border: '1px solid var(--lp-border)',
                                boxShadow: `0 0 60px ${STEPS[active].color}15`,
                                transition: 'box-shadow 0.5s ease',
                            }}
                        >
                            {/* Window chrome */}
                            <div
                                className="flex items-center gap-2 px-4 py-3 border-b"
                                style={{ borderColor: 'var(--lp-border)' }}
                            >
                                <div className="flex gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <span className="w-3 h-3 rounded-full bg-green-500/60" />
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={active}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-xs"
                                            style={{ color: 'var(--lp-text-muted)' }}
                                        >
                                            {React.createElement(STEPS[active].icon, { size: 12, style: { color: STEPS[active].color } })}
                                            {STEPS[active].label}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                <div className="w-16" />
                            </div>

                            {/* Mockup content */}
                            <div className="p-6 min-h-[380px] flex flex-col">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={active}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -16 }}
                                        transition={{ duration: 0.35 }}
                                        className="flex-1 flex flex-col"
                                    >
                                        <ActiveMockup />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Navigation dots */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            {STEPS.map((step, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleStepClick(i)}
                                    className="rounded-full transition-all duration-300"
                                    style={{
                                        width: active === i ? 24 : 8,
                                        height: 8,
                                        background: active === i ? step.color : 'var(--lp-border)',
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
