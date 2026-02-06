"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setError("Nevažeći ili nedostajući token za resetiranje.");
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Lozinke se ne podudaraju.");
            return;
        }

        setLoading(true);
        setError("");

        const { error } = await authClient.resetPassword({
            newPassword: password,
            token: token,
        });

        if (error) {
            setError(error.message || "Link za resetiranje je istekao ili je nevažeći.");
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push("/auth/login");
            }, 3000);
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
                    <h1 className="text-3xl font-bold text-white mb-2">Postavi novu lozinku</h1>
                    <p className="text-zinc-400">Sigurnost vašeg računa nam je na prvom mjestu.</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Lozinka promijenjena!</h3>
                            <p className="text-zinc-400 mb-8">Uspješno ste postavili novu lozinku. Preusmjeravamo vas na prijavu...</p>
                            <Loader2 className="animate-spin text-green-500 mx-auto" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 ml-1">Nova lozinka</label>
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 ml-1">Potvrdi novu lozinku</label>
                                <div className="relative">
                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${confirmPassword && password === confirmPassword ? 'text-green-500' : 'text-zinc-500'}`} size={18} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={`w-full bg-zinc-900/50 border ${confirmPassword && password === confirmPassword ? 'border-green-500/50' : 'border-zinc-800'} rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all`}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Promijeni lozinku"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
