'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, Clock, CheckCircle, Circle, Inbox, Megaphone, Calculator, UserCheck, Rocket, TrendingUp, MousePointerClick, Users, ChevronRight, Sparkles, Copy, Check, Loader2, CreditCard, ShieldCheck, Star, MapPin, Gift, Camera } from 'lucide-react';
import { confirmGoogleAdsCampaign } from '@/app/actions/google-ads-generator';

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Upravo';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} d`;
    return new Date(dateStr).toLocaleDateString('hr-HR');
}

// ─── Revenue slider steps (non-linear) ────────────────────────────────
// +1 → 1-5, +5 → 5-50, +10 → 50-100, +50 → 100-500, +100 → 500-1000, +500 → 1000-10000
const REVENUE_STEPS = (() => {
    const v = [];
    for (let i = 1; i <= 5; i += 1) v.push(i);
    for (let i = 10; i <= 50; i += 5) v.push(i);
    for (let i = 60; i <= 100; i += 10) v.push(i);
    for (let i = 150; i <= 500; i += 50) v.push(i);
    for (let i = 600; i <= 1000; i += 100) v.push(i);
    for (let i = 1500; i <= 10000; i += 500) v.push(i);
    return v;
})();
const REVENUE_DEFAULT_IDX = REVENUE_STEPS.indexOf(500); // 500€ default

