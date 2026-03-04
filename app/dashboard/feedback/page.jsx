"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Star, Send, CheckCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ButtonLoader } from "../components/DashboardLoader";
import { TabLoader } from "../components/DashboardLoader";

const QUESTIONS = [
    {
        id: "first_impression",
        label: "Kakav je tvoj prvi dojam o Rent a webicaici?",
        type: "textarea",
        placeholder: "Recite nam iskreno što mislite o platformi, vašem iskustvu i dojmu...",
    },
    {
        id: "overall",
        label: "Kako biste ocijenili Webica AI platformu u cjelini?",
        type: "rating",
    },
    {
        id: "ease_of_use",
        label: "Koliko je bilo jednostavno kreirati svoju web stranicu?",
        type: "rating",
    },
    {
        id: "design_quality",
        label: "Koliko ste zadovoljni dizajnom vaše generirane stranice?",
        type: "rating",
    },
    {
        id: "editor",
        label: "Koliko je Webica AI Editor koristan za uređivanje stranice?",
        type: "rating",
    },
    {
        id: "best_feature",
        label: "Koja vam je omiljena značajka platforme?",
        type: "select",
        options: [
            "Brzo generiranje stranice",
            "Webica AI Editor",
            "Blog sa AI generiranjem članaka",
            "Jednostavnost korištenja",
            "Dizajn generiranih stranica",
            "Cijena i vrijednost",
            "Nešto drugo",
        ],
    },
    {
        id: "missing_feature",
        label: "Što vam najviše nedostaje u platformi?",
        type: "select",
        options: [
            "Više predložaka dizajna",
            "E-commerce / web shop",
            "Više kontrole nad dizajnom",
            "Višejezičnost stranice",
            "Napredni SEO alati",
            "Integracije (Analytics, Facebook Pixel, itd.)",
            "Email marketing",
            "Nešto drugo",
        ],
    },
    {
        id: "recommendation",
        label: "Koliko je vjerojatno da biste preporučili Webica AI prijatelju ili kolegi? (NPS)",
        type: "nps",
    },
    {
        id: "free_text",
        label: "Imate li dodatnih komentara, prijedloga ili kritika?",
        type: "textarea",
        placeholder: "Slobodno podijelite bilo kakve prijedloge, pohvale ili kritike...",
    },
];

function StarRating({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1.5">
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
                        size={28}
                        fill={(hover || value) >= star ? '#fbbf24' : 'transparent'}
                        stroke={(hover || value) >= star ? '#fbbf24' : 'var(--db-border)'}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
            {value > 0 && (
                <span className="text-xs self-center ml-2" style={{ color: 'var(--db-text-muted)' }}>
                    {value}/5
                </span>
            )}
        </div>
    );
}

function NPSRating({ value, onChange }) {
    return (
        <div>
            <div className="flex gap-1 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className="w-9 h-9 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        style={{
                            background: value === n ? (n <= 6 ? '#ef4444' : n <= 8 ? '#f59e0b' : '#22c55e') : 'var(--db-surface)',
                            color: value === n ? '#fff' : 'var(--db-text-muted)',
                            border: `1px solid ${value === n ? 'transparent' : 'var(--db-border)'}`,
                        }}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="flex justify-between mt-1.5 px-1">
                <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>Nikako</span>
                <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>Sigurno</span>
            </div>
        </div>
    );
}

function SelectWithOther({ options, value, customValue, onChange, onCustomChange }) {
    const isCustomSelected = value === 'Nešto drugo';

    return (
        <div className="space-y-2.5">
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={{
                            background: value === opt ? 'var(--db-heading)' : 'var(--db-surface)',
                            color: value === opt ? 'var(--db-bg)' : 'var(--db-text-secondary)',
                            border: `1px solid ${value === opt ? 'transparent' : 'var(--db-border)'}`,
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
            {isCustomSelected && (
                <input
                    type="text"
                    value={customValue || ''}
                    onChange={(e) => onCustomChange(e.target.value)}
                    placeholder="Upišite ovdje..."
                    autoFocus
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all db-fade-in"
                    style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                />
            )}
        </div>
    );
}

export default function FeedbackPage() {
    const [answers, setAnswers] = useState({});
    const [customAnswers, setCustomAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setPageLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const setAnswer = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const setCustomAnswer = (id, value) => {
        setCustomAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Merge custom answers into main answers for "Nešto drugo" selections
        const finalAnswers = { ...answers };
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
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
            } else {
                alert(data.error || 'Greška pri slanju feedbacka.');
            }
        } catch (err) {
            console.error('Feedback error:', err);
            alert('Došlo je do greške.');
        } finally {
            setSubmitting(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" data-dashboard="true" style={{ background: 'var(--db-bg)' }}>
                <TabLoader message="Učitavanje feedback forme..." />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" data-dashboard="true" style={{ background: 'var(--db-bg)' }}>
                <div className="text-center db-fade-in max-w-md">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle size={32} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--db-heading)' }}>Hvala na feedbacku! 🎉</h2>
                    <p className="mb-6" style={{ color: 'var(--db-text-muted)' }}>
                        Vaše mišljenje nam je iznimno važno i koristit ćemo ga za poboljšanje platforme.
                    </p>
                    <Link
                        href="/dashboard"
                        className="font-semibold text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all hover:scale-105"
                        style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                    >
                        <ArrowLeft size={15} /> Natrag na Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" data-dashboard="true" style={{ background: 'var(--db-bg)' }}>
            {/* Header */}
            <div className="sticky top-0 z-30 px-4 py-3.5" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--db-border)' }}>
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--db-text-muted)' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold" style={{ color: 'var(--db-heading)' }}>Feedback</h1>
                        <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Pomozite nam poboljšati Webica AI</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl mx-auto px-4 py-8 db-fade-in">
                {/* Intro */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={24} style={{ color: 'var(--db-text-secondary)' }} />
                    </div>
                    <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--db-heading)' }}>Vaše mišljenje nam je važno</h2>
                    <p className="text-sm" style={{ color: 'var(--db-text-muted)' }}>
                        Odgovorite na nekoliko pitanja kako bismo mogli poboljšati vašu Webica AI platformu. Traje oko 2 minute.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {QUESTIONS.map((q, idx) => (
                        <div
                            key={q.id}
                            className="rounded-2xl p-5"
                            style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: 'var(--db-surface)', color: 'var(--db-text-muted)' }}>
                                    {idx + 1}
                                </span>
                                <label className="text-sm font-semibold leading-snug" style={{ color: 'var(--db-heading)' }}>
                                    {q.label}
                                </label>
                            </div>

                            <div className="ml-8">
                                {q.type === 'rating' && (
                                    <StarRating value={answers[q.id] || 0} onChange={(v) => setAnswer(q.id, v)} />
                                )}
                                {q.type === 'nps' && (
                                    <NPSRating value={answers[q.id] ?? -1} onChange={(v) => setAnswer(q.id, v)} />
                                )}
                                {q.type === 'select' && (
                                    <SelectWithOther
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
                                        rows={4}
                                        className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                        style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--db-border)' }}>
                        <Link href="/dashboard" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--db-text-muted)' }}>
                            Preskoči
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="font-semibold text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-50 hover:scale-105 flex items-center gap-2"
                            style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                        >
                            {submitting ? (
                                <><ButtonLoader size={14} /> Šaljem...</>
                            ) : (
                                <><Send size={15} /> Pošalji feedback</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
