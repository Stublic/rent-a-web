"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await authClient.requestPasswordReset({
            email,
            redirectTo: "/auth/reset-password",
        });

        if (error) {
            setError(error.message || "Došlo je do greške. Pokušajte ponovno.");
        } else {
            setSuccess(true);
        }
        setLoading(false);
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
                    <h1 className="text-3xl font-bold text-white mb-2">Zaboravljena lozinka?</h1>
                    <p className="text-zinc-400">Unesite email adresu i poslat ćemo vam link za resetiranje.</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Email je poslan!</h3>
                            <p className="text-zinc-400 mb-8">Provjerite svoj Inbox (i Spam folder) za upute o resetiranju lozinke.</p>
                            <Link href="/auth/login" className="text-green-500 hover:underline font-bold flex items-center justify-center gap-2">
                                <ArrowLeft size={16} /> Povratak na prijavu
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Pošalji link"}
                            </button>

                            <Link href="/auth/login" className="text-zinc-500 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                <ArrowLeft size={16} /> Povratak na prijavu
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
