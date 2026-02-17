'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Small delay so it doesn't flash on page load
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-slide-up"
            style={{
                animation: 'slideUp 0.4s ease-out'
            }}
        >
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Icon & Text */}
                    <div className="flex items-start gap-3 flex-1">
                        <Cookie className="text-green-500 mt-0.5 flex-shrink-0" size={22} />
                        <div>
                            <p className="text-sm text-zinc-200 leading-relaxed">
                                Koristimo samo <strong>nužne kolačiće</strong> za autentikaciju i funkcioniranje aplikacije.
                                Ne koristimo kolačiće za oglašavanje ili praćenje.{' '}
                                <Link
                                    href="/politika-privatnosti"
                                    className="text-green-500 hover:text-green-400 underline underline-offset-2"
                                >
                                    Više informacija
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
                        <button
                            onClick={decline}
                            className="flex-1 md:flex-none px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition-all"
                        >
                            Samo nužni
                        </button>
                        <button
                            onClick={accept}
                            className="flex-1 md:flex-none px-5 py-2 text-sm font-medium bg-green-500 hover:bg-green-400 text-white rounded-lg transition-all"
                        >
                            Prihvaćam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
