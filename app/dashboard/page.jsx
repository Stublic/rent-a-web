"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { 
    LayoutDashboard, 
    CreditCard, 
    FileText, 
    MessageSquare, 
    LogOut, 
    User as UserIcon,
    ChevronRight,
    Zap,
    LifeBuoy,
    Settings as SettingsIcon,
    Key,
    UserCircle,
    ChevronDown,
    Loader2,
    Lock,
    Sparkles,
    Image
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SubscriptionTab from "./components/SubscriptionTab";
import ProjectsTab from "./components/ProjectsTab";
import SettingsTab from "./components/SettingsTab";
import MediaTab from "./components/MediaTab";
import OnboardingTour from "@/components/OnboardingTour";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("subscription");
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

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
            // Call API to reactivate the project
            fetch('/api/renew-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: renewedProjectId })
            }).then(res => res.json()).then(data => {
                if (data.reactivated) {
                    console.log('Project reactivated successfully');
                }
            }).catch(err => {
                console.error('Failed to reactivate project:', err);
            });

            // Clean up URL params
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
                        // Find the newest project (just created by webhook) and claim trial HTML
                        fetch('/api/projects')
                            .then(res => res.json())
                            .then(projects => {
                                if (Array.isArray(projects) && projects.length > 0) {
                                    const newest = projects[0]; // Already sorted by createdAt desc
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
                                                // Refresh to show the project with generated HTML
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

            // Clean up URL params
            const url = new URL(window.location.href);
            url.searchParams.delete('fromTrial');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, []);

    if (isPending) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
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
                alert(data.error || "Greška pri otvaranju portala.");
            }
        } catch (err) {
            console.error(err);
            alert("Došlo je do greške.");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-900/40 border-r border-zinc-800 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-zinc-800" id="tour-welcome">
                    <Link href="/" className="flex items-center gap-3">
                        <img
                            src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png"
                            alt="Logo"
                            className="w-8 h-8 object-cover rounded-lg"
                        />
                        <span className="font-bold text-lg tracking-tight">Rent a Web</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        id="tour-subscription"
                        onClick={() => setActiveTab("subscription")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "subscription" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <CreditCard size={20} />
                        <span className="font-medium">Pretplata</span>
                    </button>
                    <button
                        id="tour-projects"
                        onClick={() => setActiveTab("projects")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "projects" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Projekti</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("media")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "media" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <Image size={20} />
                        <span className="font-medium">Media</span>
                    </button>
                    <button
                        id="tour-support"
                        onClick={() => setActiveTab("tickets")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "tickets" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <MessageSquare size={20} />
                        <span className="font-medium">Ticketi</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "settings" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <SettingsIcon size={20} />
                        <span className="font-medium">Postavke</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-400 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Odjava</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md relative z-20">
                    <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
                    <UserDropdown user={user} logout={logout} setActiveTab={setActiveTab} />
                </header>

                <OnboardingTour />

                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-900/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {activeTab === "subscription" && <SubscriptionTab user={user} onPortal={handlePortal} />}
                    {activeTab === "projects" && <ProjectsTab />}
                    {activeTab === "media" && <MediaTab />}
                    {activeTab === "tickets" && <PlaceholderTab title="Podrška & Ticketi" desc="Trebaš promjenu ili imaš problem? Ovdje ćeš moći otvoriti ticket i pratiti njegov status." icon={MessageSquare} />}
                    {activeTab === "settings" && <SettingsTab user={user} logout={logout} />}
                </div>
            </main>
        </div>
    );
}


function PlaceholderTab({ title, desc, icon: Icon }) {
    return (
        <div className="h-full flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 flex items-center justify-center mx-auto mb-6 text-zinc-500 shadow-inner">
                    <Icon size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-zinc-500 leading-relaxed">{desc}</p>
                <div className="mt-8 px-4 py-2 border border-zinc-800 rounded-full inline-flex items-center gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                    Značajka u razvoju 🛠️
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
                className="flex items-center gap-4 hover:bg-zinc-900 p-2 rounded-xl transition-all"
            >
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{user.name}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                    {user.image ? (
                        <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={18} className="text-zinc-400" />
                    )}
                </div>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                        <button 
                            onClick={() => { setActiveTab("settings"); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm"
                        >
                            <SettingsIcon size={18} /> Postavke računa
                        </button>
                        <div className="border-t border-zinc-800 my-1"></div>
                        <button 
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm"
                        >
                            <LogOut size={18} /> Odjava
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}



