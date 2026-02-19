'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, CheckCircle, Globe, Zap, Code2,
    Phone, Mail, ShoppingCart, TrendingUp, Bell, Euro,
} from 'lucide-react';

/* ─── Site examples ──────────────────────────────────────────── */
const SITES = [
    {
        id: 'kisticsin',
        label: 'Kistić i Sin',
        domain: 'kisticsin.webica.hr',
        industry: 'Građevinarstvo',
        color: '#f59e0b',
        prompt: 'Kistić i Sin — obiteljska građevinska firma s 20+ godina iskustva u Zagrebu.',
        img: '/examples/kisticisin.png',
        video: 'https://e0rdnm7yvj57qqp1.public.blob.vercel-storage.com/examples/kistic-i-sin.mov',
        logs: [
            'Analiziranje industrije...',
            'Generiranje navigacije...',
            'Izrada hero sekcije...',
            'Dodavanje portfolio galerije...',
            'SEO optimizacija...',
            'Stranica je gotova! ✓',
        ],
        results: {
            type: 'leads',
            stat: { value: '12', label: 'novih upita danas', icon: TrendingUp },
            items: [
                { icon: Mail, name: 'Marko Horvat', msg: 'Trebam ponudu za renovaciju kupaonice', time: 'maloprijat', color: '#f59e0b' },
                { icon: Phone, name: 'Ana Kovač', msg: 'Zanima me izgradnja terase, možete li pozvati?', time: '15 min', color: '#f59e0b' },
                { icon: Mail, name: 'Ivan Perić', msg: 'Hitno — curenje u stanu, dostupni ste?', time: '32 min', color: '#f59e0b' },
                { icon: Mail, name: 'Petra Blažević', msg: 'Tražim majstora za žbukanje zidova', time: '1 h', color: '#f59e0b' },
            ],
        },
    },
    {
        id: 'mama-blogerica',
        label: 'Mama Blogerica',
        domain: 'mama-blogerica.webica.hr',
        industry: 'Lifestyle blog',
        color: '#ec4899',
        prompt: 'Mama Blogerica — blog o roditeljstvu, receptima i obiteljskim avanturama.',
        img: '/examples/mama-blogerica.png',
        video: 'https://e0rdnm7yvj57qqp1.public.blob.vercel-storage.com/examples/mama-blogerica.mov',
        logs: [
            'Analiziranje teme...',
            'Generiranje blog layouta...',
            'Dodavanje kategorija...',
            'Oblikovanje tipografije...',
            'Prilagodba za mobitel...',
            'Blog je spreman! ✓',
        ],
        results: {
            type: 'sales',
            stat: { value: '€247', label: 'prihod danas', icon: Euro },
            items: [
                { icon: ShoppingCart, name: 'Lucija Tomić', msg: 'Kupila "Recepti za cijelu obitelj" eBook', time: 'maloprijat', color: '#ec4899' },
                { icon: ShoppingCart, name: 'Maja Jurić', msg: 'Kupila "30 dana zdravog doručka" eBook', time: '8 min', color: '#ec4899' },
                { icon: ShoppingCart, name: 'Sara Knežević', msg: 'Kupila "Recepti za cijelu obitelj" eBook', time: '41 min', color: '#ec4899' },
                { icon: ShoppingCart, name: 'Nina Babić', msg: 'Kupila "Ideje za dječje zabave" eBook', time: '1 h', color: '#ec4899' },
            ],
        },
    },
];

/* ─── Phase durations (ms) ──────────────────────────────────── */
const PHASE_TYPING = 3200;
const PHASE_GEN = 1800;
const PHASE_RESULT = 3500;
const PHASE_RESULTS = 5000;
const CYCLE = PHASE_TYPING + PHASE_GEN + PHASE_RESULT + PHASE_RESULTS;

const PHASES = ['typing', 'generating', 'result', 'results'];

