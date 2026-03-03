"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
    LayoutDashboard,
    CreditCard,
    Image,
    MessageSquare,
    LogOut,
    User as UserIcon,
    ChevronDown,
    Settings as SettingsIcon,
    Menu,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SubscriptionTab from "./components/SubscriptionTab";
import ProjectsTab from "./components/ProjectsTab";
import SettingsTab from "./components/SettingsTab";
import MediaTab from "./components/MediaTab";
import OnboardingTour from "@/components/OnboardingTour";
import DashboardLoader from "./components/DashboardLoader";
import { useToast } from "./components/ToastProvider";

const TABS = [
    { id: "subscription", label: "Pregled", icon: CreditCard },
    { id: "projects", label: "Projekti", icon: LayoutDashboard },
    { id: "media", label: "Media", icon: Image },
    { id: "tickets", label: "Ticketi", icon: MessageSquare },
    { id: "settings", label: "Postavke", icon: SettingsIcon },
];

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("subscription");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [tabKey, setTabKey] = useState(0); // for re-triggering fade animation
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/login");
        }
    }, [session, isPending, router]);

    // Handle renewal success redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const renewedProjectId = params.get('renewed');
        const success = params.get('success');

        if (success === 'true' && renewedProjectId) {
            fetch('/api/renew-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: renewedProjectId })
            }).then(res => res.json()).then(data => {
                if (data.reactivated) console.log('Project reactivated successfully');
            }).catch(err => console.error('Failed to reactivate project:', err));

            const url = new URL(window.location.href);
            url.searchParams.delete('success');
            url.searchParams.delete('renewed');
            url.searchParams.delete('canceled');
            window.history.replaceState({}, '', url.pathname);
        }
    }, []);

    // Handle trial claim after purchase
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const fromTrial = params.get('fromTrial');
        const success = params.get('success');

        if (success === 'true' && fromTrial === 'true') {
            try {
                const trialRaw = localStorage.getItem('rentaweb_trial');
                if (trialRaw) {
                    const trialData = JSON.parse(trialRaw);
                    if (trialData.generatedHtml) {
                        fetch('/api/projects')
                            .then(res => res.json())
                            .then(projects => {
                                if (Array.isArray(projects) && projects.length > 0) {
                                    const newest = projects[0];
                                    if (!newest.hasGenerated) {
                                        fetch('/api/try/claim', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                projectId: newest.id,
                                                generatedHtml: trialData.generatedHtml,
                                                businessName: trialData.businessName,
                                                businessDescription: trialData.businessDescription,
                                            }),
                                        }).then(res => res.json()).then(data => {
                                            if (data.success) {
                                                console.log('✅ Trial claimed for project:', newest.id);
                                                localStorage.removeItem('rentaweb_trial');
                                                window.location.reload();
                                            }
                                        }).catch(err => console.error('Trial claim error:', err));
                                    }
                                }
                            })
                            .catch(err => console.error('Failed to fetch projects for trial claim:', err));
                    }
                }
            } catch (e) {
                console.error('Failed to parse trial data:', e);
            }

            const url = new URL(window.location.href);
            url.searchParams.delete('fromTrial');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, []);

    if (isPending) {
        return <DashboardLoader steps={["Provjera sesije...", "Učitavanje dashboarda...", "Gotovo!"]} />;
    }

    if (!session) return null;

    const user = session.user;

    const logout = async () => {
        await authClient.signOut();
        router.push("/");
    };

    const handlePortal = async () => {
        try {
            const res = await fetch('/api/create-portal-session', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Greška pri otvaranju portala.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Došlo je do greške.");
        }
    };

    const switchTab = (tabId) => {
        setActiveTab(tabId);
        setTabKey(k => k + 1);
        setMobileOpen(false);
    };

    const tabLabel = TABS.find(t => t.id === activeTab)?.label || activeTab;

    // Sidebar content — shared between desktop and mobile
    const SidebarNav = () => (
        <>
            <div className="p-5 border-b" style={{ borderColor: 'var(--lp-border)' }} id="tour-welcome">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                        <img
                            src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png"
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--lp-heading)' }}>
                        Rent a webica
                    </span>
                </Link>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        id={tab.id === "subscription" ? "tour-subscription" : tab.id === "projects" ? "tour-projects" : tab.id === "tickets" ? "tour-support" : undefined}
                        onClick={() => switchTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            activeTab === tab.id ? "db-nav-active" : "db-nav-item"
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="p-3 border-t" style={{ borderColor: 'var(--lp-border)' }}>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium db-nav-item hover:!text-red-400"
                >
                    <LogOut size={18} />
                    Odjava
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen text-white flex" data-landing="true" data-dashboard="true" style={{ background: 'var(--lp-bg)' }}>
            {/* Desktop Sidebar */}
            <aside
                className="w-60 flex-col hidden md:flex sticky top-0 h-screen"
                style={{
                    background: 'var(--lp-bg-alt)',
                    borderRight: '1px solid var(--lp-border)',
                }}
            >
                <SidebarNav />
            </aside>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <>
                    <div className="db-drawer-overlay md:hidden" onClick={() => setMobileOpen(false)} />
                    <aside
                        className="db-drawer fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col md:hidden"
                        style={{
                            background: 'var(--lp-bg-alt)',
                            borderRight: '1px solid var(--lp-border)',
                        }}
                    >
                        <SidebarNav />
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Header */}
                <header
                    className="h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30"
                    style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid var(--lp-border)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setMobileOpen(true)}
                            style={{ color: 'var(--lp-text-secondary)' }}
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-base font-semibold" style={{ color: 'var(--lp-heading)' }}>
                            {tabLabel}
                        </h2>
                    </div>
                    <UserDropdown user={user} logout={logout} setActiveTab={switchTab} />
                </header>

                <OnboardingTour />

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
                    {/* Subtle ambient glow */}
                    <div
                        className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-30"
                        style={{ background: 'var(--lp-hero-glow)' }}
                    />

                    {/* Tab content with fade animation */}
                    <div key={tabKey} className="db-fade-in relative z-10">
                        {activeTab === "subscription" && <SubscriptionTab user={user} onPortal={handlePortal} />}
                        {activeTab === "projects" && <ProjectsTab />}
                        {activeTab === "media" && <MediaTab />}
                        {activeTab === "tickets" && <PlaceholderTab title="Podrška & Ticketi" desc="Trebaš promjenu ili imaš problem? Ovdje ćeš moći otvoriti ticket i pratiti njegov status." icon={MessageSquare} />}
                        {activeTab === "settings" && <SettingsTab user={user} logout={logout} />}
                    </div>
                </div>
            </main>
        </div>
    );
}


