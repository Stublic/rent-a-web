'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, FolderOpen, FileText, BarChart3, LogOut, MessageSquare, Menu, X, Image, Settings, Ticket, Megaphone } from 'lucide-react';
import { TabLoader } from '../dashboard/components/DashboardLoader';

export default function AdminLayout({ children }) {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => {
                if (res.status === 403) { router.push('/dashboard'); return; }
                setAuthorized(true);
            })
            .catch(() => router.push('/dashboard'))
            .finally(() => setLoading(false));
    }, [router]);

    // Close drawer on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
                <TabLoader message="Provjera pristupa..." />
            </div>
        );
    }

    if (!authorized) return null;

    const navItems = [
        { href: '/admin', icon: BarChart3, label: 'Pregled' },
        { href: '/admin/users', icon: Users, label: 'Korisnici' },
        { href: '/admin/projects', icon: FolderOpen, label: 'Projekti' },
        { href: '/admin/invoices', icon: FileText, label: 'Računi' },
        { href: '/admin/usage', icon: BarChart3, label: 'Potrošnja (AI)' },
        { href: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
        { href: '/admin/tickets', icon: Ticket, label: 'Ticketi' },
        { href: '/admin/references', icon: Image, label: 'Dizajn Reference' },
        { href: '/admin/google-ads', icon: Megaphone, label: 'Google Ads' },
        { href: '/admin/settings', icon: Settings, label: 'Postavke' },
    ];

    const isActive = (href) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const SidebarContent = () => (
        <>
            <div className="p-5" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        <Shield size={17} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>Admin Panel</h1>
                        <p className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>Rent a webica</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-0.5">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.href) ? 'db-nav-active' : ''}`}
                        style={{
                            color: isActive(item.href) ? 'var(--lp-heading)' : 'var(--lp-text-muted)',
                            background: isActive(item.href) ? 'rgba(255,255,255,0.05)' : 'transparent',
                        }}
                    >
                        <item.icon size={17} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-3" style={{ borderTop: '1px solid var(--lp-border)' }}>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{ color: 'var(--lp-text-muted)' }}
                >
                    <LogOut size={17} />
                    <span>Natrag na Dashboard</span>
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex text-white" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
            {/* Desktop Sidebar */}
            <aside className="w-60 flex-col hidden md:flex sticky top-0 h-screen" style={{ background: 'var(--lp-bg-alt)', borderRight: '1px solid var(--lp-border)' }}>
                <SidebarContent />
            </aside>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <>
                    <div className="db-drawer-overlay md:hidden" onClick={() => setMobileOpen(false)} />
                    <aside
                        className="db-drawer fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col md:hidden"
                        style={{ background: 'var(--lp-bg-alt)', borderRight: '1px solid var(--lp-border)' }}
                    >
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Mobile Header */}
                <header
                    className="h-14 flex items-center justify-between px-4 sticky top-0 z-30 md:hidden"
                    style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid var(--lp-border)',
                    }}
                >
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: 'var(--lp-text-secondary)' }}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-purple-400" />
                        <span className="text-sm font-bold" style={{ color: 'var(--lp-heading)' }}>Admin</span>
                    </div>
                    <div className="w-9" /> {/* spacer for centering */}
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