/* ─── PhaseTyping ────────────────────────────────────────────── */
function PhaseTyping({ site }) {
    const [displayed, setDisplayed] = useState('');
    const [cursor, setCursor] = useState(true);
    const text = site.prompt;

    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const iv = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) clearInterval(iv);
        }, PHASE_TYPING / text.length);
        const blink = setInterval(() => setCursor(c => !c), 500);
        return () => { clearInterval(iv); clearInterval(blink); };
    }, [site.id]);

    return (
        <div className="flex flex-col gap-4 p-5 h-full">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Code2 size={13} className="text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Novi projekt</span>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Naziv biznisa</label>
                    <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-medium">{site.label}</div>
                </div>
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Industrija</label>
                    <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300">{site.industry}</div>
                </div>
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Opis</label>
                    <div className="bg-zinc-800/60 border border-violet-500/30 rounded-lg px-3 py-2 text-sm text-zinc-300 min-h-[56px] leading-relaxed relative">
                        {displayed}
                        <span className={`inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle transition-opacity ${cursor ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── PhaseGenerating ────────────────────────────────────────── */
function PhaseGenerating({ site }) {
    const [visibleLogs, setVisibleLogs] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setVisibleLogs(0);
        setProgress(0);
        const total = site.logs.length;
        const stepDuration = PHASE_GEN / total;
        const logTimers = site.logs.map((_, i) =>
            setTimeout(() => setVisibleLogs(i + 1), i * stepDuration)
        );
        const start = Date.now();
        const raf = () => {
            const pct = Math.min(((Date.now() - start) / PHASE_GEN) * 100, 100);
            setProgress(pct);
            if (pct < 100) requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
        return () => logTimers.forEach(clearTimeout);
    }, [site.id]);

    return (
        <div className="flex flex-col gap-4 p-5 h-full">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: site.color + '20', border: `1px solid ${site.color}40` }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles size={13} style={{ color: site.color }} />
                    </motion.div>
                </div>
                <div>
                    <div className="text-sm font-semibold text-zinc-200">AI generira stranicu</div>
                    <div className="text-[10px] text-zinc-500">{site.label}</div>
                </div>
            </div>
            <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${site.color}80, ${site.color})` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                />
            </div>
            <div className="text-right text-[10px]" style={{ color: site.color, marginTop: -10 }}>{Math.round(progress)}%</div>
            <div className="flex-1 space-y-1.5 overflow-hidden font-mono">
                {site.logs.slice(0, visibleLogs).map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-2 text-[11px]">
                        <CheckCircle size={10} className={i === visibleLogs - 1 && visibleLogs < site.logs.length ? 'text-zinc-600' : 'text-green-500'} />
                        <span className={i === site.logs.length - 1 ? 'text-green-400 font-semibold' : 'text-zinc-500'}>{log}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ─── PhaseResult ────────────────────────────────────────────── */
function PhaseResult({ site }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
        }
    }, [site.id]);

    return (
        <div className="relative h-full overflow-hidden">
            <motion.video
                ref={videoRef}
                src={site.video}
                muted
                playsInline
                loop
                className="w-full h-full object-cover object-top"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            {/* Flash glow on reveal */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ background: `radial-gradient(circle at center, ${site.color}30, transparent 70%)` }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: 'linear-gradient(to top, #09090b, transparent)' }} />
            <motion.div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                style={{ background: '#16a34a22', border: '1px solid #16a34a60', color: '#4ade80' }}
                initial={{ opacity: 0, scale: 0.8, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Stranica uživo
            </motion.div>
        </div>
    );
}

