'use client';

import { useEffect, useState } from 'react';
import { Users, FolderOpen, FileText, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.json(); })
            .then(setData)
            .catch(err => console.error('Admin stats error:', err))
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

    const stats = data?.stats || {};
    const cards = [
        { label: 'Ukupno Korisnika', value: stats.totalUsers, icon: Users, color: 'rgba(59,130,246,0.8)' },
        { label: 'Ukupno Projekata', value: stats.totalProjects, icon: FolderOpen, color: 'rgba(34,197,94,0.8)' },
        { label: 'Aktivnih Projekata', value: stats.activeProjects, icon: Activity, color: 'rgba(245,158,11,0.8)' },
        { label: 'MRR', value: `€${stats.mrr || 0}`, icon: DollarSign, color: 'rgba(168,85,247,0.8)' },
    ];

    return (
        <div className="p-6 md:p-8 db-fade-in">
            <div className="mb-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Admin Dashboard</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>Pregled sustava</p>
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

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Users */}
                <div className="db-card overflow-hidden">
                    <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                        <Users size={15} className="text-blue-400" />
                        <h2 className="font-semibold text-sm" style={{ color: 'var(--lp-heading)' }}>Novi Korisnici</h2>
                    </div>
                    <div>
                        {(data?.recentUsers || []).map(user => (
                            <div key={user.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--lp-heading)' }}>{user.name || 'Nepoznato'}</p>
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{user.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                        {new Date(user.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                    {user.planName && <p className="text-xs text-emerald-400 mt-0.5">{user.planName}</p>}
                                </div>
                            </div>
                        ))}
                        {!data?.recentUsers?.length && (
                            <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--lp-text-muted)' }}>Nema korisnika</p>
                        )}
                    </div>
                </div>

                {/* Recent Invoices */}
                <div className="db-card overflow-hidden">
                    <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                        <FileText size={15} className="text-purple-400" />
                        <h2 className="font-semibold text-sm" style={{ color: 'var(--lp-heading)' }}>Zadnji Računi</h2>
                    </div>
                    <div>
                        {(data?.recentInvoices || []).map(inv => (
                            <div key={inv.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--lp-heading)' }}>#{inv.invoiceNumber}</p>
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{inv.user?.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-emerald-400">€{inv.amount?.toFixed(2)}</p>
                                    <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                        {new Date(inv.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {!data?.recentInvoices?.length && (
                            <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--lp-text-muted)' }}>Nema računa</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
