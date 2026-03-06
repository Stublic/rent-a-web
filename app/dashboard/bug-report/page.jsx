"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Bug, Send, CheckCircle, ImagePlus, Trash2, PartyPopper, Coins, MapPin, AlertTriangle, Circle } from "lucide-react";
import Link from "next/link";
import { ButtonLoader, TabLoader } from "../components/DashboardLoader";
import { usePathname } from "next/navigation";

const SEVERITY_OPTIONS = [
    { value: 'low', label: 'Nizak', color: '#3b82f6' },
    { value: 'medium', label: 'Srednji', color: '#f59e0b' },
    { value: 'high', label: 'Visok', color: '#f97316' },
    { value: 'critical', label: 'Kritičan', color: '#ef4444' },
];

export default function BugReportPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('medium');
    const [screenshot, setScreenshot] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [tokensAwarded, setTokensAwarded] = useState(0);
    const [error, setError] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const fileInputRef = useRef(null);
    const pathname = usePathname();

    useEffect(() => {
        const timer = setTimeout(() => setPageLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleScreenshot = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('Slika mora biti manja od 10MB'); return; }
        setScreenshot(file);
        const reader = new FileReader();
        reader.onload = (ev) => setScreenshotPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const removeScreenshot = () => {
        setScreenshot(null);
        setScreenshotPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;
        setSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('severity', severity);
            formData.append('page', pathname);
            if (screenshot) formData.append('screenshot', screenshot);

            const res = await fetch('/api/bug-reports', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setTokensAwarded(data.tokensAwarded || 0);
                setSubmitted(true);
            } else {
                setError(data.error || 'Greška pri slanju bug reporta.');
            }
        } catch (err) {
            console.error('Bug report error:', err);
            setError('Došlo je do greške.');
        } finally {
            setSubmitting(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" data-dashboard="true" style={{ background: 'var(--db-bg)' }}>
                <TabLoader message="Učitavanje bug report forme..." />
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
                    <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: 'var(--db-heading)' }}>Hvala na prijavi! <PartyPopper size={24} className="text-emerald-400" /></h2>
                    <p className="mb-4" style={{ color: 'var(--db-text-muted)' }}>
                        Bug report je poslan. Naš tim će ga pregledati i raditi na rješenju.
                    </p>
                    {tokensAwarded > 0 && (
                        <div className="rounded-xl px-5 py-3.5 mb-6 inline-flex items-center gap-3 mx-auto" style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)' }}>
                            <Coins size={24} className="text-yellow-400" />
                            <div className="text-left">
                                <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>+{tokensAwarded} tokena!</p>
                                <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Nagrada za prijavu buga</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => { setSubmitted(false); setTitle(''); setDescription(''); setSeverity('medium'); removeScreenshot(); setTokensAwarded(0); setError(null); }}
                            className="font-semibold text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all hover:scale-105"
                            style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                        >
                            <Bug size={15} /> Prijavi još jedan bug
                        </button>
                        <Link
                            href="/dashboard"
                            className="font-semibold text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all hover:scale-105"
                            style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                        >
                            <ArrowLeft size={15} /> Natrag na Dashboard
                        </Link>
                    </div>
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
                        <h1 className="text-sm font-bold" style={{ color: 'var(--db-heading)' }}>Prijavi bug</h1>
                        <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Pomozite nam poboljšati platformu</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl mx-auto px-4 py-8 db-fade-in">
                {/* Intro */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <Bug size={24} style={{ color: 'var(--db-text-secondary)' }} />
                    </div>
                    <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--db-heading)' }}>Prijavite bug</h2>
                    <p className="text-sm" style={{ color: 'var(--db-text-muted)' }}>
                        Nešto ne radi kako treba? Opišite problem i pomozite nam poboljšati platformu. Za svaki bug report dobivate <strong style={{ color: '#fbbf24' }}>+50 tokena</strong>!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div className="rounded-2xl p-5" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}>
                        <div className="flex items-start gap-3 mb-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: 'var(--db-surface)', color: 'var(--db-text-muted)' }}>1</span>
                            <label className="text-sm font-semibold leading-snug" style={{ color: 'var(--db-heading)' }}>Naslov buga *</label>
                        </div>
                        <div className="ml-8">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="npr. Gumb za publish ne reagira na klik"
                                required
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="rounded-2xl p-5" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}>
                        <div className="flex items-start gap-3 mb-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: 'var(--db-surface)', color: 'var(--db-text-muted)' }}>2</span>
                            <label className="text-sm font-semibold leading-snug" style={{ color: 'var(--db-heading)' }}>Opis problema *</label>
                        </div>
                        <div className="ml-8">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Opišite što ste radili, što se dogodilo, i što ste očekivali da se dogodi..."
                                rows={5}
                                required
                                className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                                style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                            />
                        </div>
                    </div>

                    {/* Severity */}
                    <div className="rounded-2xl p-5" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}>
                        <div className="flex items-start gap-3 mb-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: 'var(--db-surface)', color: 'var(--db-text-muted)' }}>3</span>
                            <label className="text-sm font-semibold leading-snug" style={{ color: 'var(--db-heading)' }}>Ozbiljnost problema</label>
                        </div>
                        <div className="ml-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {SEVERITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setSeverity(opt.value)}
                                        className="py-2.5 rounded-xl text-sm font-medium transition-all text-center hover:scale-105"
                                        style={{
                                            background: severity === opt.value ? `${opt.color}20` : 'var(--db-bg)',
                                            border: `1px solid ${severity === opt.value ? opt.color : 'var(--db-border)'}`,
                                            color: severity === opt.value ? opt.color : 'var(--db-text-muted)',
                                        }}
                                    >
                                        <Circle size={12} fill={opt.color} stroke={opt.color} /> {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Screenshot */}
                    <div className="rounded-2xl p-5" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}>
                        <div className="flex items-start gap-3 mb-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: 'var(--db-surface)', color: 'var(--db-text-muted)' }}>4</span>
                            <label className="text-sm font-semibold leading-snug" style={{ color: 'var(--db-heading)' }}>Screenshot <span className="font-normal text-xs" style={{ color: 'var(--db-text-muted)' }}>(opcionalno)</span></label>
                        </div>
                        <div className="ml-8">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshot}
                                className="hidden"
                            />
                            {screenshotPreview ? (
                                <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--db-border)' }}>
                                    <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-60 object-contain" style={{ background: 'var(--db-bg)' }} />
                                    <button
                                        type="button"
                                        onClick={removeScreenshot}
                                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                        style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-6 rounded-xl text-sm font-medium flex flex-col items-center justify-center gap-2 transition-all hover:opacity-80"
                                    style={{ background: 'var(--db-bg)', border: '1px dashed var(--db-border)', color: 'var(--db-text-muted)' }}
                                >
                                    <ImagePlus size={24} />
                                    <span>Kliknite za dodavanje screenshota</span>
                                    <span className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Max 10MB • PNG, JPG, WebP</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Page info */}
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--db-border)', color: 'var(--db-text-muted)' }}>
                        <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Stranica: <span style={{ color: 'var(--db-text-secondary)' }}>{pathname}</span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {error}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--db-border)' }}>
                        <Link href="/dashboard" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--db-text-muted)' }}>
                            Odustani
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting || !title.trim() || !description.trim()}
                            className="font-semibold text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-50 hover:scale-105 flex items-center gap-2"
                            style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                        >
                            {submitting ? (
                                <><ButtonLoader size={14} /> Šaljem...</>
                            ) : (
                                <><Send size={15} /> Pošalji bug report</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