/* ─── PhaseResultsStream ─────────────────────────────────────── */
function PhaseResultsStream({ site }) {
    const r = site.results;
    const StatIcon = r.stat.icon;
    const [visible, setVisible] = useState(0);
    const [counter, setCounter] = useState(0);
    const targetCount = parseInt(r.stat.value.replace(/\D/g, '')) || 0;
    const prefix = r.stat.value.replace(/\d.*/, '');   // e.g. "€"
    const isEuro = prefix === '€';

    useEffect(() => {
        setVisible(0);
        setCounter(0);

        // Stagger notifications
        const timers = r.items.map((_, i) =>
            setTimeout(() => setVisible(v => v + 1), 400 + i * 900)
        );

        // Count-up animation
        const duration = 1800;
        const start = Date.now();
        const tick = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounter(Math.round(eased * targetCount));
            if (progress < 1) requestAnimationFrame(tick);
        };
        const t0 = setTimeout(() => requestAnimationFrame(tick), 200);

        return () => { timers.forEach(clearTimeout); clearTimeout(t0); };
    }, [site.id]);

    return (
        <div className="flex flex-col p-4 gap-3 h-full overflow-hidden">
            {/* Stat card */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: site.color + '12', border: `1px solid ${site.color}30` }}
            >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: site.color + '20' }}>
                    <StatIcon size={18} style={{ color: site.color }} />
                </div>
                <div>
                    <div className="text-2xl font-extrabold leading-none" style={{ color: site.color }}>
                        {isEuro ? `€${counter}` : counter}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{r.stat.label}</div>
                </div>
                <motion.div
                    className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg"
                    style={{ background: '#16a34a18', color: '#4ade80', border: '1px solid #16a34a40' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Bell size={9} />
                    Uživo
                </motion.div>
            </motion.div>

            {/* Notification stream */}
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                <AnimatePresence>
                    {r.items.slice(0, visible).map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20, scale: 0.96 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                                style={{ background: '#18181b', border: '1px solid #27272a' }}
                            >
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: item.color + '18' }}>
                                    <Icon size={13} style={{ color: item.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-zinc-200 truncate">{item.name}</span>
                                        <span className="text-[10px] text-zinc-600 flex-shrink-0">{item.time}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.msg}</p>
                                </div>
                                {i === 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: item.color }} />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function WebsiteShowcase() {
    const [siteIdx, setSiteIdx] = useState(0);
    const [phase, setPhase] = useState('typing');
    const timeoutRef = useRef([]);

    const site = SITES[siteIdx];

    const clearAll = () => timeoutRef.current.forEach(clearTimeout);

    const startCycle = (idx) => {
        clearAll();
        setSiteIdx(idx);
        setPhase('typing');

        const t1 = setTimeout(() => setPhase('generating'), PHASE_TYPING);
        const t2 = setTimeout(() => setPhase('result'), PHASE_TYPING + PHASE_GEN);
        const t3 = setTimeout(() => setPhase('results'), PHASE_TYPING + PHASE_GEN + PHASE_RESULT);
        const t4 = setTimeout(() => startCycle((idx + 1) % SITES.length), CYCLE);

        timeoutRef.current = [t1, t2, t3, t4];
    };

    useEffect(() => {
        startCycle(0);
        return clearAll;
    }, []);

    const switchTo = (idx) => {
        if (idx === siteIdx) return;
        startCycle(idx);
    };

    const PHASE_META = {
        typing:     { label: 'Ispunjavanje forme',  color: '#a78bfa' },
        generating: { label: 'AI generira...',       color: site.color },
        result:     { label: 'Gotova stranica',      color: '#4ade80' },
        results:    { label: 'Prihodi & upiti',      color: site.color },
    };

    const { label: phaseLabel, color: phaseColor } = PHASE_META[phase];

    const PHASE_DURATIONS = {
        typing: PHASE_TYPING,
        generating: PHASE_GEN,
        result: PHASE_RESULT,
        results: PHASE_RESULTS,
    };

    return (
        <div className="relative w-full max-w-[520px] mx-auto select-none">
            {/* Ambient glow */}
            <div
                className="absolute -inset-4 rounded-3xl pointer-events-none blur-3xl opacity-20 transition-all duration-700"
                style={{ background: phaseColor }}
            />

            {/* Browser window */}
            <div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: '#09090b', border: '1px solid #27272a', boxShadow: '0 0 0 1px #27272a, 0 32px 80px rgba(0,0,0,0.5)' }}
            >
                {/* Title bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/80">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/60" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 flex items-center bg-zinc-800 rounded-lg px-3 py-1.5 gap-2">
                        <Globe size={11} className="text-zinc-500 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={`${site.domain}-${phase}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs text-zinc-400 truncate"
                            >
                                {phase === 'typing' ? 'webica.hr/novi-projekt' : site.domain}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <motion.div
                        className="text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0"
                        animate={{ color: phaseColor, borderColor: phaseColor + '40', background: phaseColor + '12' }}
                        transition={{ duration: 0.4 }}
                        style={{ border: '1px solid', borderColor: phaseColor + '40' }}
                    >
                        {phaseLabel}
                    </motion.div>
                </div>

                {/* Content area */}
                <div className="relative aspect-[16/9]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${site.id}-${phase}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                        >
                            {phase === 'typing'     && <PhaseTyping site={site} />}
                            {phase === 'generating' && <PhaseGenerating site={site} />}
                            {phase === 'result'     && <PhaseResult site={site} />}
                            {phase === 'results'    && <PhaseResultsStream site={site} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom progress timeline */}
                <div className="flex gap-1 px-4 pb-3 pt-2 bg-zinc-900/60 border-t border-zinc-800/60">
                    {PHASES.map((p) => {
                        const isActive = phase === p;
                        const isDone = PHASES.indexOf(phase) > PHASES.indexOf(p);
                        const meta = PHASE_META[p];
                        return (
                            <div key={p} className="flex-1 h-1 rounded-full overflow-hidden bg-zinc-800">
                                {isActive && (
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: meta.color }}
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: PHASE_DURATIONS[p] / 1000, ease: 'linear' }}
                                    />
                                )}
                                {isDone && (
                                    <div className="h-full w-full rounded-full" style={{ background: meta.color + '70' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Site selector pills */}
            <div className="flex items-center justify-center gap-3 mt-5">
                {SITES.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => switchTo(i)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300"
                        style={{
                            background: siteIdx === i ? s.color + '18' : 'transparent',
                            border: '1px solid',
                            borderColor: siteIdx === i ? s.color + '50' : '#3f3f46',
                            color: siteIdx === i ? s.color : '#71717a',
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: siteIdx === i ? s.color : '#52525b' }} />
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