// ─── ROI Calculator ───────────────────────────────────────────────────
function ROICalculator() {
    const [revenueIdx, setRevenueIdx] = useState(REVENUE_DEFAULT_IDX);
    const [budget, setBudget] = useState(200);

    const revenue = REVENUE_STEPS[revenueIdx];

    // Realistic estimates for local businesses
    const avgCPC = 0.35; // Average CPC for local services in Croatia (EUR)
    const clickRate = budget / avgCPC;
    const conversionRate = 0.08; // 8% conversion for local services
    const leads = Math.round(clickRate * conversionRate);
    const projectedRevenue = leads * revenue;
    const roi = budget > 0 ? Math.round(((projectedRevenue - budget) / budget) * 100) : 0;

    return (
        <div className="relative overflow-hidden rounded-2xl p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.5), rgba(16,185,129,0.5))' }}>
            <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--db-bg-alt)' }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center border border-violet-500/20">
                        <Calculator size={20} className="text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>ROI Kalkulator</h3>
                        <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Procijeni povrat ulaganja u Google Ads</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>
                                Prosječna zarada po klijentu
                            </label>
                            <span className="text-lg font-bold text-emerald-400">{revenue.toLocaleString('hr-HR')}€</span>
                        </div>
                        <div className="relative pt-1">
                            <input
                                type="range"
                                value={revenueIdx}
                                onChange={e => setRevenueIdx(parseInt(e.target.value))}
                                min="0"
                                max={REVENUE_STEPS.length - 1}
                                step="1"
                                className="roi-slider roi-slider--green"
                                style={{ '--slider-progress': `${(revenueIdx / (REVENUE_STEPS.length - 1)) * 100}%` }}
                            />
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>1€</span>
                                <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>10.000€</span>
                            </div>
                        </div>
                    </div>

                    {/* Budget Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium" style={{ color: 'var(--db-text-secondary)' }}>
                                Mjesečni budžet za oglase
                            </label>
                            <span className="text-lg font-bold text-blue-400">{budget}€</span>
                        </div>
                        <div className="relative pt-1">
                            <input
                                type="range"
                                value={budget}
                                onChange={e => setBudget(parseInt(e.target.value))}
                                min="50"
                                max="2000"
                                step="25"
                                className="roi-slider roi-slider--blue"
                                style={{ '--slider-progress': `${((budget - 50) / (2000 - 50)) * 100}%` }}
                            />
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>50€</span>
                                <span className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>2.000€</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <MousePointerClick size={20} className="text-violet-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-violet-400">{Math.round(clickRate)}</div>
                        <div className="text-[11px] mt-1" style={{ color: 'var(--db-text-muted)' }}>Procjena klikova/mj.</div>
                    </div>
                    <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <Users size={20} className="text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-400">{leads}</div>
                        <div className="text-[11px] mt-1" style={{ color: 'var(--db-text-muted)' }}>Procjena leadova/mj.</div>
                    </div>
                    <div className="rounded-xl p-4 text-center" style={{ background: roi > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: roi > 0 ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)' }}>
                        <TrendingUp size={20} className={roi > 0 ? 'text-emerald-400 mx-auto mb-2' : 'text-red-400 mx-auto mb-2'} />
                        <div className={`text-2xl font-bold ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{roi}%</div>
                        <div className="text-[11px] mt-1" style={{ color: 'var(--db-text-muted)' }}>Projekcirani ROI</div>
                    </div>
                </div>

                <p className="text-[11px] mt-4 text-center" style={{ color: 'var(--db-text-muted)' }}>
                    * Procjena se temelji na prosječnom CPC-u od {avgCPC.toFixed(2)}€ i stopi konverzije od {(conversionRate * 100).toFixed(0)}% za lokalne usluge u Hrvatskoj.
                </p>
            </div>
        </div>
    );
}

// ─── Agent Card ───────────────────────────────────────────────────────
function AgentCard() {
    return (
        <div className="relative overflow-hidden rounded-2xl p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.4))' }}>
            <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--db-bg-alt)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center border border-blue-500/20">
                        <UserCheck size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>Upoznaj svog agenta</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <img
                            src="https://e0rdnm7yvj57qqp1.public.blob.vercel-storage.com/media/vv3Cm0Rx38s6NZT8QoFlmWDZcu3kSb4m/1772692721175-isamii.png"
                            alt="Jurica - Google Ads Specialist"
                            className="w-28 h-28 rounded-2xl object-cover shadow-lg shadow-violet-500/20"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-base font-bold" style={{ color: 'var(--db-heading)' }}>Jurica</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                Google Ads Specialist
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--db-text-secondary)' }}>
                            Bok! Ja sam Jurica i osobno ću složiti i nadgledati tvoju Google Ads kampanju kako bih osigurao da tvoj budžet donosi stvarne klijente. Ovo je područje u kojemu sam (za sada) još uvijek bolji od AI-a. Koristeći svoje znanje, iskustvo i vještine kreirat ću i optimizirati kampanju koja će ti dovesti klijente ili kupce na tvoju novu web stranicu.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Unlock Steps ─────────────────────────────────────────────────────
function UnlockSteps() {
    const steps = [
        {
            num: 1,
            title: 'Dodaj administratora',
            description: (
                <>
                    Dodaj <CopyableEmail email="webica.hr@gmail.com" /> kao administratora u svoj Google Ads račun.
                    To omogućuje našem timu pristup za upravljanje kampanjom.
                </>
            ),
        },
        {
            num: 2,
            title: 'Unesi podatke za plaćanje',
            description: 'Unesi podatke za plaćanje (karticu) u svoj Google Ads račun kako bi Google mogao naplaćivati klikove. Bez toga kampanja ne može biti aktivna.',
        },
    ];

    return (
        <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Rocket size={20} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>Kako pokrenuti kampanju</h3>
                    <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Dva jednostavna koraka prije aktivacije</p>
                </div>
            </div>

            <div className="space-y-4">
                {steps.map(step => (
                    <div key={step.num} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                            {step.num}
                        </div>
                        <div className="flex-1 pt-0.5">
                            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--db-heading)' }}>{step.title}</h4>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--db-text-secondary)' }}>
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Boost Tips (shown when campaign is ACTIVE) ──────────────────────
function BoostTips({ projectId }) {
    const router = useRouter();
    const editorUrl = `/dashboard/projects/${projectId}/editor`;
    const [showGMBGuide, setShowGMBGuide] = useState(false);

    // Persist completed cards in localStorage per project
    const storageKey = `boost-tips-${projectId}`;
    const [completed, setCompleted] = useState(() => {
        if (typeof window === 'undefined') return {};
        try {
            return JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch { return {}; }
    });

    function toggleCompleted(idx) {
        setCompleted(prev => {
            const next = { ...prev, [idx]: !prev[idx] };
            localStorage.setItem(storageKey, JSON.stringify(next));
            return next;
        });
    }

    const cards = [
        {
            id: 'reviews',
            icon: Star,
            gradient: 'from-amber-500/20 to-yellow-500/20',
            border: 'border-amber-500/20',
            iconColor: 'text-amber-400',
            doneGradient: 'from-amber-500 to-yellow-500',
            title: 'Ljudi kupuju od onih kojima vjeruju',
            text: 'Dodavanje recenzija povećava broj upita za čak 34%. Neka vaši zadovoljni klijenti prodaju umjesto vas.',
            btn: 'Dodaj recenzije u AI Editoru',
            action: () => router.push(editorUrl),
        },
        {
            id: 'gmb',
            icon: MapPin,
            gradient: 'from-rose-500/20 to-pink-500/20',
            border: 'border-rose-500/20',
            iconColor: 'text-rose-400',
            doneGradient: 'from-rose-500 to-pink-500',
            title: 'Lokalna dominacija',
            text: 'Povežite svoju novu web stranicu s besplatnim Google My Business profilom. 70% lokalnih pretraga završava na kartama.',
            btn: 'Pročitaj upute',
            action: () => setShowGMBGuide(true),
        },
        {
            id: 'cro',
            icon: Gift,
            gradient: 'from-emerald-500/20 to-teal-500/20',
            border: 'border-emerald-500/20',
            iconColor: 'text-emerald-400',
            doneGradient: 'from-emerald-500 to-teal-500',
            title: 'Pretvorite posjetitelje u kupce',
            text: 'Ponudite 10% popusta ili besplatnu procjenu na samom vrhu stranice. Jasna ponuda je ključ uspješnih oglasa.',
            btn: 'Uredi tekst vizualno',
            action: () => router.push(editorUrl),
        },
        {
            id: 'images',
            icon: Camera,
            gradient: 'from-sky-500/20 to-blue-500/20',
            border: 'border-sky-500/20',
            iconColor: 'text-sky-400',
            doneGradient: 'from-sky-500 to-blue-500',
            title: 'Pokažite svoje prave radove',
            text: 'Posjetitelji najviše vjeruju autentičnim fotografijama. Zamijenite AI slike fotografijama svojih stvarnih projekata ili tima.',
            btn: 'Ažuriraj slike',
            action: () => router.push(editorUrl),
        },
    ];

    const completedCount = cards.filter((_, i) => completed[i]).length;
    const progress = Math.round((completedCount / cards.length) * 100);
    const progressLabel = progress === 0 ? 'Tek počinjete' : progress < 50 ? 'Dobar početak!' : progress < 100 ? 'Skoro ste tamo!' : 'Potpuno optimizirano! 🎉';

    const gmbSteps = [
        {
            num: 1,
            title: 'Kreirajte Google račun (ako nemate)',
            desc: 'Posjetite google.com i kreirajte besplatni Google račun ili koristite postojeći.',
        },
        {
            num: 2,
            title: 'Otvorite Google Business Profile',
            desc: 'Idite na business.google.com i kliknite "Manage now" za početak postavljanja.',
            link: 'https://business.google.com/',
        },
        {
            num: 3,
            title: 'Unesite naziv tvrtke',
            desc: 'Upišite točan naziv svoje tvrtke kako ga klijenti poznaju.',
        },
        {
            num: 4,
            title: 'Odaberite kategoriju djelatnosti',
            desc: 'Odaberite kategoriju koja najbolje opisuje vaše poslovanje (npr. "Stolar", "Frizer", "Restoran").',
        },
        {
            num: 5,
            title: 'Dodajte lokaciju i kontakt',
            desc: 'Unesite adresu, broj telefona i radno vrijeme. Dodajte i link na svoju novu web stranicu.',
        },
        {
            num: 6,
            title: 'Verificirajte profil',
            desc: 'Google će poslati razglednicu s kodom na vašu adresu. Unesite kod za aktivaciju profila (traje 5-14 dana).',
        },
        {
            num: 7,
            title: 'Dodajte fotografije i opis',
            desc: 'Upload-ajte kvalitetne fotografije svog posla, tima i radova. Napišite detaljan opis usluga.',
        },
    ];

    return (
        <div>
            {/* ── Progress Bar ── */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>
                            Optimizacija stranice {progress === 100 && '🎉'}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--db-text-muted)' }}>{progressLabel}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold" style={{ color: progress === 100 ? '#10b981' : 'var(--db-accent, #a78bfa)' }}>{progress}%</span>
                        <p className="text-[10px]" style={{ color: 'var(--db-text-muted)' }}>{completedCount}/{cards.length} koraka</p>
                    </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progress}%`,
                            background: progress === 100
                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                : 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                        }}
                    />
                </div>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--db-text-secondary)' }}>
                Evo kako dobiti još više upita:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card, i) => {
                    const done = !!completed[i];
                    return (
                        <div
                            key={card.id}
                            className={`rounded-2xl p-5 flex flex-col gap-4 transition-all ${done ? 'opacity-75' : 'hover:scale-[1.01]'}`}
                            style={{ background: 'var(--db-bg-alt)', border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : 'var(--db-border)'}` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${done ? 'from-emerald-500/20 to-emerald-500/20 border-emerald-500/20' : card.gradient + ' ' + card.border} flex items-center justify-center border`}>
                                    {done
                                        ? <CheckCircle size={20} className="text-emerald-400" />
                                        : <card.icon size={20} className={card.iconColor} />
                                    }
                                </div>
                                <h4 className={`text-sm font-bold flex-1 ${done ? 'line-through' : ''}`} style={{ color: 'var(--db-heading)', textDecorationColor: 'var(--db-text-muted)' }}>{card.title}</h4>
                            </div>
                            <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--db-text-secondary)' }}>
                                {card.text}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={card.action}
                                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                                    style={{
                                        background: 'rgba(139,92,246,0.1)',
                                        border: '1px solid rgba(139,92,246,0.2)',
                                        color: 'var(--db-accent, #a78bfa)',
                                    }}
                                >
                                    {card.btn}
                                    <ChevronRight size={14} />
                                </button>
                                <button
                                    onClick={() => toggleCompleted(i)}
                                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-[0.92]"
                                    style={{
                                        background: done ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.06)',
                                        border: done ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--db-border)',
                                    }}
                                    title={done ? 'Označi kao nedovršeno' : 'Označi kao dovršeno'}
                                >
                                    {done
                                        ? <CheckCircle size={18} className="text-emerald-400" />
                                        : <Circle size={18} style={{ color: 'var(--db-text-muted)' }} />
                                    }
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Google My Business Guide Modal ── */}
            {showGMBGuide && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowGMBGuide(false)}
                >
                    <div
                        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6 md:p-8"
                        style={{ background: 'var(--db-bg-alt)', border: '1px solid var(--db-border)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setShowGMBGuide(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer"
                            style={{ color: 'var(--db-text-muted)' }}
                        >
                            <span className="sr-only">Zatvori</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/20">
                                <MapPin size={20} className="text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>
                                    Google My Business upute
                                </h3>
                                <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>
                                    Besplatno — 15 minuta posla
                                </p>
                            </div>
                        </div>

                        {/* Why */}
                        <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--db-text-secondary)' }}>
                                <strong style={{ color: 'var(--db-heading)' }}>Zašto je ovo važno?</strong><br />
                                Google My Business (GMB) profil pomaže vašoj tvrtki da se pojavi na Google Maps-u i u lokalnim rezultatima pretrage.
                                To je potpuno besplatno i može donijeti značajan dio novih klijenata.
                            </p>
                        </div>

                        {/* Steps */}
                        <div className="space-y-4">
                            {gmbSteps.map(step => (
                                <div key={step.num} className="flex gap-3 items-start">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                                        {step.num}
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--db-heading)' }}>{step.title}</h4>
                                        <p className="text-xs leading-relaxed" style={{ color: 'var(--db-text-secondary)' }}>{step.desc}</p>
                                        {step.link && (
                                            <a
                                                href={step.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
                                            >
                                                Otvori stranicu <ChevronRight size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <a
                            href="https://business.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 w-full py-3 px-6 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                            style={{ background: 'linear-gradient(135deg, #e11d48, #db2777)', boxShadow: '0 6px 24px rgba(225,29,72,0.25)' }}
                        >
                            <MapPin size={16} />
                            Pokreni Google My Business
                            <ChevronRight size={16} />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Small helper: Copyable Email ─────────────────────────────────────
function CopyableEmail({ email }) {
    const [copied, setCopied] = useState(false);

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(email);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-violet-400 hover:text-violet-300 transition-colors font-mono text-xs"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
            title="Klikni za kopiranje"
        >
            {email}
            {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
    );
}

// ─── Campaign Status Banner ───────────────────────────────────────────
function CampaignStatus({ status }) {
    const configs = {
        PENDING: {
            bg: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.2)',
            icon: <Clock size={18} className="text-yellow-400" />,
            title: 'Čeka se potvrda',
            desc: 'Odradite korake ispod i kliknite "Potvrđujem" za pokretanje AI generiranja oglasnih materijala.',
            color: 'text-yellow-400',
        },
        AWAITING_ADMIN: {
            bg: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            icon: <Clock size={18} className="text-blue-400" />,
            title: 'Čeka se aktivacija',
            desc: 'Vaši oglasni materijali su generirani. Naš tim će uskoro postaviti i aktivirati vašu kampanju.',
            color: 'text-blue-400',
        },
        ACTIVE: {
            bg: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            icon: <CheckCircle size={18} className="text-emerald-400" />,
            title: 'Kampanja je aktivna!',
            desc: 'Vaša Google Ads kampanja je postavljena i aktivna. Jurica nadgleda performanse.',
            color: 'text-emerald-400',
        },
    };

    const cfg = configs[status] || configs.PENDING;

    return (
        <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: cfg.bg, border: cfg.border }}>
            <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
            <div>
                <h4 className={`font-semibold text-sm ${cfg.color}`}>{cfg.title}</h4>
                <p className="text-xs mt-1" style={{ color: 'var(--db-text-secondary)' }}>{cfg.desc}</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function InquiriesPage() {
    const { id: projectId } = useParams();

    // ── Contact Submissions State ──
    const [submissions, setSubmissions] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expanded, setExpanded] = useState(null);

    // ── Google Ads State ──
    const [campaign, setCampaign] = useState(null);
    const [adsLoading, setAdsLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [adsError, setAdsError] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Derived: has the user paid for Google Ads Boost?
    const hasPaid = !!campaign?.stripeSubscriptionId;

    // ── Fetch Contact Submissions ──
    const fetchSubmissions = useCallback(async () => {
        const res = await fetch(`/api/site/${projectId}/contact?unread=${filter === 'unread'}`);
        if (res.ok) {
            const data = await res.json();
            setSubmissions(data.submissions);
            setUnreadCount(data.unreadCount);
        }
        setLoading(false);
    }, [projectId, filter]);

    // ── Fetch Google Ads Campaign ──
    const fetchCampaign = useCallback(async () => {
        try {
            const res = await fetch(`/api/google-ads/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setCampaign(data.campaign);
            }
        } catch (err) {
            console.error('Failed to fetch campaign:', err);
        }
        setAdsLoading(false);
    }, [projectId]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);
    useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

    // ── Contact Actions ──
    async function markRead(submissionId, read) {
        await fetch(`/api/site/${projectId}/contact/${submissionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read }),
        });
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, read } : s));
        setUnreadCount(prev => read ? Math.max(0, prev - 1) : prev + 1);
    }

    function toggleExpand(id, submission) {
        setExpanded(expanded === id ? null : id);
        if (!submission.read) markRead(id, true);
    }

    // ── Google Ads Payment ──
    async function handleStartPayment() {
        setPaymentLoading(true);
        setAdsError(null);
        try {
            const res = await fetch('/api/google-ads-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setAdsError(data.error || 'Greška pri pokretanju plaćanja.');
            }
        } catch (err) {
            setAdsError('Greška pri pokretanju plaćanja. Pokušajte ponovno.');
        }
        setPaymentLoading(false);
    }

    // ── Google Ads Confirm ──
    async function handleConfirmCampaign() {
        setConfirming(true);
        setAdsError(null);

        const result = await confirmGoogleAdsCampaign(projectId);

        if (result.error) {
            setAdsError(result.error);
            setConfirming(false);
        } else {
            // Re-fetch campaign data
            await fetchCampaign();
            setConfirming(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-12">

            {/* ════════════════════════════════════════════════════════════
                 SECTION 1: Contact Form Submissions
                 ════════════════════════════════════════════════════════ */}
            <section>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Inbox size={20} className="text-violet-400" />
                            Upiti s kontakt forme
                        </h1>
                        <p className="text-[color:var(--db-text-muted)] text-sm mt-1">
                            {unreadCount > 0 ? (
                                <span className="text-violet-400 font-medium">{unreadCount} nepročitanih</span>
                            ) : (
                                'Sve pročitano'
                            )}
                        </p>
                    </div>
                    {/* Filter pills */}
                    <div className="flex gap-2">
                        {['all', 'unread'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f
                                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                    : 'text-[color:var(--db-text-muted)] hover:text-[color:var(--db-text-secondary)] border border-transparent'
                                    }`}
                            >
                                {f === 'all' ? 'Svi' : 'Nepročitani'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contact Submissions List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-[color:var(--db-surface)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-16">
                        <Inbox size={40} className="text-zinc-700 mx-auto mb-4" />
                        <p className="text-[color:var(--db-text-muted)] font-medium">
                            {filter === 'unread' ? 'Nema nepročitanih upita' : 'Još nema upita'}
                        </p>
                        <p className="text-[color:var(--db-text-muted)] text-sm mt-1">
                            Upiti s kontakt forme na vašoj web stranici prikazuju se ovdje.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {submissions.map(s => (
                            <div
                                key={s.id}
                                className={`rounded-xl border transition-all cursor-pointer ${s.read
                                    ? 'bg-zinc-900/40 border-[color:var(--db-border)] hover:border-[color:var(--db-border)]'
                                    : 'bg-[color:var(--db-surface)] border-[color:var(--db-border)] shadow-lg shadow-violet-500/5'
                                    }`}
                            >
                                {/* Row */}
                                <div
                                    className="flex items-center gap-4 p-4"
                                    onClick={() => toggleExpand(s.id, s)}
                                >
                                    {/* Read indicator */}
                                    <button
                                        onClick={e => { e.stopPropagation(); markRead(s.id, !s.read); }}
                                        className="flex-shrink-0"
                                        title={s.read ? 'Označi kao nepročitano' : 'Označi kao pročitano'}
                                    >
                                        {s.read
                                            ? <CheckCircle size={18} className="text-[color:var(--db-text-muted)] hover:text-[color:var(--db-text-muted)] transition-colors" />
                                            : <Circle size={18} className="text-violet-400 fill-violet-400/20" />
                                        }
                                    </button>

                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${s.read ? 'bg-[color:var(--db-surface)] text-[color:var(--db-text-muted)]' : 'bg-violet-500/20 text-violet-400'}`}>
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold text-sm ${s.read ? 'text-[color:var(--db-text-muted)]' : 'text-white'}`}>
                                                {s.name}
                                            </span>
                                            {!s.read && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[color:var(--db-text-muted)] text-xs mt-0.5 truncate">{s.message}</p>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-xs text-[color:var(--db-text-muted)] flex items-center gap-1">
                                            <Clock size={11} />
                                            {timeAgo(s.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded */}
                                {expanded === s.id && (
                                    <div className="px-4 pb-4 pt-0 border-t border-[color:var(--db-border)] mt-0 space-y-3">
                                        <div className="flex flex-wrap gap-3 pt-3">
                                            <a
                                                href={`mailto:${s.email}`}
                                                className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                                            >
                                                <Mail size={13} />
                                                {s.email}
                                            </a>
                                            {s.phone && (
                                                <a
                                                    href={`tel:${s.phone}`}
                                                    className="flex items-center gap-1.5 text-sm text-[color:var(--db-text-muted)] hover:text-[color:var(--db-text-secondary)] transition-colors"
                                                >
                                                    <Phone size={13} />
                                                    {s.phone}
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-[color:var(--db-text-secondary)] text-sm leading-relaxed whitespace-pre-wrap bg-[color:var(--db-surface)] rounded-lg p-3">
                                            {s.message}
                                        </p>
                                        <div className="flex gap-2 pt-1">
                                            <a
                                                href={`mailto:${s.email}?subject=Odgovor na vaš upit`}
                                                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium text-white transition-colors"
                                            >
                                                Odgovori emailom
                                            </a>
                                            <span className="text-xs text-[color:var(--db-text-muted)] flex items-center">
                                                {new Date(s.createdAt).toLocaleString('hr-HR')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ════════════════════════════════════════════════════════════
                 SECTION 2: Google Ads Boost
                 ════════════════════════════════════════════════════════ */}
            <section>
                {/* Section Divider */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-px flex-1" style={{ background: 'var(--db-border)' }} />
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--db-heading)' }}>
                        <Megaphone size={16} className="text-violet-400" />
                        Google Ads Boost
                    </div>
                    <div className="h-px flex-1" style={{ background: 'var(--db-border)' }} />
                </div>

                {/* Campaign Status (if exists) */}
                {!adsLoading && campaign && (
                    <div className="mb-6">
                        <CampaignStatus status={campaign.status} />
                    </div>
                )}

                {/* Only show setup UI if no active campaign */}
                {!adsLoading && (!campaign || campaign.status === 'PENDING') && (
                    <div className="space-y-6">
                        {/* ROI Calculator */}
                        <ROICalculator />

                        {/* Agent Card */}
                        <AgentCard />

                        {/* STEP 0: Payment */}
                        <div className="relative overflow-hidden rounded-2xl p-[1px]" style={{ background: hasPaid ? 'linear-gradient(135deg, rgba(16,185,129,0.5), rgba(59,130,246,0.5))' : 'linear-gradient(135deg, rgba(234,179,8,0.5), rgba(249,115,22,0.5))' }}>
                            <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--db-bg-alt)' }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${hasPaid ? 'bg-emerald-500/20 border-emerald-500/20' : 'bg-amber-500/20 border-amber-500/20'}`}>
                                        {hasPaid ? <ShieldCheck size={20} className="text-emerald-400" /> : <CreditCard size={20} className="text-amber-400" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>
                                            {hasPaid ? 'Pretplata aktivna' : 'Aktiviraj Google Ads Boost'}
                                        </h3>
                                        <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>
                                            {hasPaid ? 'Tvoja mjesečna pretplata za Google Ads upravljanje je aktivna.' : 'Mjesečna pretplata za profesionalno upravljanje kampanjom'}
                                        </p>
                                    </div>
                                </div>

                                {!hasPaid ? (
                                    <div>
                                        <div className="flex items-end gap-2 mb-4">
                                            <span className="text-4xl font-bold" style={{ color: 'var(--db-heading)' }}>50€</span>
                                            <span className="text-sm mb-1" style={{ color: 'var(--db-text-muted)' }}>/mjesečno</span>
                                        </div>
                                        <ul className="space-y-2 mb-6">
                                            {[
                                                'Profesionalno postavljanje Google Ads kampanje',
                                                'AI-generirani oglasni materijali (headlines, opisi, ključne riječi)',
                                                'Kontinuirana optimizacija od strane našeg stručnjaka',
                                                'Mjesečni izvještaj o performansama',
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--db-text-secondary)' }}>
                                                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={handleStartPayment}
                                            disabled={paymentLoading}
                                            className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                                            style={{
                                                background: paymentLoading ? 'rgba(234,179,8,0.3)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                                                boxShadow: paymentLoading ? 'none' : '0 6px 24px rgba(234,179,8,0.25)',
                                            }}
                                        >
                                            {paymentLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Preusmjeravanje na plaćanje...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CreditCard size={16} />
                                                    Pretplati se — 50€/mj.
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <CheckCircle size={16} className="text-emerald-400" />
                                        <span className="text-sm font-medium text-emerald-400">Plaćanje verificirano — možeš nastaviti s koracima ispod.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Unlock Steps (only show after payment) */}
                        {hasPaid && <UnlockSteps />}

                        {/* Error Message */}
                        {adsError && (
                            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <span className="text-red-400 text-sm">{adsError}</span>
                            </div>
                        )}

                        {/* Confirmation Button (only after payment) */}
                        {hasPaid && (
                            <>
                                <button
                                    onClick={handleConfirmCampaign}
                                    disabled={confirming}
                                    className="w-full group relative overflow-hidden rounded-2xl py-4 px-6 text-base font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                                    style={{
                                        background: confirming ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                        boxShadow: confirming ? 'none' : '0 8px 32px rgba(139,92,246,0.3)',
                                    }}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {confirming ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                AI generira oglasne materijale...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={20} />
                                                Potvrđujem — Pokreni moju kampanju!
                                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>

                                <p className="text-center text-[11px]" style={{ color: 'var(--db-text-muted)' }}>
                                    Klikom na gumb pokrećeš AI generiranje oglasnih materijala. Naš tim će ih potom pregledati i aktivirati kampanju.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Show status for existing campaigns */}
                {!adsLoading && campaign && campaign.status !== 'PENDING' && (
                    <div className="space-y-6">
                        {campaign.status === 'ACTIVE' ? <BoostTips projectId={projectId} /> : <ROICalculator />}
                        <AgentCard />
                    </div>
                )}

                {/* Loading skeleton for ads section */}
                {adsLoading && (
                    <div className="space-y-4">
                        <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--db-surface)' }} />
                        <div className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--db-surface)' }} />
                    </div>
                )}
            </section>
        </div>
    );
}
