"use client";

import { useState } from 'react';
import { Coins, Check, Loader2, ArrowLeft } from 'lucide-react';
import { TOKEN_PACKAGES } from '@/lib/constants';
import { createTokenCheckoutSession } from '@/app/actions/token-purchase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TokenPurchasePage({ project, userTokens = 0 }) {
    const [loading, setLoading] = useState(null);
    const router = useRouter();

    const handlePurchase = async (packageId) => {
        setLoading(packageId);
        try {
            const result = await createTokenCheckoutSession(project.id, packageId);
            if (result.url) { window.location.href = result.url; }
            else { alert(result.error || 'Greška pri kupnji tokena'); setLoading(null); }
        } catch (error) { console.error(error); alert('Došlo je do greške'); setLoading(null); }
    };

    return (
        <div className="min-h-[calc(100vh-56px)] p-4 sm:p-6 md:p-8" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
            <div className="max-w-5xl mx-auto db-fade-in">
                {/* Back button */}
                <Link href={`/dashboard/projects/${project.id}/editor`}
                    className="inline-flex items-center gap-2 text-xs font-medium transition-colors mb-6"
                    style={{ color: 'var(--lp-text-muted)' }}>
                    <ArrowLeft size={14} /> Natrag na Editor
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2.5 mb-3">
                        <Coins size={28} className="text-yellow-500" />
                        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--lp-heading)' }}>Kupi Editor Tokene</h1>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>
                        Nadopunite tokene za Webica AI uređivanje web stranice
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                        <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Trenutno imate:</span>
                        <span className="font-mono font-bold text-yellow-500 text-sm">{userTokens} tokena</span>
                    </div>
                </div>

                {/* Token Packages */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {TOKEN_PACKAGES.map((pkg) => (
                        <div key={pkg.id} className={`relative db-card p-5 transition-all hover:scale-[1.02] ${pkg.popular ? 'ring-1 ring-emerald-500/30' : ''}`}>
                            {pkg.popular && (
                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                                    style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                                    NAJPOPULARNIJE
                                </div>
                            )}
                            {pkg.savings && (
                                <div className="absolute -top-2.5 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {pkg.savings} UŠTEDA
                                </div>
                            )}

                            <div className="text-center mb-4 pt-1">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Coins size={18} className="text-yellow-500" />
                                    <h3 className="text-lg font-bold" style={{ color: 'var(--lp-heading)' }}>{pkg.name}</h3>
                                </div>
                                <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{pkg.description}</p>
                            </div>

                            <div className="text-center mb-4">
                                <div className="text-3xl font-bold text-emerald-400 mb-0.5">€{pkg.price}</div>
                                <div className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>
                                    €{(pkg.price / pkg.tokens * 100).toFixed(2)} po 100 tokena
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                {[`${pkg.tokens} tokena`, 'Bez isteka', 'Instant dostava'].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--lp-text-secondary)' }}>
                                        <Check size={13} className="text-emerald-400 flex-shrink-0" /> {feat}
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => handlePurchase(pkg.id)} disabled={loading !== null}
                                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105"
                                style={pkg.popular
                                    ? { background: 'var(--lp-heading)', color: 'var(--lp-bg)' }
                                    : { background: 'var(--lp-surface)', color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }
                                }>
                                {loading === pkg.id ? (<><Loader2 className="animate-spin" size={16} /> Preusmjeravanje...</>) : 'Kupi Sada'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Info Section */}
                <div className="db-card p-5">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--lp-heading)' }}>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Kako funkcioniraju tokeni?
                    </h3>
                    <ul className="space-y-1.5 text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                        {[
                            ['Svaka Webica AI izmjena troši', '50 tokena'],
                            ['Uređivanje podataka u „Sadržaj" tabu', 'ne troši tokene'],
                            ['Svaki novi projekt dobiva', '500 besplatnih tokena'],
                            ['Tokeni ne istječu', 'i mogu se koristiti bilo kada'],
                            ['Sigurna naplata putem', 'Stripe platforme'],
                        ].map(([text, bold], i) => (
                            <li key={i} className="flex gap-2">
                                <span className="text-emerald-400 flex-shrink-0">•</span>
                                <span>{text} <strong style={{ color: 'var(--lp-heading)' }}>{bold}</strong></span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
