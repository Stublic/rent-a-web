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
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SubscriptionTab from "./components/SubscriptionTab";
import ProjectsTab from "./components/ProjectsTab";
import SettingsTab from "./components/SettingsTab";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("subscription");
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/login");
        }
    }, [session, isPending, router]);

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
                <div className="p-6 border-b border-zinc-800">
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
                        onClick={() => setActiveTab("subscription")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "subscription" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <CreditCard size={20} />
                        <span className="font-medium">Pretplata</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("projects")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "projects" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Projekti</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("content")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "content" ? "bg-green-600/10 text-green-500 border border-green-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <FileText size={20} />
                        <span className="font-medium">Sadržaj</span>
                    </button>
                    <button
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

                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-900/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {activeTab === "subscription" && <SubscriptionTab user={user} onPortal={handlePortal} />}
                    {activeTab === "projects" && <ProjectsTab />}
                    {activeTab === "content" && <PlaceholderTab title="Upravljanje Sadržajem" desc="Ovdje ćeš uskoro moći dodavati tekstove, slike i mijenjati informacije na svom webu." icon={FileText} />}
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



