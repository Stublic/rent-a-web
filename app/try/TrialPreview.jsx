'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

const GENERATION_STEPS = [
    { from: 0,  label: "Priprema podataka...",                  icon: "📋" },
    { from: 6,  label: "Webica AI analizira tvoj biznis...",    icon: "🔍" },
    { from: 15, label: "Kreiranje stranice i sadržaja...",      icon: "✍️" },
    { from: 30, label: "Generiranje slika i optimizacija...",   icon: "🎨" },
    { from: 50, label: "Koristi se jači AI model...",           icon: "🚀" },
];

const EXTENDED_MSGS = [
    { text: "Webica AI razmišlja extra duboko danas... 🧠", sub: "Kompleksniji dizajn = više vremena" },
    { text: "Kreativnost zahtijeva strpljenje! 🎨", sub: "Svaki piksel se ručno slaže (AI to radi)" },
    { text: "Generira se responsivni dizajn za sve uređaje 📱", sub: "Mobilni, tablet, desktop — sve u jednom" },
    { text: "Još malo! Savršenstvo ne trpi žurbu ⏳", sub: "Kvaliteta > brzina" },
    { text: "Koristi se napredni AI model za bolji rezultat 🚀", sub: "Automatski fallback na jači model" },
    { text: "Webica AI piše mobile-first kod s animacijama ✨", sub: "Smooth scroll, fade-in, hover efekti..." },
    { text: "Skoro gotovo! AI radi završne provjere 🔍", sub: "Validacija HTML-a, pristupačnosti i brzine" },
];

function GeneratingOverlay({ seconds }) {
    const phase = [...GENERATION_STEPS].reverse().find(p => seconds >= p.from) || GENERATION_STEPS[0];
    // Progress: assume ~4min average, cap at 95%
    const progress = Math.min(95, (seconds / 240) * 100);
    const startIdx = useMemo(() => Math.floor(Math.random() * EXTENDED_MSGS.length), []);
    const extMsg = seconds >= 50
        ? EXTENDED_MSGS[(startIdx + Math.floor((seconds - 50) / 8)) % EXTENDED_MSGS.length]
        : null;

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(12px)' }}>
            <div className="rounded-3xl max-w-md w-full shadow-2xl overflow-hidden bg-zinc-900 border border-emerald-500/20">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full animate-pulse bg-emerald-500/15" />
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">✨ Webica AI stvara web stranicu</h3>
                    <p className="text-xs text-zinc-500 mt-1">Generiranje traje u prosjeku 3–5 minuta.</p>
                </div>

                {/* Timer + Current phase */}
                <div className="mx-6 mb-4 rounded-2xl px-5 py-3 flex items-center justify-between bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl" key={phase.icon}>{phase.icon}</span>
                        <p className="text-xs font-medium text-zinc-300" key={phase.label}>{phase.label}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-2xl font-bold tabular-nums text-emerald-400">{seconds}s</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mx-6 mb-4">
                    <div className="h-1.5 rounded-full overflow-hidden bg-zinc-800">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-linear"
                            style={{
                                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                                width: `${progress}%`,
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-zinc-600">Generiranje u tijeku</span>
                        <span className="text-[10px] text-zinc-600">{seconds > 180 ? 'Koristi se jači model...' : '~3-5 min prosječno'}</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="mx-6 mb-4 space-y-1.5">
                    {GENERATION_STEPS.map((step, i) => {
                        const isDone = seconds > step.from + 8;
                        const isActive = phase.from === step.from;
                        return (
                            <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                                isActive ? 'bg-emerald-500/10 border border-emerald-500/20' :
                                isDone ? 'bg-emerald-500/5 border border-transparent' :
                                'border border-transparent'
                            }`}>
                                <span className="text-sm w-5 text-center flex-shrink-0">
                                    {isDone ? '✅' : isActive ? '⏳' : '○'}
                                </span>
                                <span className={`text-xs ${
                                    isActive ? 'text-white font-medium' :
                                    isDone ? 'text-zinc-400' :
                                    'text-zinc-600'
                                }`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Extended wait messages */}
                {extMsg && (
                    <div className="mx-6 mb-4">
                        <div className="rounded-xl px-4 py-3 text-center bg-emerald-500/5 border border-emerald-500/15">
                            <p className="text-sm font-medium text-emerald-400">{extMsg.text}</p>
                            <p className="text-[11px] mt-0.5 text-emerald-400/60">{extMsg.sub}</p>
                        </div>
                    </div>
                )}

                {/* Don't refresh warning */}
                <div className="mx-6 mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3 bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs font-medium text-yellow-400/90">
                        <strong>Ne osvježavaj stranicu!</strong> Generiranje je u tijeku — prekidanje može uzrokovati gubitak podataka.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function TrialPreview({ html, isGenerating }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [genSeconds, setGenSeconds] = useState(0);
    const iframeRef = useRef(null);
    const timerRef = useRef(null);

    // Timer for generation
    useEffect(() => {
        if (isGenerating) {
            setGenSeconds(0);
            timerRef.current = setInterval(() => setGenSeconds(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isGenerating]);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const openInNewTab = () => {
        const newWindow = window.open();
        if (newWindow && html) {
            newWindow.document.write(html);
            newWindow.document.close();
        }
    };

    // Prevent navigation inside iframe
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleIframeLoad = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) return;

                iframeDoc.addEventListener('click', (e) => {
                    const target = e.target.closest('a');
                    if (target && target.tagName === 'A') {
                        e.preventDefault();
                        const href = target.getAttribute('href');
                        if (href?.startsWith('#')) {
                            const element = iframeDoc.querySelector(href);
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                });
            } catch (error) {
                console.warn('Cannot access iframe content');
            }
        };

        iframe.addEventListener('load', handleIframeLoad);
        return () => iframe.removeEventListener('load', handleIframeLoad);
    }, [refreshKey, html]);

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <h2 className="font-bold text-white text-sm">Preview</h2>
                {html && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors text-zinc-300"
                        >
                            <RefreshCw size={14} />
                            Osvježi
                        </button>
                        <button
                            onClick={openInNewTab}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors text-zinc-300"
                        >
                            <ExternalLink size={14} />
                            Novi Tab
                        </button>
                    </div>
                )}
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-white relative overflow-auto">
                {isGenerating && <GeneratingOverlay seconds={genSeconds} />}
                
                {!isGenerating && html ? (
                    <iframe
                        ref={iframeRef}
                        key={refreshKey}
                        srcDoc={html}
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        title="Website Preview"
                    />
                ) : !isGenerating && !html ? (
                    <div className="flex items-center justify-center h-full bg-zinc-900">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">🌐</div>
                            <p className="text-zinc-400 text-sm">Tvoja web stranica će se pojaviti ovdje</p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
