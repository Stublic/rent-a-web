'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, Lock, ArrowRight, Search, Pencil, ShieldCheck, Wrench } from 'lucide-react';
import { fixVisibilityClient } from '@/lib/fix-visibility-client';

const MAX_FREE_EDITS = 2;

const LOADING_STEPS = [
    { icon: Search, text: "Analiziram tvoj zahtjev...", minMs: 0 },
    { icon: Pencil, text: "Uređujem HTML i CSS...", minMs: 2000 },
    { icon: ShieldCheck, text: "Provjeravam kvalitetu...", minMs: 5000 },
];

function LoadingIndicator({ startTime }) {
    const [stepIdx, setStepIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const nextIdx = LOADING_STEPS.findLastIndex(s => elapsed >= s.minMs);
            if (nextIdx >= 0 && nextIdx !== stepIdx) setStepIdx(nextIdx);
        }, 500);
        return () => clearInterval(interval);
    }, [startTime, stepIdx]);

    const step = LOADING_STEPS[stepIdx];
    const Icon = step.icon;

    return (
        <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2.5 border border-zinc-700 max-w-[85%]">
                <div className="relative">
                    <Loader2 className="animate-spin text-emerald-400" size={14} />
                </div>
                <div className="flex items-center gap-2">
                    <Icon size={13} className="text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-300">{step.text}</span>
                </div>
                <div className="flex gap-1 ml-1">
                    {LOADING_STEPS.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= stepIdx ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function AssistantMessage({ msg, onSuggestionClick }) {
    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] space-y-2">
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                    msg.isError
                        ? 'bg-red-900/30 text-red-400 border border-red-800'
                        : msg.success
                        ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        : 'bg-zinc-800 text-zinc-200'
                }`}>
                    {msg.content}
                </div>
                {/* Suggestion chip */}
                {msg.suggestion && (
                    <button onClick={() => onSuggestionClick(msg.suggestion)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-[1.02] hover:bg-emerald-500/15 w-fit border border-emerald-500/20 text-emerald-400"
                        style={{ background: 'rgba(16,185,129,0.06)' }}>
                        <ArrowRight size={12} /> {msg.suggestion}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function TrialChat({ html, onHtmlUpdate, editsUsed, onEditUsed, onLimitReached, isEditing, setIsEditing, messages, setMessages }) {
    const [input, setInput] = useState('');
    const [loadingStart, setLoadingStart] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const isLocked = editsUsed >= MAX_FREE_EDITS;

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages, isEditing]);

    const submitEdit = async (editText) => {
        if (!editText.trim() || isEditing || isLocked || !html) return;

        const userMessage = { role: 'user', content: editText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsEditing(true);
        setLoadingStart(Date.now());

        try {
            const res = await fetch('/api/try/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, editRequest: editText }),
            });

            const data = await res.json();

            if (res.ok && data.html) {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.message || 'Izmjena primijenjena!',
                        success: true,
                        suggestion: data.suggestion || '',
                    },
                ]);
                onHtmlUpdate(data.html);
                const newCount = editsUsed + 1;
                onEditUsed(newCount);

                if (newCount >= MAX_FREE_EDITS) {
                    setTimeout(() => onLimitReached(), 1500);
                }
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.error || 'Nisam mogao primijeniti izmjenu. Pokušaj reformulirati zahtjev.',
                        isError: true,
                    },
                ]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Došlo je do greške. Pokušajte ponovno.',
                    isError: true,
                },
            ]);
        } finally {
            setIsEditing(false);
        }
    };

    // ─── Auto-detect "page is broken" requests ─────────────────────────────────
    const FIX_KEYWORDS = [
        'prazna', 'nevidljiv', 'skriveni', 'ne vidi', 'ne prikazuje',
        'nestalo', 'blank', 'hidden', 'invisible', 'opacity',
        'ne vidim', 'nema ništa', 'prazan', 'nema sadržaj',
        'slomljen', 'broken', 'crni ekran', 'bijeli ekran',
        'samo hero', 'samo footer', 'samo navbar', 'prazno',
        'horizontalni scroll', 'overflow', 'duplirano', 'dupla sekcija',
        'popravi', 'fix', 'ne radi',
    ];
    const isFixRequest = (text) => {
        const lower = text.toLowerCase();
        return FIX_KEYWORDS.some(kw => lower.includes(kw));
    };

    // ─── Client-side page fix (no AI, no edits consumed) ────────────────
    const handleFixPage = () => {
        if (!html) return;
        const fixed = fixVisibilityClient(html);
        if (fixed !== html) {
            onHtmlUpdate(fixed);
            setMessages(prev => [...prev,
                { role: 'user', content: 'Popravi stranicu' },
                { role: 'assistant', content: 'Popravak primijenjen! Ispravljeni su problemi s layoutom i vidljivošću.', success: true, suggestion: 'Pregledaj promjene u previewu' },
            ]);
        } else {
            setMessages(prev => [...prev,
                { role: 'user', content: 'Popravi stranicu' },
                { role: 'assistant', content: 'Stranica izgleda ispravno — nisam pronašao probleme.', success: true },
            ]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Auto-detect layout/visibility issues → deterministic fix, not AI
        if (isFixRequest(input)) {
            setInput('');
            handleFixPage();
            return;
        }
        await submitEdit(input);
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-bold flex items-center gap-2 text-white">
                            <Sparkles size={18} className="text-zinc-400" />
                            Webica AI Editor
                        </h2>
                        <p className="text-xs text-zinc-500">Razgovaraj s AI-em o promjenama</p>
                    </div>
                </div>

                {/* Edit Counter */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                    <span className="text-xs text-zinc-500">Besplatna uređivanja:</span>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {[...Array(MAX_FREE_EDITS)].map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full transition-colors ${
                                    i < editsUsed ? 'bg-emerald-400' : 'bg-zinc-700 border border-zinc-600'
                                }`} />
                            ))}
                        </div>
                        <span className={`text-sm font-mono font-bold ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
                            {editsUsed}/{MAX_FREE_EDITS}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isLocked && (
                    <div className="text-center text-zinc-600 text-sm mt-8 space-y-6">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto bg-zinc-800 border border-zinc-700">
                            <Sparkles size={18} className="text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-zinc-300 font-medium mb-1">Zdravo! Ja sam tvoj AI asistent.</p>
                            <p className="text-zinc-500 text-xs">Reci mi što želiš promijeniti na stranici.</p>
                        </div>
                        <div className="space-y-2 text-left max-w-sm mx-auto">
                            {[
                                'Promijeni boju gumba u crvenu',
                                'Dodaj sekciju s cijenama',
                                'Promijeni tekst u hero sekciji'
                            ].map((eg, i) => (
                                <button key={i} onClick={() => { setInput(eg); inputRef.current?.focus(); }}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-zinc-400 text-left text-sm transition-all hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-300">
                                    "{eg}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    msg.role === 'user' ? (
                        <div key={idx} className="flex justify-end">
                            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-white text-black">
                                {msg.content}
                            </div>
                        </div>
                    ) : (
                        <AssistantMessage key={idx} msg={msg} onSuggestionClick={handleSuggestionClick} />
                    )
                ))}

                {isEditing && <LoadingIndicator startTime={loadingStart} />}

                {isLocked && messages.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800/50 rounded-2xl px-4 py-3 text-sm text-zinc-500 border border-zinc-700/50 flex items-center gap-2">
                            <Lock size={14} />
                            Besplatna uređivanja su potrošena. Odaberi paket za nastavak.
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            isLocked ? 'Odaberi paket za nastavak...'
                            : !html ? 'Prvo generiraj stranicu...'
                            : "Reci mi što želiš promijeniti..."
                        }
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 text-white placeholder-zinc-500 disabled:opacity-50"
                        disabled={isEditing || isLocked || !html}
                    />
                    <button
                        type="submit"
                        disabled={isEditing || !input.trim() || isLocked || !html}
                        className="bg-white hover:bg-zinc-200 text-black px-6 rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Pošalji
                    </button>
                </div>
            </form>
        </div>
    );
}
