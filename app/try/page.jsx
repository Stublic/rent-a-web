'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import TrialPreview from './TrialPreview';
import TrialChat from './TrialChat';
import PricingOverlay from './PricingOverlay';

const STORAGE_KEY = 'rentaweb_trial';

export default function TryPage() {
    // Form state
    const [businessName, setBusinessName] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');

    // Flow state
    const [phase, setPhase] = useState('form'); // 'form' | 'preview'
    const [isGenerating, setIsGenerating] = useState(false);
    const [html, setHtml] = useState('');
    const [error, setError] = useState('');

    // Editor state
    const [editsUsed, setEditsUsed] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showSideButton, setShowSideButton] = useState(false);

    // Load existing trial from localStorage
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
                    setPhase('preview');
                    setShowSideButton(true);
                    if (data.editsUsed >= 2) {
                        // Already locked, show overlay
                        setShowOverlay(true);
                    }
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }, []);

    // Save trial data to localStorage on changes
    useEffect(() => {
        if (html && businessName) {
            const data = {
                businessName,
                businessDescription,
                generatedHtml: html,
                editsUsed,
                createdAt: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }, [html, editsUsed, businessName, businessDescription]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!businessName.trim() || !businessDescription.trim()) return;

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
                }),
            });

            const data = await res.json();

            if (res.ok && data.html) {
                setHtml(data.html);
                setShowSideButton(true);
            } else {
                setError(data.error || 'Greška pri generiranju.');
                setPhase('form');
            }
        } catch (err) {
            console.error(err);
            setError('Greška pri povezivanju. Pokušajte ponovno.');
            setPhase('form');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleHtmlUpdate = (newHtml) => {
        setHtml(newHtml);
    };

    const handleEditUsed = (count) => {
        setEditsUsed(count);
    };

    const handleLimitReached = () => {
        setShowOverlay(true);
    };

    const trialData = {
        businessName,
        businessDescription,
        generatedHtml: html,
        editsUsed,
    };

    // FORM PHASE
    if (phase === 'form') {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col">
                {/* Top nav */}
                <nav className="px-6 py-4 border-b border-zinc-800/50">
                    <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors w-fit text-sm">
                        <ArrowLeft size={16} />
                        Natrag na početnu
                    </Link>
                </nav>

                {/* Form */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-lg">
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

                        <form onSubmit={handleGenerate} className="space-y-6">
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
                                    placeholder='Npr. "Frizerski salon u centru Zagreba specijaliziran za šišanje, bojanje i njegu kose. Nudimo premium usluge u opuštenom ambijentu."'
                                    rows={4}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                                    maxLength={1000}
                                    required
                                />
                                <p className="text-xs text-zinc-600 mt-1.5">
                                    {businessDescription.length}/1000 znakova
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!businessName.trim() || !businessDescription.trim()}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                Generiraj moju stranicu
                                <ArrowRight size={20} />
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

    // PREVIEW + EDITOR PHASE
    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
            {/* Top nav */}
            <nav className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors text-sm">
                        <ArrowLeft size={14} />
                        Početna
                    </Link>
                    <div className="h-4 w-px bg-zinc-800" />
                    <span className="text-sm text-zinc-500 truncate max-w-[200px]">
                        {businessName}
                    </span>
                </div>
                <button
                    onClick={() => setShowOverlay(true)}
                    className="bg-white text-black px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                >
                    <ShoppingBag size={14} />
                    Kupi paket
                </button>
            </nav>

            {/* Main content */}
            <div className="flex flex-1 min-h-0">
                {/* Preview */}
                <div className="flex-1 min-w-0">
                    <TrialPreview html={html} isGenerating={isGenerating} />
                </div>

                {/* Chat Editor */}
                {html && !isGenerating && (
                    <div className="w-full md:w-96 lg:w-[26rem] flex-shrink-0">
                        <TrialChat
                            html={html}
                            onHtmlUpdate={handleHtmlUpdate}
                            editsUsed={editsUsed}
                            onEditUsed={handleEditUsed}
                            onLimitReached={handleLimitReached}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                        />
                    </div>
                )}
            </div>

            {/* Floating side button */}
            {showSideButton && !showOverlay && !isGenerating && (
                <button
                    onClick={() => setShowOverlay(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 bg-white text-black px-3 py-6 rounded-l-xl font-bold text-xs shadow-2xl hover:px-4 transition-all z-40 writing-vertical"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    Odaberi paket →
                </button>
            )}

            {/* Pricing Overlay */}
            {showOverlay && (
                <PricingOverlay
                    onClose={() => setShowOverlay(false)}
                    trialData={trialData}
                />
            )}
        </div>
    );
}
