"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { User as UserIcon, Lock, Key, Loader2 } from "lucide-react";

export default function SettingsTab({ user, logout }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const isSocialUser = !user.emailVerified && user.image; // Simple heuristic for social users

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
