'use client';

import { useEffect, useState } from 'react';
import { Bot, Zap, Coins, TrendingUp } from 'lucide-react';

export default function AdminUsageDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/usage')
            .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.json(); })
            .then(setData)
            .catch(err => console.error('Admin usage error:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6 md:p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-7 rounded w-48" style={{ background: 'var(--lp-surface)' }} />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-28 rounded-xl" style={{ background: 'var(--lp-surface)' }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const summary = data?.summary || { calls: 0, tokens: 0, cost: 0 };
    const chartData = data?.chartData || [];
    const modelStats = data?.modelStats || [];

    const cards = [
        { label: 'Ukupno API Poziva', value: summary.calls.toLocaleString('hr-HR'), icon: Zap, color: 'rgba(59,130,246,0.8)' },
        { label: 'Ukupno Tokena', value: summary.tokens.toLocaleString('hr-HR'), icon: Bot, color: 'rgba(34,197,94,0.8)' },
        { label: 'Ukupni Trošak', value: `€${summary.cost.toFixed(2)}`, icon: Coins, color: 'rgba(245,158,11,0.8)' },
        { label: 'Prosječno po pozivu', value: `€${(summary.calls ? summary.cost / summary.calls : 0).toFixed(4)}`, icon: TrendingUp, color: 'rgba(168,85,247,0.8)' },
    ];

    return (
        <div className="p-6 md:p-8 db-fade-in">
            <div className="mb-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>AI Potrošnja</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>Pregled Gemini API poziva i troškova</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map(card => (
                    <div key={card.label} className="db-card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{card.label}</span>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.color }}>
                                <card.icon size={15} className="text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--lp-heading)' }}>{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Daily Chart (Simple CSS implementation) */}
                <div className="db-card p-5 lg:col-span-2 overflow-hidden flex flex-col">
                    <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--lp-heading)' }}>Dnevni trošak (zadnjih 30 dana)</h2>
                    <div className="flex-1 flex items-end gap-1 sm:gap-2 h-48 mt-auto pt-4 relative border-b" style={{ borderColor: 'var(--lp-border)' }}>
                        {chartData.length > 0 ? (
                            chartData.map((day, i) => {
                                // Find max cost to scale chart
                                const maxCost = Math.max(...chartData.map((d) => d.cost), 0.1);
                                const heightPct = Math.max((day.cost / maxCost) * 100, 2); // min 2% height
                                
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <div 
                                            className="w-full rounded-t-sm transition-all duration-300"
                                            style={{ 
                                                height: `${heightPct}%`, 
                                                background: 'rgba(245,158,11,0.6)',
                                            }}
                                        />
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                            {day.date}<br/>
                                            €{day.cost.toFixed(2)}<br/>
                                            {day.calls} poziva
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: 'var(--lp-text-muted)' }}>
                                Nema podataka za prikaz
                            </div>
                        )}
                    </div>
                </div>

                {/* Model Breakdown */}
                <div className="db-card overflow-hidden">
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                        <h2 className="font-semibold text-sm" style={{ color: 'var(--lp-heading)' }}>Potrošnja po modelu</h2>
                    </div>
                    <div>
                        {modelStats.length > 0 ? (
                            modelStats.map((model, i) => (
                                <div key={i} className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--lp-heading)' }}>{model.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{model.calls.toLocaleString('hr-HR')} poziva</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-emerald-400">€{model.cost.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--lp-text-muted)' }}>Nema podataka</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
