'use client';

import { useEffect, useState } from 'react';
import { Search, Shield, ChevronLeft, ChevronRight, Mail, Calendar, CreditCard } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            setUsers(data.users || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const updateUser = async (userId, updates) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...updates }),
            });
            if (res.ok) {
                fetchUsers();
                setEditingUser(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const roleColors = {
        ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        USER: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30',
    };

    const statusColors = {
        active: 'bg-green-500/20 text-green-400',
        canceled: 'bg-red-500/20 text-red-400',
        null: 'bg-zinc-700/30 text-zinc-500',
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Korisnici</h1>
                    <p className="text-zinc-500 mt-1">{total} ukupno</p>
                </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pretraži po emailu ili imenu..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
            </form>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800 text-left text-zinc-500">
                                <th className="px-5 py-3 font-medium">Korisnik</th>
                                <th className="px-5 py-3 font-medium">Rola</th>
                                <th className="px-5 py-3 font-medium">Plan</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                                <th className="px-5 py-3 font-medium">Projekti</th>
                                <th className="px-5 py-3 font-medium">Računi</th>
                                <th className="px-5 py-3 font-medium">Registracija</th>
                                <th className="px-5 py-3 font-medium">Akcije</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={8} className="px-5 py-4">
                                            <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-zinc-600">
                                        Nema korisnika
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div>
                                            <p className="text-white font-medium">{user.name || '—'}</p>
                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${roleColors[user.role] || roleColors.USER}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-zinc-400">{user.planName || '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[user.subscriptionStatus] || statusColors.null}`}>
                                            {user.subscriptionStatus || 'Nema'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-zinc-400">{user.projects?.length || 0}</td>
                                    <td className="px-5 py-3 text-zinc-400">{user._count?.invoices || 0}</td>
                                    <td className="px-5 py-3 text-zinc-500 text-xs">
                                        {new Date(user.createdAt).toLocaleDateString('hr-HR')}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            {user.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => updateUser(user.id, { role: 'ADMIN' })}
                                                    className="p-1.5 rounded-md hover:bg-purple-500/20 text-zinc-500 hover:text-purple-400 transition-colors"
                                                    title="Postavi kao Admin"
                                                >
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

                {/* Pagination */}
                {pages > 1 && (
                    <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Stranica {page} od {pages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-md border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pages, p + 1))}
                                disabled={page === pages}
                                className="p-1.5 rounded-md border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
