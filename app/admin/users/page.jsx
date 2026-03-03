'use client';

import { useEffect, useState } from 'react';
import { Search, Shield, ChevronLeft, ChevronRight, Coins, Plus } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [tokenModal, setTokenModal] = useState(null); // { userId, userName, currentTokens }
    const [tokenAmount, setTokenAmount] = useState('');
    const [addingTokens, setAddingTokens] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            setUsers(data.users || []); setTotal(data.total || 0); setPages(data.pages || 1);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, [page]);

    const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

    const updateUser = async (userId, updates) => {
        try {
            const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...updates }) });
            if (res.ok) { fetchUsers(); }
        } catch (e) { console.error(e); }
    };

    const handleAddTokens = async () => {
        const amount = parseInt(tokenAmount);
        if (!amount || amount <= 0 || !tokenModal) return;
        setAddingTokens(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: tokenModal.userId, addTokens: amount }),
            });
            if (res.ok) {
                fetchUsers();
                setTokenModal(null);
                setTokenAmount('');
            }
        } catch (e) { console.error(e); }
        setAddingTokens(false);
    };

    const QUICK_AMOUNTS = [100, 500, 1000, 5000];

    return (
        <div className="p-6 md:p-8 db-fade-in">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Korisnici</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>{total} ukupno</p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="mb-5">
                <div className="relative max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lp-text-muted)' }} />
                    <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pretraži po emailu ili imenu..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                        style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                    />
                </div>
            </form>

            <div className="db-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                {['Korisnik', 'Rola', 'Plan', 'Status', 'Tokeni', 'Projekti', 'Računi', 'Registracija', 'Akcije'].map(h => (
                                    <th key={h} className="px-4 py-3 font-medium text-left text-xs" style={{ color: 'var(--lp-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? [...Array(5)].map((_, i) => (
                                <tr key={i}><td colSpan={9} className="px-4 py-3.5"><div className="h-4 rounded animate-pulse" style={{ background: 'var(--lp-surface)' }} /></td></tr>
                            )) : users.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--lp-text-muted)' }}>Nema korisnika</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-sm" style={{ color: 'var(--lp-heading)' }}>{user.name || '—'}</p>
                                        <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{user.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 'text-zinc-500'}`} style={user.role !== 'ADMIN' ? { background: 'var(--lp-surface)' } : {}}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{user.planName || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.subscriptionStatus === 'active' ? 'bg-emerald-500/15 text-emerald-400' : user.subscriptionStatus === 'canceled' ? 'bg-red-500/15 text-red-400' : ''}`} style={!user.subscriptionStatus ? { color: 'var(--lp-text-muted)' } : {}}>
                                            {user.subscriptionStatus || 'Nema'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <Coins size={13} className="text-amber-400" />
                                            <span className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>{user.editorTokens?.toLocaleString() || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{user.projects?.length || 0}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{user._count?.invoices || 0}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--lp-text-muted)' }}>{new Date(user.createdAt).toLocaleDateString('hr-HR')}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => { setTokenModal({ userId: user.id, userName: user.name || user.email, currentTokens: user.editorTokens || 0 }); setTokenAmount(''); }}
                                                className="p-1.5 rounded-lg hover:bg-amber-500/15 transition-colors"
                                                style={{ color: 'var(--lp-text-muted)' }}
                                                title="Dodaj tokene"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            {user.role !== 'ADMIN' && (
                                                <button onClick={() => updateUser(user.id, { role: 'ADMIN' })} className="p-1.5 rounded-lg hover:bg-purple-500/15 transition-colors" style={{ color: 'var(--lp-text-muted)' }} title="Postavi kao Admin">
                                                    <Shield size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pages > 1 && (
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--lp-border)' }}>
                        <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Stranica {page} od {pages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg disabled:opacity-30 transition-colors" style={{ border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}><ChevronLeft size={14} /></button>
                            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded-lg disabled:opacity-30 transition-colors" style={{ border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Tokens Modal */}
            {tokenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden" style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }}>
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                    <Coins size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>Dodaj tokene</h3>
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{tokenModal.userName}</p>
                                </div>
                            </div>

                            <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                                <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--lp-text-muted)' }}>Trenutno stanje</span>
                                <p className="text-lg font-bold" style={{ color: 'var(--lp-heading)' }}>{tokenModal.currentTokens.toLocaleString()} tokena</p>
                            </div>

                            {/* Quick amounts */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {QUICK_AMOUNTS.map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setTokenAmount(String(amt))}
                                        className="py-2 rounded-lg text-xs font-semibold transition-all"
                                        style={{
                                            background: tokenAmount === String(amt) ? 'rgba(245,158,11,0.15)' : 'var(--lp-surface)',
                                            border: `1px solid ${tokenAmount === String(amt) ? 'rgba(245,158,11,0.4)' : 'var(--lp-border)'}`,
                                            color: tokenAmount === String(amt) ? '#f59e0b' : 'var(--lp-text-secondary)',
                                        }}
                                    >
                                        +{amt}
                                    </button>
                                ))}
                            </div>

                            {/* Custom amount */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium" style={{ color: 'var(--lp-text-muted)' }}>Ili unesite broj tokena</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={tokenAmount}
                                    onChange={e => setTokenAmount(e.target.value)}
                                    placeholder="npr. 2500"
                                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                                    style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTokens()}
                                />
                            </div>

                            {tokenAmount && parseInt(tokenAmount) > 0 && (
                                <p className="text-xs mt-2" style={{ color: 'var(--lp-text-muted)' }}>
                                    Novo stanje: <strong style={{ color: '#4ade80' }}>{(tokenModal.currentTokens + parseInt(tokenAmount)).toLocaleString()} tokena</strong>
                                </p>
                            )}
                        </div>

                        <div className="px-6 pb-6 flex gap-2">
                            <button
                                onClick={() => { setTokenModal(null); setTokenAmount(''); }}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}
                            >
                                Odustani
                            </button>
                            <button
                                onClick={handleAddTokens}
                                disabled={!tokenAmount || parseInt(tokenAmount) <= 0 || addingTokens}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                            >
                                {addingTokens ? 'Dodajem...' : `Dodaj ${tokenAmount || 0} tokena`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
