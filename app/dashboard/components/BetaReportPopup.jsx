'use client';

import { useState, useRef, useEffect } from 'react';
import { Bug, MessageSquare, X, Send, Loader2, CheckCircle, Star } from 'lucide-react';
import { usePathname } from 'next/navigation';

// ─── Severity Options ──────────────────────────────────────────────────────────
const SEVERITY_OPTIONS = [
    { value: 'low', label: 'Nizak', color: '#3b82f6', emoji: '🔵' },
    { value: 'medium', label: 'Srednji', color: '#f59e0b', emoji: '🟡' },
    { value: 'high', label: 'Visok', color: '#f97316', emoji: '🟠' },
    { value: 'critical', label: 'Kritičan', color: '#ef4444', emoji: '🔴' },
];

// ─── Feedback Questions (same as /dashboard/feedback) ──────────────────────────
const FEEDBACK_QUESTIONS = [
    {
        id: 'first_impression',
        label: 'Kakav je tvoj prvi dojam o platformi?',
        type: 'textarea',
        placeholder: 'Recite nam iskreno što mislite...',
    },
    {
        id: 'overall',
        label: 'Ocjena platforme u cjelini?',
        type: 'rating',
    },
    {
        id: 'ease_of_use',
        label: 'Koliko je jednostavno kreirati web stranicu?',
        type: 'rating',
    },
    {
        id: 'design_quality',
        label: 'Kvaliteta dizajna generirane stranice?',
        type: 'rating',
    },
    {
        id: 'editor',
        label: 'Koliko je koristan Webica AI Editor?',
        type: 'rating',
    },
    {
        id: 'best_feature',
        label: 'Omiljena značajka platforme?',
        type: 'select',
        options: [
            'Brzo generiranje stranice',
            'Webica AI Editor',
            'Blog sa AI generiranjem članaka',
            'Jednostavnost korištenja',
            'Dizajn generiranih stranica',
            'Cijena i vrijednost',
            'Nešto drugo',
        ],
    },
    {
        id: 'missing_feature',
        label: 'Što vam najviše nedostaje?',
        type: 'select',
        options: [
            'Više predložaka dizajna',
            'E-commerce / web shop',
            'Više kontrole nad dizajnom',
            'Višejezičnost stranice',
            'Napredni SEO alati',
            'Integracije (Analytics, Facebook Pixel, itd.)',
            'Email marketing',
            'Nešto drugo',
        ],
    },
    {
        id: 'recommendation',
        label: 'Biste li preporučili Webica AI? (NPS)',
        type: 'nps',
    },
    {
        id: 'free_text',
        label: 'Dodatni komentari ili prijedlozi?',
        type: 'textarea',
        placeholder: 'Slobodno podijelite bilo kakve prijedloge...',
    },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function MiniStarRating({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        size={22}
                        fill={(hover || value) >= star ? '#fbbf24' : 'transparent'}
                        stroke={(hover || value) >= star ? '#fbbf24' : 'var(--lp-border, #333)'}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
            {value > 0 && (
                <span className="text-[10px] self-center ml-1" style={{ color: 'var(--lp-text-muted)' }}>
                    {value}/5
                </span>
            )}
        </div>
    );
}

function MiniNPSRating({ value, onChange }) {
    return (
        <div>
            <div className="grid grid-cols-11 gap-0.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className="aspect-square rounded-md text-[10px] font-semibold transition-all hover:scale-105"
                        style={{
                            background: value === n ? (n <= 6 ? '#ef4444' : n <= 8 ? '#f59e0b' : '#22c55e') : 'rgba(255,255,255,0.05)',
                            color: value === n ? '#fff' : 'var(--lp-text-muted)',
                            border: `1px solid ${value === n ? 'transparent' : 'var(--lp-border, #222)'}`,
                        }}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[9px]" style={{ color: 'var(--lp-text-muted)' }}>Nikako</span>
                <span className="text-[9px]" style={{ color: 'var(--lp-text-muted)' }}>Sigurno</span>
            </div>
        </div>
    );
}

function MiniSelect({ options, value, customValue, onChange, onCustomChange }) {
    const isCustom = value === 'Nešto drugo';
    return (
        <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className="px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:scale-105"
                        style={{
                            background: value === opt ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.05)',
                            color: value === opt ? '#000' : 'var(--lp-text-muted)',
                            border: `1px solid ${value === opt ? 'transparent' : 'var(--lp-border, #222)'}`,  
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
            {isCustom && (
                <input
                    type="text"
                    value={customValue || ''}
                    onChange={(e) => onCustomChange(e.target.value)}
                    placeholder="Upišite ovdje..."
                    autoFocus
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                />
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BetaReportPopup() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('bug');
    const [pulse, setPulse] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [tokensAwarded, setTokensAwarded] = useState(0);
    const pathname = usePathname();

    // Bug report state
    const [bugTitle, setBugTitle] = useState('');
    const [bugDesc, setBugDesc] = useState('');
    const [severity, setSeverity] = useState('medium');
    const [bugLoading, setBugLoading] = useState(false);

    // Feedback state
    const [answers, setAnswers] = useState({});
    const [customAnswers, setCustomAnswers] = useState({});
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    // Periodic attention animation
    useEffect(() => {
        if (open) return;
        const interval = setInterval(() => {
            setPulse(true);
            setTimeout(() => setPulse(false), 3000);
        }, 20000);
        const initial = setTimeout(() => {
            setPulse(true);
            setTimeout(() => setPulse(false), 3000);
        }, 5000);
        return () => { clearInterval(interval); clearTimeout(initial); };
    }, [open]);

    const resetForms = () => {
        setBugTitle(''); setBugDesc(''); setSeverity('medium');
        setAnswers({}); setCustomAnswers({});
        setSubmitted(false); setTokensAwarded(0);
    };

    const setAnswer = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }));
    const setCustomAnswer = (id, value) => setCustomAnswers(prev => ({ ...prev, [id]: value }));

    const submitBug = async (e) => {
        e.preventDefault();
        if (!bugTitle.trim() || !bugDesc.trim() || bugLoading) return;
        setBugLoading(true);
        try {
            const res = await fetch('/api/bug-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: bugTitle.trim(), description: bugDesc.trim(), severity, page: pathname }),
            });
            if (res.ok) {
                const data = await res.json();
                setTokensAwarded(data.tokensAwarded || 0);
                setSubmitted(true);
            }
        } catch (err) { console.error('Bug report error:', err); }
        setBugLoading(false);
    };

    const submitFeedback = async (e) => {
        e.preventDefault();
        const hasAnswer = Object.values(answers).some(v => v !== undefined && v !== null && v !== '' && v !== -1);
        if (!hasAnswer || feedbackLoading) return;
        setFeedbackLoading(true);
        // Merge custom answers
        const finalAnswers = { ...answers, source: 'beta_popup' };
        for (const [key, val] of Object.entries(finalAnswers)) {
            if (val === 'Nešto drugo' && customAnswers[key]) {
                finalAnswers[key] = `Nešto drugo: ${customAnswers[key]}`;
            }
        }
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: finalAnswers }),
            });
            if (res.ok) {
                const data = await res.json();
                setTokensAwarded(data.tokensAwarded || 0);
                setSubmitted(true);
            }
        } catch (err) { console.error('Feedback error:', err); }
        setFeedbackLoading(false);
    };

    return (
        <>
            {/* ─── FAB ─────────────────────────────────────────────────────── */}
            {!open && (
                <button
                    onClick={() => { setOpen(true); setSubmitted(false); }}
                    className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #333, #1a1a1a)',
                        color: 'white',
                        boxShadow: pulse
                            ? '0 0 0 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.4)'
                            : '0 8px 32px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        animation: pulse ? 'betaFabPulse 1.5s ease-in-out infinite' : undefined,
                    }}
                    title="Prijavi bug ili ostavi feedback"
                >
                    <Bug size={22} />
                    <span
                        className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ background: '#ef4444', color: 'white', animation: pulse ? 'betaDotBounce 1s ease-in-out infinite' : undefined }}
                    >!</span>
                </button>
            )}

            {/* ─── Panel ───────────────────────────────────────────────────── */}
            {open && (
                <div
                    className="fixed bottom-6 left-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{
                        background: 'var(--lp-bg-alt, #0a0a0a)',
                        border: '1px solid var(--lp-border, #222)',
                        maxHeight: 'min(680px, calc(100dvh - 6rem))',
                        animation: 'betaPanelIn 0.2s ease-out',
                    }}
                >
                    {/* Header */}
                    <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                {tab === 'bug' ? <Bug size={18} className="text-white" /> : <MessageSquare size={18} className="text-white" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Beta Tester Zona</h3>
                                <p className="text-[11px] text-white/70">Tvoj feedback nam je važan! 🙏</p>
                            </div>
                        </div>
                        <button onClick={() => { setOpen(false); setTimeout(resetForms, 300); }} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                            <X size={16} className="text-white" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--lp-border, #222)' }}>
                        {[
                            { key: 'bug', label: '🐛 Bug Report' },
                            { key: 'feedback', label: '💬 Feedback' },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => { setTab(t.key); setSubmitted(false); }}
                                className="flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                                style={{
                                    color: tab === t.key ? 'var(--lp-heading, #fff)' : 'var(--lp-text-muted)',
                                    borderBottom: tab === t.key ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5">
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
                                    <CheckCircle size={32} style={{ color: '#22c55e' }} />
                                </div>
                                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--lp-heading)' }}>Hvala ti! 🎉</h3>
                                <p className="text-sm mb-3" style={{ color: 'var(--lp-text-muted)' }}>
                                    {tab === 'bug' ? 'Bug report je poslan. Naš tim će ga pregledati.' : 'Hvala na feedbacku!'}
                                </p>
                                {tokensAwarded > 0 && (
                                    <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2" style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)' }}>
                                        <span className="text-xl">🪙</span>
                                        <div className="text-left">
                                            <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>+{tokensAwarded} tokena!</p>
                                            <p className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>
                                                {tab === 'bug' ? 'Nagrada za prijavu buga' : 'Nagrada za prvi feedback'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <button onClick={resetForms} className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--lp-heading, #fff)' }}>
                                    {tab === 'bug' ? 'Prijavi još jedan bug' : 'Ostavi još jedan feedback'}
                                </button>
                            </div>
                        ) : tab === 'bug' ? (
                            /* ─── Bug Report Form ─────────────────────── */
                            <form onSubmit={submitBug} className="space-y-4">
                                <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Nešto ne radi kako treba? Opišite problem.</p>

                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lp-text-secondary)' }}>Naslov buga *</label>
                                    <input
                                        value={bugTitle}
                                        onChange={(e) => setBugTitle(e.target.value)}
                                        placeholder="npr. Gumb za publish ne reagira"
                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lp-text-secondary)' }}>Opis problema *</label>
                                    <textarea
                                        value={bugDesc}
                                        onChange={(e) => setBugDesc(e.target.value)}
                                        placeholder="Opišite što ste radili, što se dogodilo, i što ste očekivali..."
                                        rows={4}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lp-text-secondary)' }}>Ozbiljnost</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {SEVERITY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setSeverity(opt.value)}
                                                className="py-2 rounded-lg text-xs font-medium transition-all text-center"
                                                style={{
                                                    background: severity === opt.value ? `${opt.color}20` : 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${severity === opt.value ? opt.color : 'var(--lp-border)'}`,
                                                    color: severity === opt.value ? opt.color : 'var(--lp-text-muted)',
                                                }}
                                            >
                                                {opt.emoji} {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--lp-text-muted)' }}>
                                    📍 Stranica: <span style={{ color: 'var(--lp-text-secondary)' }}>{pathname}</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={bugLoading || !bugTitle.trim() || !bugDesc.trim()}
                                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90"
                                    style={{ background: 'rgba(255,255,255,0.9)', color: '#000' }}
                                >
                                    {bugLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Pošalji Bug Report</>}
                                </button>
                            </form>
                        ) : (
                            /* ─── Feedback Form ───────────────────────── */
                            <form onSubmit={submitFeedback} className="space-y-4">
                                <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Vaše mišljenje nam pomaže poboljšati platformu.</p>

                                {FEEDBACK_QUESTIONS.map((q, idx) => (
                                    <div key={q.id} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lp-border, #222)' }}>
                                        <div className="flex items-start gap-2 mb-2">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--lp-text-muted)' }}>
                                                {idx + 1}
                                            </span>
                                            <label className="text-xs font-semibold leading-snug" style={{ color: 'var(--lp-heading)' }}>
                                                {q.label}
                                            </label>
                                        </div>

                                        <div className="ml-6">
                                            {q.type === 'rating' && (
                                                <MiniStarRating value={answers[q.id] || 0} onChange={(v) => setAnswer(q.id, v)} />
                                            )}
                                            {q.type === 'nps' && (
                                                <MiniNPSRating value={answers[q.id] ?? -1} onChange={(v) => setAnswer(q.id, v)} />
                                            )}
                                            {q.type === 'select' && (
                                                <MiniSelect
                                                    options={q.options}
                                                    value={answers[q.id]}
                                                    customValue={customAnswers[q.id]}
                                                    onChange={(v) => setAnswer(q.id, v)}
                                                    onCustomChange={(v) => setCustomAnswer(q.id, v)}
                                                />
                                            )}
                                            {q.type === 'textarea' && (
                                                <textarea
                                                    value={answers[q.id] || ''}
                                                    onChange={(e) => setAnswer(q.id, e.target.value)}
                                                    placeholder={q.placeholder}
                                                    rows={3}
                                                    className="w-full rounded-lg px-3 py-2 text-xs resize-none outline-none transition-all"
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="submit"
                                    disabled={feedbackLoading || !Object.values(answers).some(v => v !== undefined && v !== null && v !== '' && v !== -1)}
                                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90"
                                    style={{ background: 'rgba(255,255,255,0.9)', color: '#000' }}
                                >
                                    {feedbackLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Pošalji Feedback</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Animations ──────────────────────────────────────────────── */}
            <style jsx global>{`
                @keyframes betaPanelIn {
                    from { opacity: 0; transform: translateY(16px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes betaFabPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.4); transform: scale(1); }
                    50%      { box-shadow: 0 0 0 12px rgba(255,255,255,0), 0 8px 32px rgba(0,0,0,0.5); transform: scale(1.08); }
                }
                @keyframes betaDotBounce {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.3); }
                }
            `}</style>
        </>
    );
}
