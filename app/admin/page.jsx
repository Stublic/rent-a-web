'use client';

import { useEffect, useState } from 'react';
import { Users, FolderOpen, FileText, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(setData)
            .catch(err => console.error('Admin stats error:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-zinc-800 rounded w-48" />
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-zinc-800 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const cards = [
        { label: 'Ukupno Korisnika', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-700' },
        { label: 'Ukupno Projekata', value: stats.totalProjects, icon: FolderOpen, color: 'from-green-500 to-green-700' },
        { label: 'Aktivnih Projekata', value: stats.activeProjects, icon: Activity, color: 'from-amber-500 to-amber-700' },
        { label: 'MRR', value: `€${stats.mrr || 0}`, icon: DollarSign, color: 'from-purple-500 to-purple-700' },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-zinc-500 mt-1">Pregled sustava</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {cards.map(card => (
                    <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-zinc-500">{card.label}</span>
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                <card.icon size={16} className="text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        <h2 className="font-semibold text-white text-sm">Novi Korisnici</h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {(data?.recentUsers || []).map(user => (
                            <div key={user.id} className="px-5 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white font-medium">{user.name || 'Nepoznato'}</p>
                                    <p className="text-xs text-zinc-500">{user.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-zinc-600">
                                        {new Date(user.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                    {user.planName && (
                                        <p className="text-xs text-green-500 mt-0.5">{user.planName}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!data?.recentUsers?.length) && (
                            <p className="px-5 py-6 text-sm text-zinc-600 text-center">Nema korisnika</p>
                        )}
                    </div>
                </div>

                {/* Recent Invoices */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                        <FileText size={16} className="text-purple-500" />
                        <h2 className="font-semibold text-white text-sm">Zadnji Računi</h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {(data?.recentInvoices || []).map(inv => (
                            <div key={inv.id} className="px-5 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white font-medium">#{inv.invoiceNumber}</p>
                                    <p className="text-xs text-zinc-500">{inv.user?.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-green-500">€{inv.amount?.toFixed(2)}</p>
                                    <span className="text-xs text-zinc-600">
                                        {new Date(inv.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!data?.recentInvoices?.length) && (
                            <p className="px-5 py-6 text-sm text-zinc-600 text-center">Nema računa</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
