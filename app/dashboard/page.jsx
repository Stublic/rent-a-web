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
    Lock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
                    {activeTab === "content" && <PlaceholderTab title="Upravljanje Sadržajem" desc="Ovdje ćeš uskoro moći dodavati tekstove, slike i mijenjati informacije na svom webu." icon={FileText} />}
                    {activeTab === "tickets" && <PlaceholderTab title="Podrška & Ticketi" desc="Trebaš promjenu ili imaš problem? Ovdje ćeš moći otvoriti ticket i pratiti njegov status." icon={MessageSquare} />}
                    {activeTab === "settings" && <SettingsTab user={user} logout={logout} />}
                </div>
            </main>
        </div>
    );
}

function SubscriptionTab({ user, onPortal }) {
    const isSubscriber = user.subscriptionStatus === "active";
    const plan = user.planName || "Nema aktivne pretplate";

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="text-sm text-zinc-500 uppercase font-bold tracking-wider mb-2">Trenutni Status</div>
                        <h3 className="text-3xl font-bold mb-1">{plan}</h3>
                        <div className="flex items-center gap-2 mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isSubscriber ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-zinc-800 text-zinc-500"}`}>
                                {isSubscriber ? "Aktivan" : "Neaktivan"}
                            </span>
                        </div>
                    </div>
                    {isSubscriber ? (
                        <button 
                            onClick={onPortal}
                            className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2"
                        >
                             Upravljaj pretplatom <ChevronRight size={18} />
                        </button>
                    ) : (
                        <Link href="/#pricing" className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl transition-all inline-flex items-center gap-2">
                            Odaberi paket <ChevronRight size={18} />
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Poboljšajte svoj web</h4>
                    <p className="text-zinc-500 text-sm mb-4">Dodajte nove funkcionalnosti, SEO članke ili Google Ads vođenje.</p>
                    <button className="text-purple-400 font-bold text-sm hover:text-purple-300 flex items-center gap-1">Prikaži opcije <ChevronRight size={14} /></button>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <LifeBuoy size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Trebate pomoć?</h4>
                    <p className="text-zinc-500 text-sm mb-4">Naš tim je tu za vas 24/7. Otvorite ticket i riješit ćemo sve u trenu.</p>
                    <button className="text-blue-400 font-bold text-sm hover:text-blue-300 flex items-center gap-1">Kontaktiraj podršku <ChevronRight size={14} /></button>
                </div>
            </div>
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

function SettingsTab({ user, logout }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const isSocialUser = !user.emailVerified && user.image; // Simple heuristic for social users, Better Auth handles this more explicitly in session

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Lozinke se ne podudaraju." });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        const { error } = await authClient.changePassword({
            currentPassword: currentPassword,
            newPassword: newPassword,
            revokeOtherSessions: true,
        });

        if (error) {
            setMessage({ type: "error", text: error.message || "Greška pri promjeni lozinke." });
        } else {
            setMessage({ type: "success", text: "Lozinka uspješno promijenjena!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h3 className="text-xl font-bold mb-2">Profil</h3>
                    <p className="text-zinc-500 text-sm italic">Osnovne informacije o vašem računu.</p>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                                {user.image ? <img src={user.image} alt="Avatar" /> : <UserIcon size={24} className="text-zinc-500" />}
                            </div>
                            <div>
                                <div className="font-bold text-lg">{user.name}</div>
                                <div className="text-zinc-500">{user.email}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-zinc-900 flex-1 md:col-span-3"></div>

                <div className="md:col-span-1">
                    <h3 className="text-xl font-bold mb-2">Sigurnost</h3>
                    <p className="text-zinc-500 text-sm">Promijenite svoju lozinku kako biste zaštitili račun.</p>
                </div>
                <div className="md:col-span-2">
                    {isSocialUser ? (
                        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-8 text-center">
                            <Lock size={32} className="text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-500 text-sm italic">
                                Prijavljeni ste putem Google računa. Lozinku možete promijeniti u postavkama svog Google računa.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                {message.text && (
                                    <div className={`p-3 rounded-xl text-sm text-center border ${message.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                                        {message.text}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Trenutna lozinka</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <input 
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Nova lozinka</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <input 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Potvrdi novu lozinku</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="bg-zinc-100 hover:bg-white text-black font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "Spremi promjene"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
