'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, ShoppingBag, MessageSquare, Eye, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import TrialPreview from './TrialPreview';
import TrialChat from './TrialChat';
import PricingOverlay from './PricingOverlay';
import StylePicker, { STYLES } from './StylePicker';

const STORAGE_KEY = 'rentaweb_trial';

export default function TryPage() {
    const [businessName, setBusinessName] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');
    const [styleKey, setStyleKey] = useState(null); // null = AI decides

    // 'form' | 'style' | 'preview'
    const [phase, setPhase] = useState('form');
    const [isGenerating, setIsGenerating] = useState(false);
    const [html, setHtml] = useState('');
    const [error, setError] = useState('');

    const [editsUsed, setEditsUsed] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showSideButton, setShowSideButton] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.generatedHtml && data.businessName) {
                    setBusinessName(data.businessName);
                    setBusinessDescription(data.businessDescription || '');
                    setHtml(data.generatedHtml);
                    setEditsUsed(data.editsUsed || 0);
                    setStyleKey(data.styleKey ?? null);
                    setPhase('preview');
                    setShowSideButton(true);
                    if (data.editsUsed >= 2) setShowOverlay(true);
                }
            }
        } catch (e) {}
    }, []);

    useEffect(() => {
        if (html && businessName) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                businessName,
                businessDescription,
                generatedHtml: html,
                editsUsed,
                styleKey,
                createdAt: new Date().toISOString(),
            }));
        }
    }, [html, editsUsed, businessName, businessDescription, styleKey]);

    const handleFormNext = (e) => {
        e.preventDefault();
        if (!businessName.trim() || !businessDescription.trim()) return;
        setError('');
        setPhase('style');
    };

    const handleGenerate = async () => {
        setError('');
        setIsGenerating(true);
        setPhase('preview');

        try {
            const res = await fetch('/api/try/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: businessName.trim(),
                    businessDescription: businessDescription.trim(),
                    styleKey: styleKey ?? undefined,
                }),
            });

            const data = await res.json();

            if (res.ok && data.html) {
                setHtml(data.html);
                setShowSideButton(true);
            } else {
                setError(data.error || 'Greška pri generiranju.');
                setPhase('style');
            }
        } catch (err) {
            console.error(err);
            setError('Greška pri povezivanju. Pokušajte ponovno.');
            setPhase('style');
        } finally {
            setIsGenerating(false);
        }
    };

    const trialData = { businessName, businessDescription, generatedHtml: html, editsUsed, styleKey };

    // ── FORM PHASE ─────────────────────────────────────────────
    if (phase === 'form') {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col">
                <nav className="px-6 py-4 border-b border-zinc-800/50">
                    <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors w-fit text-sm">
                        <ArrowLeft size={16} />
                        Natrag na početnu
                    </Link>
                </nav>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-lg">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-8 justify-center">
                            <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">1</span>
                                <span className="text-xs text-white font-medium">Podaci</span>
                            </div>
                            <div className="h-px w-8 bg-zinc-700" />
                            <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center">2</span>
                                <span className="text-xs text-zinc-500">Stil</span>
                            </div>
                            <div className="h-px w-8 bg-zinc-700" />
                            <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center">3</span>
                                <span className="text-xs text-zinc-500">Rezultat</span>
                            </div>
                        </div>

                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-xs text-zinc-400 mb-6">
                                <Sparkles size={14} />
                                Besplatno · Bez registracije
                            </div>
                            <h1 className="text-4xl font-bold mb-4 tracking-tight">
                                Isprobaj u 30 sekundi
                            </h1>
                            <p className="text-zinc-400 text-lg">
                                Unesi osnovne podatke o svom biznisu i AI će ti generirati web stranicu. Odmah.
                            </p>
                        </div>

                        <form onSubmit={handleFormNext} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Naziv biznisa *
                                </label>
                                <input
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder='Npr. "Frizerski salon Maja"'
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Kratki opis biznisa *
                                </label>
                                <textarea
                                    value={businessDescription}
                                    onChange={(e) => setBusinessDescription(e.target.value)}
                                    placeholder='Npr. "Frizerski salon u centru Zagreba specijaliziran za šišanje, bojanje i njegu kose."'
                                    rows={4}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                                    maxLength={1000}
                                    required
                                />
                                <p className="text-xs text-zinc-600 mt-1.5">{businessDescription.length}/1000 znakova</p>
                            </div>

                            <button
                                type="submit"
                                disabled={!businessName.trim() || !businessDescription.trim()}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                Dalje — odaberi stil
                                <ChevronRight size={20} />
                            </button>

                            <p className="text-center text-xs text-zinc-600">
                                Ne trebamo email ni karticu. Samo klikni i vidi rezultat.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ── STYLE PHASE ─────────────────────────────────────────────
    if (phase === 'style') {
        const selectedStyle = styleKey ? STYLES[styleKey] : null;

        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col">
                <nav className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-3">
                    <button
                        onClick={() => setPhase('form')}
                        className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors text-sm"
                    >
                        <ArrowLeft size={16} />
                        Natrag
                    </button>
                </nav>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-2xl">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-8 justify-center">
                            <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center justify-center">✓</span>
                                <span className="text-xs text-zinc-500">Podaci</span>
                            </div>
                            <div className="h-px w-8 bg-zinc-700" />
                            <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">2</span>
                                <span className="text-xs text-white font-medium">Stil</span>
                            </div>
                            <div className="h-px w-8 bg-zinc-700" />
                            <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center">3</span>
                                <span className="text-xs text-zinc-500">Rezultat</span>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">Odaberi vizualni stil</h2>
                            <p className="text-zinc-400">
                                AI će prilagoditi dizajn za <strong className="text-white">{businessName}</strong> prema odabranom stilu.
                            </p>
                        </div>

                        <StylePicker selected={styleKey} onSelect={setStyleKey} />

                        {error && (
                            <div className="mt-4 bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={handleGenerate}
                                className="flex-1 bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={20} />
                                {selectedStyle
                                    ? `Generiraj u "${selectedStyle.label}" stilu`
                                    : 'Generiraj (AI bira stil)'}
                            </button>
                        </div>

                        <p className="text-center text-xs text-zinc-600 mt-4">
                            Generiranje traje 15–30 sekundi
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── PREVIEW + EDITOR PHASE ──────────────────────────────────
    return (
        <div className="h-[100dvh] bg-[#050505] text-white flex flex-col overflow-hidden">
            {/* Top nav */}
            <nav className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setPhase('style')}
                        className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors text-sm flex-shrink-0"
                    >
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">Promijeni stil</span>
                    </button>
                    <div className="h-4 w-px bg-zinc-800 flex-shrink-0" />
                    <span className="text-sm text-zinc-500 truncate">{businessName}</span>
                    {styleKey && STYLES[styleKey] && (
                        <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 flex-shrink-0">
                            {STYLES[styleKey].emoji} {STYLES[styleKey].label}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowOverlay(true)}
                    className="bg-white text-black px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                    <ShoppingBag size={14} />
                    <span>Kupi paket</span>
                </button>
            </nav>

            {/* ── DESKTOP: side-by-side ── */}
            <div className="hidden md:flex flex-1 min-h-0">
                <div className="flex-1 min-w-0">
                    <TrialPreview html={html} isGenerating={isGenerating} />
                </div>
                {html && !isGenerating && (
                    <div className="w-96 lg:w-[26rem] flex-shrink-0">
                        <TrialChat
                            html={html}
                            onHtmlUpdate={(h) => setHtml(h)}
                            editsUsed={editsUsed}
                            onEditUsed={setEditsUsed}
                            onLimitReached={() => setShowOverlay(true)}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                        />
                    </div>
                )}
            </div>

            {/* ── MOBILE: full-screen preview + bottom sheet chat ── */}
            <div className="md:hidden flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                    <TrialPreview html={html} isGenerating={isGenerating} />
                </div>

                {showMobileChat && html && !isGenerating && (
                    <div className="absolute inset-0 z-30 flex flex-col" style={{ background: '#050505' }}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
                            <span className="text-sm font-semibold text-white flex items-center gap-2">
                                <MessageSquare size={15} className="text-zinc-400" />
                                AI Editor
                            </span>
                            <button
                                onClick={() => setShowMobileChat(false)}
                                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                <Eye size={14} />
                                Vidi stranicu
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <TrialChat
                                html={html}
                                onHtmlUpdate={(h) => setHtml(h)}
                                editsUsed={editsUsed}
                                onEditUsed={setEditsUsed}
                                onLimitReached={() => { setShowMobileChat(false); setShowOverlay(true); }}
                                isEditing={isEditing}
                                setIsEditing={setIsEditing}
                            />
                        </div>
                    </div>
                )}

                {html && !isGenerating && !showOverlay && (
                    <button
                        onClick={() => setShowMobileChat(v => !v)}
                        className="absolute bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-2xl transition-all active:scale-95"
                        style={{
                            background: showMobileChat ? '#27272a' : '#ffffff',
                            color: showMobileChat ? '#ffffff' : '#000000',
                            border: showMobileChat ? '1px solid #3f3f46' : 'none',
                        }}
                    >
                        {showMobileChat ? <><Eye size={16} /> Vidi stranicu</> : <><MessageSquare size={16} /> Uredi chatom</>}
                    </button>
                )}
            </div>

            {/* Floating side button — desktop only */}
            {showSideButton && !showOverlay && !isGenerating && (
                <button
                    onClick={() => setShowOverlay(true)}
                    className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 bg-white text-black px-3 py-6 rounded-l-xl font-bold text-xs shadow-2xl hover:px-4 transition-all z-40"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    Odaberi paket →
                </button>
            )}

            {showOverlay && (
                <PricingOverlay
                    onClose={() => setShowOverlay(false)}
                    trialData={trialData}
                />
            )}
        </div>
    );
}
