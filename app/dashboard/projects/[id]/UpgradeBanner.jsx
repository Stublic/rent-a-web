'use client';

import { useState } from 'react';
import { Zap, Check, ArrowUpCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UpgradeBanner({ projectId, projectName }) {
    const [upgrading, setUpgrading] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    if (dismissed || success) return null;

    const handleUpgrade = async () => {
        setUpgrading(true);
        try {
            const res = await fetch('/api/upgrade-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                // Refresh the page to unlock Advanced features (Blog tab, Subpages, etc.)
                setTimeout(() => {
                    router.refresh();
                }, 500);
            } else {
                alert(data.error || 'Greška pri nadogradnji.');
            }
        } catch (err) {
            console.error('Upgrade error:', err);
            alert('Došlo je do greške pri nadogradnji.');
        } finally {
            setUpgrading(false);
        }
    };

    if (success) {
        return (
            <div className="mx-4 md:mx-6 mt-2 rounded-xl p-3 flex items-center gap-3 db-fade-in"
                style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                }}
            >
                <Check size={18} className="text-emerald-400 shrink-0" />
                <p className="text-sm font-semibold text-emerald-400">
                    Uspješno nadograđeno na Advanced! Stranica se osvježava...
                </p>
            </div>
        );
    }

    return (
        <div
            className="mx-4 md:mx-6 mt-2 rounded-xl p-3 flex items-center justify-between gap-3 db-fade-in"
            style={{
                background: 'linear-gradient(90deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.04) 100%)',
                border: '1px solid rgba(16,185,129,0.15)',
            }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <ArrowUpCircle size={18} className="text-emerald-400 shrink-0" />
                <p className="text-xs md:text-sm truncate" style={{ color: 'var(--db-text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--db-heading)' }}>Nadogradi na Advanced</span>
                    <span className="hidden sm:inline"> — otključaj podstranice, Blog i +500 tokena</span>
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 hover:scale-105 disabled:opacity-50"
                    style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                    }}
                >
                    {upgrading ? (
                        <span className="flex items-center gap-1.5">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Nadogradnja...
                        </span>
                    ) : (
                        <><Zap size={12} /> Nadogradi</>
                    )}
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: 'var(--db-text-muted)' }}
                    title="Zatvori"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
