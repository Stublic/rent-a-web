"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail, Lock, Chrome } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await authClient.signIn.email({
            email,
            password,
            callbackURL: "/dashboard",
        });

        if (error) {
            setError(error.message || "Neispravan email ili lozinka.");
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    const handleGoogleAuth = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/dashboard",
        });
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <img
                            src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png"
                            alt="Logo"
                            className="w-10 h-10 object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                        <span className="text-2xl font-extrabold text-white tracking-tight">Rent a Web</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Dobrodošli natrag</h1>
                    <p className="text-zinc-400">Nastavite graditi svoje online carstvo.</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 ml-1">Email adresa</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all"
                                    placeholder="ivan@primjer.hr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-medium text-zinc-400">Lozinka</label>
                                <Link href="/auth/forgot-password" virtual className="text-xs text-green-500 hover:underline">
                                    Izgubljena lozinka?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Prijavi se"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0c0c0e] px-2 text-zinc-500">Ili nastavi sa</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleAuth}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 border border-zinc-700"
                    >
                        <Chrome size={20} /> Google
                    </button>

                    <p className="text-center text-zinc-500 text-sm mt-8">
                        Nemaš račun?{" "}
                        <Link href="/auth/signup" className="text-green-500 hover:underline font-medium">
                            Registriraj se
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
