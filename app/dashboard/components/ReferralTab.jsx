"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check, Users, Coins, Share2, Loader2 } from "lucide-react";
import { TabLoader } from "./DashboardLoader";
import { useToast } from "./ToastProvider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rentawebica.hr";

export default function ReferralTab() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetch("/api/referral/stats")
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load referral stats:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <TabLoader text="Učitavanje programa preporuka..." />;
    }

    const referralUrl = stats?.referralCode
        ? `${APP_URL}/?ref=${stats.referralCode}`
        : "";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            toast.success("Link kopiran u međuspremnik!");
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error("Kopiranje nije uspjelo. Pokušajte ručno.");
        }
    };

    const handleWhatsApp = () => {
        const message = `Hej! 👋 Kreiraj svoju web stranicu na Rent a webica i oboje dobivamo 5.000 AI tokena potpuno besplatno! 🎁\n\n${referralUrl}`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(message)}`,
            "_blank"
        );
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Hero Section */}
            <div
                className="relative overflow-hidden rounded-2xl p-8 md:p-10"
                style={{
                    background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.08) 100%)",
                    border: "1px solid rgba(139,92,246,0.2)",
                }}
            >
                {/* Decorative glow */}
                <div
                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[100px] pointer-events-none"
                    style={{ background: "rgba(139,92,246,0.25)" }}
                />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                            }}
                        >
                            <Gift size={24} className="text-white" />
                        </div>
                        <div>
                            <span
                                className="text-xs font-semibold uppercase tracking-widest"
                                style={{ color: "var(--db-accent, #a78bfa)" }}
                            >
                                Program preporuka
                            </span>
                        </div>
                    </div>

                    <h1
                        className="text-2xl md:text-3xl font-extrabold mb-3"
                        style={{ color: "var(--db-heading)" }}
                    >
                        Pokloni 5.000 tokena,{" "}
                        <span
                            style={{
                                background: "linear-gradient(135deg, #8b5cf6, #c084fc)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            dobij 5.000 tokena!
                        </span>
                    </h1>

                    <p
                        className="text-sm md:text-base leading-relaxed max-w-xl"
                        style={{ color: "var(--db-text-secondary)" }}
                    >
                        Podijeli svoj jedinstveni link s prijateljima. Kada kreiraju svoju
                        web stranicu, oboje dobivate{" "}
                        <strong style={{ color: "var(--db-heading)" }}>
                            5.000 AI tokena
                        </strong>{" "}
                        potpuno besplatno.
                    </p>
                </div>
            </div>

            {/* Referral Link Section */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: "var(--db-surface)",
                    border: "1px solid var(--db-border)",
                }}
            >
                <h3
                    className="text-sm font-semibold mb-4 uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                >
                    Tvoj referalni link
                </h3>

                <div className="flex gap-2">
                    <input
                        type="text"
                        readOnly
                        value={referralUrl}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-mono outline-none"
                        style={{
                            background: "var(--db-input-bg, var(--db-bg))",
                            border: "1px solid var(--db-input-border, var(--db-border))",
                            color: "var(--db-heading)",
                        }}
                        onClick={(e) => e.target.select()}
                    />
                    <button
                        onClick={handleCopy}
                        className="px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                        style={{
                            background: copied
                                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                            color: "white",
                            boxShadow: copied
                                ? "0 4px 12px rgba(34,197,94,0.3)"
                                : "0 4px 12px rgba(139,92,246,0.3)",
                        }}
                    >
                        {copied ? (
                            <>
                                <Check size={16} /> Kopirano!
                            </>
                        ) : (
                            <>
                                <Copy size={16} /> Kopiraj
                            </>
                        )}
                    </button>
                </div>

                {/* Share buttons */}
                <div className="flex flex-wrap gap-3 mt-5">
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                        style={{
                            background: "linear-gradient(135deg, #25D366, #128C7E)",
                            color: "white",
                            boxShadow: "0 4px 12px rgba(37,211,102,0.25)",
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Podijeli na WhatsApp
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                        style={{
                            background: "var(--db-surface-hover)",
                            border: "1px solid var(--db-border)",
                            color: "var(--db-heading)",
                        }}
                    >
                        <Share2 size={16} />
                        Kopiraj link
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Friends Invited */}
                <div
                    className="rounded-2xl p-6 relative overflow-hidden"
                    style={{
                        background: "var(--db-surface)",
                        border: "1px solid var(--db-border)",
                    }}
                >
                    <div
                        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[40px] pointer-events-none"
                        style={{ background: "rgba(139,92,246,0.15)" }}
                    />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{
                                    background: "rgba(139,92,246,0.12)",
                                    border: "1px solid rgba(139,92,246,0.2)",
                                }}
                            >
                                <Users
                                    size={18}
                                    style={{ color: "var(--db-accent, #a78bfa)" }}
                                />
                            </div>
                            <span
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{ color: "var(--db-text-muted)" }}
                            >
                                Dovedeni prijatelji
                            </span>
                        </div>
                        <div
                            className="text-4xl font-extrabold"
                            style={{ color: "var(--db-heading)" }}
                        >
                            {stats?.referralsCount ?? 0}
                        </div>
                        <p
                            className="text-xs mt-1"
                            style={{ color: "var(--db-text-muted)" }}
                        >
                            {stats?.referralsCount === 0
                                ? "Pošalji svoj referral link kako bi zaradio 5000 tokena"
                                : "Odlično! Nastavi tako!"}
                        </p>
                    </div>
                </div>

                {/* Tokens Earned */}
                <div
                    className="rounded-2xl p-6 relative overflow-hidden"
                    style={{
                        background: "var(--db-surface)",
                        border: "1px solid var(--db-border)",
                    }}
                >
                    <div
                        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[40px] pointer-events-none"
                        style={{ background: "rgba(34,197,94,0.12)" }}
                    />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{
                                    background: "rgba(34,197,94,0.12)",
                                    border: "1px solid rgba(34,197,94,0.2)",
                                }}
                            >
                                <Coins
                                    size={18}
                                    style={{ color: "var(--db-accent-green, #22c55e)" }}
                                />
                            </div>
                            <span
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{ color: "var(--db-text-muted)" }}
                            >
                                Zarađeni tokeni
                            </span>
                        </div>
                        <div
                            className="text-4xl font-extrabold"
                            style={{ color: "var(--db-heading)" }}
                        >
                            {(stats?.tokensEarned ?? 0).toLocaleString("hr-HR")}
                        </div>
                        <p
                            className="text-xs mt-1"
                            style={{ color: "var(--db-text-muted)" }}
                        >
                            5.000 tokena po svakoj preporuci
                        </p>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: "var(--db-surface)",
                    border: "1px solid var(--db-border)",
                }}
            >
                <h3
                    className="text-sm font-semibold mb-5 uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                >
                    Kako funkcionira?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        {
                            step: "1",
                            title: "Podijeli link",
                            desc: "Kopiraj svoj jedinstveni referalni link i pošalji ga prijateljima.",
                            color: "#8b5cf6",
                        },
                        {
                            step: "2",
                            title: "Prijatelj se registrira",
                            desc: "Kada tvoj prijatelj kreira web stranicu, sustav automatski prepoznaje preporuku.",
                            color: "#6366f1",
                        },
                        {
                            step: "3",
                            title: "Oboje dobivate tokene",
                            desc: "Ti dobivaš 5.000 tokena, a tvoj prijatelj također dobiva 5.000 tokena. 🎁",
                            color: "#22c55e",
                        },
                    ].map(({ step, title, desc, color }) => (
                        <div key={step} className="flex gap-4">
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                                    boxShadow: `0 2px 8px ${color}33`,
                                }}
                            >
                                {step}
                            </div>
                            <div>
                                <h4
                                    className="text-sm font-semibold mb-1"
                                    style={{ color: "var(--db-heading)" }}
                                >
                                    {title}
                                </h4>
                                <p
                                    className="text-xs leading-relaxed"
                                    style={{ color: "var(--db-text-muted)" }}
                                >
                                    {desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
