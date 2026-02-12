"use client";

import { useState } from 'react';
import { Coins, Check, Loader2, ArrowLeft } from 'lucide-react';
import { TOKEN_PACKAGES } from '@/lib/constants';
import { createTokenCheckoutSession } from '@/app/actions/token-purchase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TokenPurchasePage({ project }) {
    const [loading, setLoading] = useState(null);
    const router = useRouter();

    const handlePurchase = async (packageId) => {
        setLoading(packageId);
        try {
            const result = await createTokenCheckoutSession(project.id, packageId);
            
            if (result.url) {
                window.location.href = result.url;
            } else {
                alert(result.error || 'Greška pri kupnji tokena');
                setLoading(null);
            }
        } catch (error) {
            console.error(error);
            alert('Došlo je do greške');
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white p-8">
            <div className="max-w-5xl mx-auto">
                {/* Back button */}
                <Link 
                    href={`/dashboard/projects/${project.id}/editor`}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Natrag na Editor
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Coins size={40} className="text-yellow-500" />
                        <h1 className="text-4xl font-bold">Kupi Editor Tokene</h1>
                    </div>
                    <p className="text-zinc-400 text-lg">
                        Nadopunite tokene za AI uređivanje web stranice
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-zinc-800/50 rounded-full px-4 py-2 border border-zinc-700">
                        <span className="text-sm text-zinc-400">Trenutno imate:</span>
                        <span className="font-mono font-bold text-yellow-500">{project.editorTokens} tokena</span>
                    </div>
                </div>

                {/* Token Packages */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {TOKEN_PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`relative bg-zinc-900 border-2 rounded-2xl p-6 transition-all hover:border-green-500 ${
                                pkg.popular 
                                    ? 'border-green-500 shadow-lg shadow-green-500/20' 
                                    : 'border-zinc-800'
                            }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    NAJPOPULARNIJE
                                </div>
                            )}

                            {pkg.savings && (
                                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                                    {pkg.savings} UŠTEDA
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Coins size={24} className="text-yellow-500" />
                                    <h3 className="text-2xl font-bold">{pkg.name}</h3>
                                </div>
                                <p className="text-zinc-500 text-sm">{pkg.description}</p>
                            </div>

                            <div className="text-center mb-6">
                                <div className="text-4xl font-bold text-green-500 mb-1">
                                    €{pkg.price}
                                </div>
                                <div className="text-zinc-500 text-sm">
                                    €{(pkg.price / pkg.tokens * 100).toFixed(2)} po 100 tokena
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Check size={16} className="text-green-500" />
                                    {pkg.tokens} tokena
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Check size={16} className="text-green-500" />
                                    Bez isteka
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Check size={16} className="text-green-500" />
                                    Instant dostava
                                </div>
                            </div>

                            <button
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={loading !== null}
                                className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    pkg.popular
                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                                }`}
                            >
                                {loading === pkg.id ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Preusmjeravanje...
                                    </>
                                ) : (
                                    'Kupi Sada'
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Info Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Kako funkcioniraju tokeni?
                    </h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                        <li className="flex gap-2">
                            <span className="text-green-500">•</span>
                            <span>Svaka AI izmjena u Editoru troši <strong className="text-white">50 tokena</strong></span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">•</span>
                            <span>Besplatno uređivanje podataka u tabu "Sadržaj" <strong className="text-white">ne troši tokene</strong></span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">•</span>
                            <span>Svaki novi projekt dobiva <strong className="text-white">500 besplatnih tokena</strong> (~10 AI izmjena)</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">•</span>
                            <span>Tokeni ne istječu i mogu se koristiti bilo kada</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">•</span>
                            <span>Sigurna naplata putem Stripe platforme</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
