'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Globe, Loader2, Monitor, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── Fallback static list ───────────────────────────────────── */
const FALLBACK = [
    { id: 'f1', name: 'Kistić i Sin',   url: 'https://kistic-i-sin.webica.hr',   industry: 'Građevinarstvo' },
    { id: 'f2', name: 'Mama Blogerica', url: 'https://mama-blogerica.webica.hr',  industry: 'Lifestyle blog' },
    { id: 'f3', name: 'Blogger Tata',   url: 'https://blogger-tata.webica.hr',    industry: 'Lifestyle blog' },
    { id: 'f4', name: 'Rent a Web',     url: 'https://rent-a-web.webica.hr',      industry: 'SaaS' },
    { id: 'f5', name: 'Mama Meet Up',   url: 'https://mama-meetup.webica.hr',     industry: 'Događaji' },
];

/* ─── Industry accent colour ────────────────────────────────── */
function industryColor(industry) {
    const map = {
        'Građevinarstvo': '#f59e0b',
        'Lifestyle blog': '#ec4899',
        'SaaS':           '#6366f1',
        'Događaji':       '#22c55e',
        'Fizikalna':      '#06b6d4',
        'Ogradni':        '#8b5cf6',
        'GPS':            '#f97316',
        'Jedrenje':       '#0ea5e9',
    };
    if (!industry) return '#71717a';
    for (const [k, v] of Object.entries(map)) {
        if (industry.toLowerCase().includes(k.toLowerCase())) return v;
    }
    return '#a78bfa';
}

