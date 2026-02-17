"use client";

import { useState, useEffect } from "react";
import { Globe, ExternalLink, Copy, Check, Loader2, AlertTriangle, Trash2, Rocket, CloudOff, Link2 } from "lucide-react";

export default function SettingsPage({ params }) {
    const [projectId, setProjectId] = useState(null);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [unpublishing, setUnpublishing] = useState(false);
    const [addingDomain, setAddingDomain] = useState(false);
    const [removingDomain, setRemovingDomain] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [customDomainInput, setCustomDomainInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        async function init() {
            const p = await params;
            setProjectId(p.id);
            await fetchStatus(p.id);
        }
        init();
    }, [params]);

    async function fetchStatus(id) {
        try {
            setLoading(true);
            const res = await fetch(`/api/domains?projectId=${id || projectId}`);
            const data = await res.json();
            if (res.ok) {
                setStatus(data);
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Greška pri dohvaćanju statusa");
        } finally {
            setLoading(false);
        }
    }

    async function handlePublish() {
        setPublishing(true);
        setError(null);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "publish" }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess("Stranica je objavljena!");
                await fetchStatus();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Greška pri objavljivanju");
        } finally {
            setPublishing(false);
        }
    }

    async function handleUnpublish() {
        if (!confirm("Jesi li siguran da želiš ukloniti stranicu s interneta?")) return;
        setUnpublishing(true);
        setError(null);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "unpublish" }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess("Stranica je uklonjena.");
                await fetchStatus();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Greška pri uklanjanju");
        } finally {
            setUnpublishing(false);
        }
    }

    async function handleAddCustomDomain(e) {
        e.preventDefault();
        if (!customDomainInput.trim()) return;
        setAddingDomain(true);
        setError(null);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "add-custom-domain", customDomain: customDomainInput.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess("Domena je dodana! Postavi DNS zapis.");
                setCustomDomainInput("");
                await fetchStatus();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Greška pri dodavanju domene");
        } finally {
            setAddingDomain(false);
        }
    }

    async function handleRemoveCustomDomain() {
        if (!confirm("Ukloniti custom domenu?")) return;
        setRemovingDomain(true);
        setError(null);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "remove-custom-domain" }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess("Custom domena je uklonjena.");
                await fetchStatus();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Greška");
        } finally {
            setRemovingDomain(false);
        }
    }

    async function handleVerifyDomain() {
        setVerifying(true);
        setError(null);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "verify-domain" }),
            });
            const data = await res.json();
            if (res.ok) {
                if (data.verified) {
                    setSuccess("Domena je verificirana! ✓");
                } else {
                    setError("Domena još nije verificirana. Provjeri DNS zapise.");
                }
                await fetchStatus();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Greška pri verifikaciji");
        } finally {
            setVerifying(false);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-10">
            <h1 className="text-2xl font-bold text-white mb-2">Postavke</h1>
            <p className="text-zinc-400 mb-8 text-sm">Objavi stranicu i upravljaj domenama</p>

            {/* Error/Success messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Check size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm">{success}</p>
                </div>
            )}

            {/* ─── Publish Section ─── */}
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                        <Rocket size={20} className="text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Objavljivanje</h2>
                        <p className="text-zinc-500 text-sm">Objavi stranicu na privremenu domenu</p>
                    </div>
                </div>

                {status?.published ? (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Objavljeno
                            </span>
                        </div>

                        {status.subdomainUrl && (
                            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                                <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium mb-2">Privremena domena</p>
                                <div className="flex items-center gap-2">
                                    <Globe size={16} className="text-green-400 shrink-0" />
                                    <a
                                        href={status.subdomainUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-400 hover:text-green-300 text-sm font-mono truncate"
                                    >
                                        {status.subdomainUrl.replace('https://', '')}
                                    </a>
                                    <button
                                        onClick={() => copyToClipboard(status.subdomainUrl)}
                                        className="shrink-0 p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                                        title="Kopiraj URL"
                                    >
                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-zinc-400" />}
                                    </button>
                                    <a
                                        href={status.subdomainUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                                        title="Otvori stranicu"
                                    >
                                        <ExternalLink size={14} className="text-zinc-400" />
                                    </a>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUnpublish}
                            disabled={unpublishing}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-sm transition-colors disabled:opacity-50"
                        >
                            {unpublishing ? <Loader2 size={16} className="animate-spin" /> : <CloudOff size={16} />}
                            Ukloni s interneta
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                        {publishing ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                        {publishing ? "Objavljivanje..." : "Objavi stranicu"}
                    </button>
                )}
            </section>

            {/* ─── Custom Domain Section ─── */}
            {status?.published && (
                <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                            <Link2 size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Custom domena</h2>
                            <p className="text-zinc-500 text-sm">Poveži vlastitu domenu</p>
                        </div>
                    </div>

                    {status.customDomain ? (
                        <div>
                            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                                <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium mb-2">Povezana domena</p>
                                <div className="flex items-center gap-2 mb-3">
                                    <Globe size={16} className="text-blue-400 shrink-0" />
                                    <a
                                        href={status.customDomainUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm font-mono"
                                    >
                                        {status.customDomain}
                                    </a>
                                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.customDomainStatus?.configured ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                        {status.customDomainStatus?.configured ? '✓ Konfigurirana' : '⏳ Čeka DNS'}
                                    </span>
                                </div>

                                {!status.customDomainStatus?.configured && (
                                    <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 mb-3">
                                        <p className="text-zinc-400 text-xs font-medium mb-2">Postavi DNS zapise:</p>
                                        <div className="font-mono text-xs space-y-1">
                                            <div className="flex gap-4 text-zinc-300">
                                                <span className="text-zinc-500 w-10">A</span>
                                                <span className="text-zinc-500 w-8">@</span>
                                                <span>76.76.21.21</span>
                                            </div>
                                            <div className="flex gap-4 text-zinc-300">
                                                <span className="text-zinc-500 w-10">CNAME</span>
                                                <span className="text-zinc-500 w-8">www</span>
                                                <span>cname.vercel-dns.com</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleVerifyDomain}
                                        disabled={verifying}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                        {verifying ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                        Provjeri DNS
                                    </button>
                                    <button
                                        onClick={handleRemoveCustomDomain}
                                        disabled={removingDomain}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                        {removingDomain ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                        Ukloni
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAddCustomDomain} className="flex gap-2">
                            <input
                                type="text"
                                value={customDomainInput}
                                onChange={(e) => setCustomDomainInput(e.target.value)}
                                placeholder="primjer.hr"
                                className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={addingDomain || !customDomainInput.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
                            >
                                {addingDomain ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                                Dodaj
                            </button>
                        </form>
                    )}
                </section>
            )}
        </div>
    );
}
