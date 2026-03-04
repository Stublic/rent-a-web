"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { User as UserIcon, Lock, Key, Monitor, Sun, Moon } from "lucide-react";
import { ButtonLoader } from "./DashboardLoader";
import { useToast } from "./ToastProvider";

const THEME_OPTIONS = [
    { value: "system", label: "Sustav", icon: Monitor, desc: "Prati postavke uređaja" },
    { value: "light", label: "Svijetlo", icon: Sun, desc: "Uvijek svijetla tema" },
    { value: "dark", label: "Tamno", icon: Moon, desc: "Uvijek tamna tema" },
];

function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className="db-card p-5">
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--db-heading)' }}>Izgled sučelja</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--db-text-muted)' }}>
                Odaberite željeni izgled dashboarda.
            </p>
            <div className="grid grid-cols-3 gap-3">
                {THEME_OPTIONS.map((opt) => {
                    const isActive = theme === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => setTheme(opt.value)}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-center"
                            style={{
                                background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'var(--db-bg)',
                                border: isActive ? '1.5px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--db-border)',
                                color: isActive ? '#a78bfa' : 'var(--db-text-muted)',
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                                style={{
                                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'var(--db-surface)',
                                }}
                            >
                                <opt.icon size={20} />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: isActive ? '#a78bfa' : 'var(--db-heading)' }}>
                                {opt.label}
                            </span>
                            <span className="text-[11px] leading-tight" style={{ color: 'var(--db-text-muted)' }}>
                                {opt.desc}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function SettingsTab({ user, logout }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const isSocialUser = !user.emailVerified && user.image;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Lozinke se ne podudaraju.");
            return;
        }

        setLoading(true);

        const { error } = await authClient.changePassword({
            currentPassword: currentPassword,
            newPassword: newPassword,
            revokeOtherSessions: true,
        });

        if (error) {
            toast.error(error.message || "Greška pri promjeni lozinke.");
        } else {
            toast.success("Lozinka uspješno promijenjena!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
        setLoading(false);
    };

    const inputStyle = {
        background: 'var(--db-bg)',
        border: '1px solid var(--db-border)',
        color: 'var(--db-heading)',
    };

    return (
        <div className="max-w-3xl space-y-6">
            {/* Theme Appearance Section */}
            <ThemeSelector />
            <div className="db-card p-5">
                <h3 className="text-base font-bold mb-4" style={{ color: 'var(--db-heading)' }}>Profil</h3>
                <div className="flex items-center gap-4">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
                        style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)' }}
                    >
                        {user.image ? (
                            <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={22} style={{ color: 'var(--db-text-muted)' }} />
                        )}
                    </div>
                    <div>
                        <div className="font-bold" style={{ color: 'var(--db-heading)' }}>{user.name}</div>
                        <div className="text-sm" style={{ color: 'var(--db-text-muted)' }}>{user.email}</div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="db-card p-5">
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--db-heading)' }}>Sigurnost</h3>
                <p className="text-sm mb-5" style={{ color: 'var(--db-text-muted)' }}>
                    Promijenite svoju lozinku kako biste zaštitili račun.
                </p>

                {isSocialUser ? (
                    <div
                        className="rounded-xl p-6 text-center"
                        style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)' }}
                    >
                        <Lock size={28} className="mx-auto mb-3" style={{ color: 'var(--db-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--db-text-muted)' }}>
                            Prijavljeni ste putem Google računa. Lozinku možete promijeniti u postavkama svog Google računa.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: 'var(--db-text-muted)' }}>Trenutna lozinka</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--db-text-muted)' }} />
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none transition-all focus:ring-1 focus:ring-white/20"
                                    style={inputStyle}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: 'var(--db-text-muted)' }}>Nova lozinka</label>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--db-text-muted)' }} />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none transition-all focus:ring-1 focus:ring-white/20"
                                    style={inputStyle}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: 'var(--db-text-muted)' }}>Potvrdi novu lozinku</label>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--db-text-muted)' }} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none transition-all focus:ring-1 focus:ring-white/20"
                                    style={inputStyle}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 hover:scale-105 flex items-center gap-2"
                            style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                        >
                            {loading ? <><ButtonLoader size={14} /> Spremam...</> : "Spremi promjene"}
                        </button>
                    </form>
                )}
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <h3 className="text-base font-bold mb-1 text-red-400">Opasna zona</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--db-text-muted)' }}>
                    Odjavom ćete biti preusmjereni na početnu stranicu.
                </p>
                <button
                    onClick={logout}
                    className="text-sm font-semibold px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                    Odjavi se
                </button>
            </div>
        </div>
    );
}