/* ─── Full-width browser preview ────────────────────────────── */
function PreviewPanel({ project }) {
    const [loaded, setLoaded] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const color = industryColor(project.industry);

    useEffect(() => {
        setLoaded(false);
        setIframeKey(k => k + 1);
    }, [project.id]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full rounded-2xl overflow-hidden flex flex-col"
                style={{
                    border: '1px solid var(--lp-border)',
                    boxShadow: `0 0 80px ${color}18`,
                    background: 'var(--lp-surface)',
                }}
            >
                {/* ── Browser chrome ── */}
                <div
                    className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
                    style={{ borderColor: 'var(--lp-border)', background: 'var(--lp-card)' }}
                >
                    {/* Traffic lights */}
                    <div className="flex gap-1.5 flex-shrink-0">
                        <span className="w-3 h-3 rounded-full bg-red-500/60" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>

                    {/* URL bar */}
                    <div
                        className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}
                    >
                        <Globe size={11} style={{ color: 'var(--lp-text-muted)', flexShrink: 0 }} />
                        <span className="text-xs truncate" style={{ color: 'var(--lp-text-muted)' }}>
                            {project.url?.replace(/^https?:\/\//, '')}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold flex-shrink-0" style={{ color: '#4ade80' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            LIVE
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => { setLoaded(false); setIframeKey(k => k + 1); }}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--lp-border)]"
                            style={{ color: 'var(--lp-text-muted)' }}
                            title="Osvježi"
                        >
                            <RefreshCw size={13} />
                        </button>
                        <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--lp-border)]"
                            style={{ color: 'var(--lp-text-muted)' }}
                            title="Otvori u novom tabu"
                        >
                            <ExternalLink size={13} />
                        </a>
                    </div>
                </div>

                {/* ── Iframe ── */}
                <div className="relative w-full" style={{ height: 560, overflowX: 'hidden', touchAction: 'pan-y' }}>
                    {!loaded && (
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
                            style={{ background: 'var(--lp-surface)' }}
                        >
                            <Loader2 size={28} className="animate-spin" style={{ color }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--lp-text-muted)' }}>
                                Učitavanje stranice...
                            </span>
                        </div>
                    )}
                    <iframe
                        key={iframeKey}
                        src={project.url}
                        title={project.name}
                        className="absolute inset-0 w-full h-full border-0"
                        style={{ overflowX: 'hidden' }}
                        onLoad={() => setLoaded(true)}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>

                {/* ── Footer ── */}
                <div
                    className="px-4 py-2.5 flex items-center gap-3 border-t flex-shrink-0"
                    style={{ borderColor: 'var(--lp-border)', background: 'var(--lp-card)' }}
                >
                    <div
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: color + '18', color, border: `1px solid ${color}40` }}
                    >
                        {project.industry || 'Web stranica'}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>
                        {project.name}
                    </span>
                    <span className="ml-auto text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>
                        Napravljeno s Rent a Web
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─── Horizontal thumb card ─────────────────────────────────── */
function ThumbCard({ project, isActive, onClick, index }) {
    const color = industryColor(project.industry);
    const domain = project.url?.replace(/^https?:\/\//, '');

    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative flex-shrink-0 rounded-xl overflow-hidden text-left transition-all duration-300"
            style={{
                width: 180,
                background: 'var(--lp-card)',
                border: '1px solid',
                borderColor: isActive ? color + '60' : 'var(--lp-card-border)',
                boxShadow: isActive ? `0 0 0 2px ${color}30, 0 8px 28px ${color}18` : 'none',
            }}
        >
            {/* Gradient preview tile */}
            <div
                className="relative flex items-center justify-center"
                style={{
                    height: 80,
                    background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
                    borderBottom: `1px solid ${isActive ? color + '40' : 'var(--lp-card-border)'}`,
                }}
            >
                {/* Dot texture */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle, ${color}35 1px, transparent 1px)`,
                        backgroundSize: '16px 16px',
                        opacity: 0.5,
                    }}
                />
                {/* Faux URL bar */}
                <div
                    className="absolute top-2.5 left-2.5 right-2.5 h-4 rounded flex items-center gap-1 px-1.5"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
                >
                    <Globe size={7} style={{ color, flexShrink: 0 }} />
                    <span className="text-[7px] truncate opacity-70" style={{ color: '#fff' }}>{domain}</span>
                </div>
                {/* Site icon */}
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mt-3"
                    style={{ background: color + '25', border: `1px solid ${color}50` }}
                >
                    <Globe size={15} style={{ color }} />
                </div>
                {/* Active ring */}
                {isActive && (
                    <motion.div
                        layoutId="thumb-ring"
                        className="absolute inset-0 rounded-t-xl"
                        style={{ boxShadow: `inset 0 0 0 2px ${color}` }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    />
                )}
            </div>

            {/* Label */}
            <div className="px-2.5 py-2">
                <div className="text-xs font-semibold truncate" style={{ color: 'var(--lp-heading)' }}>
                    {project.name}
                </div>
                {project.industry && (
                    <div className="text-[10px] truncate mt-0.5" style={{ color }}>
                        {project.industry}
                    </div>
                )}
            </div>
        </motion.button>
    );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function Portfolio() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIdx, setActiveIdx] = useState(0);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetch('/api/portfolio')
            .then(r => r.json())
            .then(data => {
                setProjects(data.projects?.length ? data.projects : FALLBACK);
            })
            .catch(() => setProjects(FALLBACK))
            .finally(() => setLoading(false));
    }, []);

    const active = projects[activeIdx];

    // Scroll active card into view in the horizontal strip
    useEffect(() => {
        if (!scrollRef.current) return;
        const card = scrollRef.current.children[activeIdx];
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [activeIdx]);

    const prev = () => setActiveIdx(i => Math.max(0, i - 1));
    const next = () => setActiveIdx(i => Math.min(projects.length - 1, i + 1));

    return (
        <section
            id="examples"
            className="py-24 relative overflow-hidden"
            style={{ background: 'var(--lp-bg-alt)', borderTop: '1px solid var(--lp-border)' }}
        >
            <div className="max-w-7xl mx-auto px-6">

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row justify-between items-end mb-10 gap-6"
                >
                    <div>
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}
                        >
                            <Monitor size={12} />
                            Primjeri
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-bold mb-3" style={{ color: 'var(--lp-heading)' }}>
                            Stvarni projekti,<br className="hidden sm:block" /> stvarni rezultati
                        </h2>
                        <p className="text-lg" style={{ color: 'var(--lp-text-secondary)' }}>
                            Ove stranice naši korisnici koriste svaki dan za privlačenje kupaca.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {loading && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />}
                        {active && (
                            <a
                                href={active.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                                style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text)' }}
                            >
                                <ExternalLink size={14} />
                                Otvori stranicu
                            </a>
                        )}
                    </div>
                </motion.div>

                {/* ── Full-width browser preview ── */}
                {active && <PreviewPanel project={active} />}

                {/* ── Horizontal card strip ── */}
                <div className="mt-8 relative">
                    {/* Prev / Next arrows */}
                    {projects.length > 1 && (
                        <>
                            <button
                                onClick={prev}
                                disabled={activeIdx === 0}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-0"
                                style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={next}
                                disabled={activeIdx === projects.length - 1}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-0"
                                style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </>
                    )}

                    {/* Scrollable strip */}
                    <div
                        ref={scrollRef}
                        className="flex flex-nowrap gap-3 overflow-x-auto pb-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 rounded-xl animate-pulse"
                                    style={{ width: 180, height: 120, background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                                />
                            ))
                            : projects.map((p, i) => (
                                <ThumbCard
                                    key={p.id}
                                    project={p}
                                    isActive={activeIdx === i}
                                    onClick={() => setActiveIdx(i)}
                                    index={i}
                                />
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