function PlaceholderTab({ title, desc, icon: Icon }) {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-sm">
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{
                        background: 'var(--lp-surface)',
                        border: '1px solid var(--lp-border)',
                    }}
                >
                    <Icon size={36} strokeWidth={1.5} style={{ color: 'var(--lp-text-muted)' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--lp-heading)' }}>{title}</h3>
                <p className="leading-relaxed text-sm" style={{ color: 'var(--lp-text-muted)' }}>{desc}</p>
                <div
                    className="mt-6 px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                    style={{
                        border: '1px solid var(--lp-border)',
                        color: 'var(--lp-text-muted)',
                    }}
                >
                    Uskoro dostupno 🛠️
                </div>
            </div>
        </div>
    );
}

function UserDropdown({ user, logout, setActiveTab }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                id="tour-user-menu"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl transition-all hover:bg-white/5"
            >
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>{user.name}</div>
                    <div className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{user.email}</div>
                </div>
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                        background: 'var(--lp-surface)',
                        border: '1px solid var(--lp-border)',
                    }}
                >
                    {user.image ? (
                        <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={16} style={{ color: 'var(--lp-text-muted)' }} />
                    )}
                </div>
                <ChevronDown
                    size={14}
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--lp-text-muted)' }}
                />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div
                        className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-1.5 z-20 db-fade-in"
                        style={{
                            background: 'var(--lp-surface)',
                            border: '1px solid var(--lp-border)',
                        }}
                    >
                        <button
                            onClick={() => { setActiveTab("settings"); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all db-nav-item hover:bg-white/5"
                        >
                            <SettingsIcon size={16} /> Postavke računa
                        </button>
                        <div className="my-1" style={{ borderTop: '1px solid var(--lp-border)' }} />
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all db-nav-item hover:!text-red-400 hover:bg-red-400/5"
                        >
                            <LogOut size={16} /> Odjava
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
