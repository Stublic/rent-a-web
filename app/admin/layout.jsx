'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, FolderOpen, FileText, BarChart3, LogOut, ChevronRight } from 'lucide-react';

export default function AdminLayout({ children }) {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => {
                if (res.status === 403) {
                    router.push('/dashboard');
                    return;
                }
                if (!res.ok) {
                    console.error('Admin check failed with status:', res.status);
                    // Still show the page, the individual components will show errors
                }
                setAuthorized(true);
            })
            .catch((err) => {
                console.error('Admin check error:', err);
                router.push('/dashboard');
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authorized) return null;

    const navItems = [
        { href: '/admin', icon: BarChart3, label: 'Pregled' },
        { href: '/admin/users', icon: Users, label: 'Korisnici' },
        { href: '/admin/projects', icon: FolderOpen, label: 'Projekti' },
        { href: '/admin/invoices', icon: FileText, label: 'Računi' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-black border-r border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-lg">Admin</h1>
                            <p className="text-xs text-zinc-500">Rent a Web</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group"
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all"
                    >
                        <LogOut size={18} />
                        <span>Natrag na Dashboard</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
