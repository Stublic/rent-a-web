'use client';

import { useState } from 'react';
import { Check, Loader2, X, Sparkles, Zap, TrendingUp } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        subtitle: 'Prodajna landing stranica',
        price: '39',
        icon: Sparkles,
        features: [
            'AI generirana one-page (landing) stranica',
            'Kontakt forma i napredni SEO',
            '500 AI tokena za uređivanje',
            'Hosting na poddomeni',
            'Custom domena',
            'SSL & sigurnosne nadogradnje',
            'Prodajna struktura stranice (conversion flow)',
            'Stranica gotova u 45 sekundi, neograničen broj revizija',
        ],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
        description: 'Idealno za male obrte i lokalne usluge koji žele brzo biti online.',
        available: true,
    },
    {
        name: 'Advanced',
        subtitle: 'Ozbiljan biznis',
        price: '99',
        icon: Zap,
        features: [
            'Sve iz Starter paketa',
            'Kompleksna struktura (Naslovnica, Usluge, O nama, Kontakt)',
            'CMS za Blog (objave + kategorije + tagovi)',
            '10 AI članaka mjesečno (SEO friendly)',
            'Custom domena',
            'Napredne animacije & UX efekti',
            'Napredna AI SEO optimizacija',
            'Generiranje slika za web (Nano Banana)',
            'Pravni aspekti (GDPR, Uvjeti korištenja)',
        ],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED,
        description: 'Za tvrtke koje žele više: ozbiljniji web i SEO potencijal.',
        recommended: true,
        available: true,
    },
    {
        name: 'Web Shop Start',
        subtitle: 'Prodaja 0–24',
        price: '199',
        icon: TrendingUp,
        features: [
            'Katalog + košarica + checkout',
            'Upravljanje proizvodima i narudžbama',
            'Sve metode plaćanja',
            'AI SEO optimizacija i opis proizvoda',
            'Hosting + CMS + SSL',
            'Generiranje slika za web (Nano Banana)',
            'Integracija sa SOLO servisom (fiskalizacija)',
            'Pravni aspekti (GDPR, Uvjeti korištenja)',
        ],
        priceId: null,
        description: 'Online prodaja bez kompliciranog sustava plaćanja.',
        available: false,
        comingSoon: true,
    },
];

export default function PricingOverlay({ onClose, trialData }) {
    const [loadingPriceId, setLoadingPriceId] = useState(null);

    const handleSubscribe = async (priceId) => {
        setLoadingPriceId(priceId);

        // Save trial data to localStorage before redirecting
        if (trialData) {
            localStorage.setItem('rentaweb_trial', JSON.stringify(trialData));
        }

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    trialData: trialData ? {
                        businessName: trialData.businessName,
                        businessDescription: trialData.businessDescription,
                    } : undefined,
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                // Not logged in — save trial data and redirect to auth
                if (trialData) {
                    localStorage.setItem('rentaweb_trial', JSON.stringify(trialData));
                    localStorage.setItem('rentaweb_pendingPriceId', priceId);
                }
                window.location.href = '/auth/login?redirect=/dashboard/new-project';
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Subscription error:', error);
            // Likely not authenticated, redirect to login
            if (trialData) {
                localStorage.setItem('rentaweb_trial', JSON.stringify(trialData));
                localStorage.setItem('rentaweb_pendingPriceId', priceId);
            }
            window.location.href = '/auth/login?redirect=/dashboard/new-project';
        } finally {
            setLoadingPriceId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Content */}
            <div className="relative z-10 max-w-5xl w-full mx-4 max-h-[90dvh] overflow-y-auto rounded-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 mb-8 pt-6 px-4 sm:px-6"
                    style={{ background: 'inherit' }}
                >
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            Sviđa ti se? Nastavi graditi. 🚀
                        </h2>
                        <p className="text-zinc-400">
                            Tvoja stranica je spremna. Odaberi paket i preuzmi ju.
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 w-9 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-zinc-700 mt-1"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <div
                                key={plan.name}
                                className={`relative p-6 rounded-2xl border flex flex-col transition-all hover:scale-[1.02] ${
                                    plan.recommended
                                        ? 'border-white bg-zinc-900 shadow-[0_0_40px_rgba(255,255,255,0.08)]'
                                        : 'border-zinc-800 bg-zinc-900/50'
                                }`}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Najpopularniji
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                    <Icon size={20} className={plan.recommended ? 'text-white' : 'text-zinc-400'} />
                                    <h3 className={`text-lg font-bold ${plan.recommended ? 'text-white' : 'text-zinc-300'}`}>
                                        {plan.name}
                                    </h3>
                                </div>

                                <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>

                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-3xl font-extrabold text-white">{plan.price}€</span>
                                    <span className="text-sm text-zinc-500">/ mj</span>
                                </div>

                                <ul className="space-y-3 mb-6 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-zinc-400">
                                            <Check size={14} className="text-white mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan.priceId)}
                                    disabled={!!loadingPriceId}
                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                                        plan.recommended
                                            ? 'bg-white text-black hover:bg-zinc-200'
                                            : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                                    }`}
                                >
                                    {loadingPriceId === plan.priceId ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        'Odaberi paket'
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-xs text-zinc-600 mt-6 pb-6 px-4">
                    Tvoja generirana stranica bit će sačuvana i čekati te u dashboardu nakon kupnje.
                </p>
            </div>
        </div>
    );
}
