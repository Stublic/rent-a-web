"use client";

import { useState, useEffect } from "react";
import { Globe, ExternalLink, Copy, Check, Loader2, AlertTriangle, Trash2, Rocket, CloudOff, Link2, Mail, RefreshCw, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import { saveSeoSettingsAction } from "@/app/actions/seo-settings";
import { resetProjectAction } from "@/app/actions/reset-project";
import { useRouter } from 'next/navigation';
import { useToast } from "@/app/dashboard/components/ToastProvider";

const SETTINGS_TABS = [
    { id: 'publish', label: 'Objava', icon: Rocket },
    { id: 'domain', label: 'Domena', icon: Link2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'danger', label: 'Opasna zona', icon: AlertTriangle },
];

export default function SettingsPage({ params }) {
    const router = useRouter();
    const toast = useToast();
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
    const [contactEmail, setContactEmail] = useState("");
    const [savingEmail, setSavingEmail] = useState(false);
    const [republishing, setRepublishing] = useState(false);
    const [hasUnpushedChanges, setHasUnpushedChanges] = useState(false);
    const [activeTab, setActiveTab] = useState('publish');

    // Reset state
    const [projectName, setProjectName] = useState('');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetError, setResetError] = useState('');

    // SEO state
    const [planName, setPlanName] = useState('');
    const [subpageKeys, setSubpageKeys] = useState([]);
    const SEO_PAGES = [
        { key: 'home', label: 'Početna' },
        ...subpageKeys.filter(k => ['o-nama', 'usluge', 'kontakt'].includes(k)).map(k => ({
            key: k,
            label: k === 'o-nama' ? 'O nama' : k === 'usluge' ? 'Usluge' : k === 'kontakt' ? 'Kontakt' : k
        }))
    ];
    const [seoData, setSeoData] = useState({ pages: {}, favicon: '' });
    const [savingSeo, setSavingSeo] = useState(false);
    const [seoSuccess, setSeoSuccess] = useState(false);

    useEffect(() => {
        async function init() {
            const p = await params;
            setProjectId(p.id);
            await fetchStatus(p.id);
            // Load existing contactEmail + planName
            const res = await fetch(`/api/project-settings?projectId=${p.id}`);
            if (res.ok) {
                const d = await res.json();
                if (d.contactEmail) setContactEmail(d.contactEmail);
                if (d.planName) setPlanName(d.planName);
                if (d.projectName) setProjectName(d.projectName);
                if (d.subpageKeys) setSubpageKeys(d.subpageKeys);
                // Load existing SEO settings, pre-fill from AI-generated content
                if (d.seoSettings) {
                    // Merge autoSeo as defaults where seoSettings.pages doesn't have values
                    if (d.autoSeo) {
                        const mergedPages = { ...(d.seoSettings.pages || {}) };
                        for (const [page, auto] of Object.entries(d.autoSeo)) {
                            if (!mergedPages[page]) mergedPages[page] = {};
                            if (!mergedPages[page].title && auto.title) mergedPages[page].title = auto.title;
                            if (!mergedPages[page].description && auto.description) mergedPages[page].description = auto.description;
                        }
                        setSeoData({ ...d.seoSettings, pages: mergedPages });
                    } else {
                        setSeoData(d.seoSettings);
                    }
                } else if (d.autoSeo) {
                    // No seoSettings saved yet, use autoSeo as initial values
                    const pages = {};
                    for (const [page, auto] of Object.entries(d.autoSeo)) {
                        pages[page] = { title: auto.title || '', description: auto.description || '' };
                    }
                    setSeoData(prev => ({ ...prev, pages }));
                }
            }
            // Auto-fix contact form for legacy projects (silently)
            fetch('/api/fix-contact-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: p.id }),
            }).then(r => r.json()).then(d => {
                if (d.success) console.log('[Settings] Contact form injected into legacy HTML');
            }).catch(() => {});
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
                setHasUnpushedChanges(data.hasUnpushedChanges ?? false);
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("Greška pri dohvaćanju statusa");
        } finally {
            setLoading(false);
        }
    }

    async function handlePublish() {
        setPublishing(true);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "publish" }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Stranica je objavljena!");
                await fetchStatus();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("Greška pri objavljivanju");
        } finally {
            setPublishing(false);
        }
    }

    async function handleUnpublish() {
        if (!confirm("Jesi li siguran da želiš ukloniti stranicu s interneta?")) return;
        setUnpublishing(true);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "unpublish" }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Stranica je uklonjena.");
                await fetchStatus();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("Greška pri uklanjanju");
        } finally {
            setUnpublishing(false);
        }
    }

    async function handleAddCustomDomain(e) {
        e.preventDefault();
        if (!customDomainInput.trim()) return;
        setAddingDomain(true);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "add-custom-domain", customDomain: customDomainInput.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Domena je dodana! Postavi DNS zapis.");
                setCustomDomainInput("");
                await fetchStatus();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("Greška pri dodavanju domene");
        } finally {
            setAddingDomain(false);
        }
    }

    async function handleRemoveCustomDomain() {
        if (!confirm("Ukloniti custom domenu?")) return;
        setRemovingDomain(true);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "remove-custom-domain" }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Custom domena je uklonjena.");
                await fetchStatus();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("Greška");
        } finally {
            setRemovingDomain(false);
        }
    }

    async function handleVerifyDomain() {
        setVerifying(true);
        try {
            const res = await fetch("/api/domains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, action: "verify-domain" }),
            });
            const data = await res.json();
            if (res.ok) {
                if (data.verified) {
                    toast.success("Domena je verificirana! ✓");
                } else {
                    toast.error("Domena još nije verificirana. Provjeri DNS zapise.");
                }
                await fetchStatus();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("Greška pri verifikaciji");
        } finally {
            setVerifying(false);
        }
    }

    async function handleRepublish() {
        setRepublishing(true);
        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, action: 'republish' }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Promjene su objavljene na stranici!');
                setHasUnpushedChanges(false);
                await fetchStatus(projectId);
            } else {
                toast.error(data.error);
            }
        } catch { toast.error('Greška pri ažuriranju'); }
        finally { setRepublishing(false); }
    }

    async function handleSaveContactEmail(e) {
        e.preventDefault();
        setSavingEmail(true);
        try {
            const res = await fetch('/api/project-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, contactEmail: contactEmail.trim() || null }),
            });
            const data = await res.json();
            if (res.ok) toast.success('Email za upite je ažuriran!');
            else toast.error(data.error);
        } catch { toast.error('Greška pri spremanju'); }
        finally { setSavingEmail(false); }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    // SEO helpers
    function updateSeoPage(page, field, value) {
        setSeoData(prev => ({
            ...prev,
            pages: {
                ...prev.pages,
                [page]: { ...(prev.pages?.[page] || {}), [field]: value }
            }
        }));
    }

    async function handleSaveSeo() {
        if (!projectId) return;
        setSavingSeo(true);
        setSeoSuccess(false);
        const result = await saveSeoSettingsAction(projectId, seoData);
        setSavingSeo(false);
        if (result.success) {
            setSeoSuccess(true);
            setTimeout(() => setSeoSuccess(false), 3000);
        } else {
            toast.error(result.error);
        }
    }

    async function handleSeoImageUpload(e, page, field) {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        try {
            const res = await fetch('/api/media', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok && data.media) {
                if (field === 'favicon') {
                    setSeoData(prev => ({ ...prev, favicon: data.media.url }));
                } else {
                    updateSeoPage(page, field, data.media.url);
                }
            }
        } catch {}
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
            <p className="text-zinc-400 mb-6 text-sm">Objavi stranicu i upravljaj postavkama</p>

            {/* ─── Sub-tab Navigation ─── */}
            <div className="settings-tabs mb-6">
                {SETTINGS_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    // Hide domain tab if not published
                    if (tab.id === 'domain' && !status?.published) return null;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`settings-tab ${isActive ? 'settings-tab-active' : ''}`}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ─── Tab Content ─── */}
            <div className="db-fade-in" key={activeTab}>

                {/* ═══ PUBLISH TAB ═══ */}
                {activeTab === 'publish' && (
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
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
                                    {hasUnpushedChanges && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                                            <AlertCircle size={11} />
                                            Ima nepushanih promjena
                                        </span>
                                    )}
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

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {hasUnpushedChanges && (
                                        <button
                                            onClick={handleRepublish}
                                            disabled={republishing}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-sm transition-colors disabled:opacity-50"
                                        >
                                            {republishing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                            Ažuriraj promjene
                                        </button>
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
                )}

                {/* ═══ DOMAIN TAB ═══ */}
                {activeTab === 'domain' && status?.published && (
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

                {/* ═══ EMAIL TAB ═══ */}
                {activeTab === 'email' && (
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                                <Mail size={20} className="text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Email za upite</h2>
                                <p className="text-zinc-500 text-sm">Kamo idu upiti s kontakt forme na vašoj stranici</p>
                            </div>
                        </div>
                        <form onSubmit={handleSaveContactEmail} className="space-y-3">
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={e => setContactEmail(e.target.value)}
                                placeholder="info@mojbiznis.hr (ostavite prazno za vaš registracijski email)"
                                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={savingEmail}
                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
                            >
                                {savingEmail ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Spremi email
                            </button>
                        </form>
                    </section>
                )}

                {/* ═══ SEO TAB ═══ */}
                {activeTab === 'seo' && (
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                <Globe size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">SEO Postavke</h2>
                                <p className="text-zinc-500 text-sm">Meta naslovi, opisi, slike za dijeljenje i favicon</p>
                            </div>
                        </div>

                        {/* Favicon */}
                        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-5">
                            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
                                <ImageIcon size={14} className="text-zinc-500" /> Site Icon (Favicon)
                            </label>
                            <div className="flex items-center gap-4">
                                {seoData.favicon ? (
                                    <div className="relative">
                                        <img src={seoData.favicon} alt="Favicon" className="w-12 h-12 rounded-lg object-cover border border-zinc-700" />
                                        <button type="button" onClick={() => setSeoData(prev => ({ ...prev, favicon: '' }))}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
                                        <ImageIcon size={16} className="text-zinc-600" />
                                    </div>
                                )}
                                <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm text-zinc-300 font-medium transition-colors">
                                    <Upload size={14} className="inline mr-2" />Upload favicon
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleSeoImageUpload(e, null, 'favicon')} />
                                </label>
                                <p className="text-xs text-zinc-500">Idealno 32x32 ili 512x512 px</p>
                            </div>
                        </div>

                        {/* Per-page SEO */}
                        <div className="space-y-4">
                            {SEO_PAGES.map(page => {
                                const pageData = seoData.pages?.[page.key] || {};
                                return (
                                    <div key={page.key} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs">{page.label}</span>
                                            SEO
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-zinc-400 flex justify-between mb-1">
                                                    <span>Meta Naslov</span>
                                                    <span className={`${(pageData.title?.length || 0) > 60 ? 'text-red-400' : ''}`}>{pageData.title?.length || 0}/60</span>
                                                </label>
                                                <input
                                                    type="text" maxLength={70}
                                                    value={pageData.title || ''}
                                                    onChange={e => updateSeoPage(page.key, 'title', e.target.value)}
                                                    placeholder={`Naslov za stranicu "${page.label}"`}
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 flex justify-between mb-1">
                                                    <span>Meta Opis</span>
                                                    <span className={`${(pageData.description?.length || 0) > 160 ? 'text-red-400' : ''}`}>{pageData.description?.length || 0}/160</span>
                                                </label>
                                                <textarea
                                                    rows={2} maxLength={170}
                                                    value={pageData.description || ''}
                                                    onChange={e => updateSeoPage(page.key, 'description', e.target.value)}
                                                    placeholder={`Kratki opis za Google rezultate (${page.label})`}
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-400 mb-1 block">OG:Image (slika za dijeljenje)</label>
                                                <div className="flex items-center gap-3">
                                                    {pageData.ogImage ? (
                                                        <div className="relative">
                                                            <img src={pageData.ogImage} alt="OG" className="w-20 h-12 rounded-lg object-cover border border-zinc-700" />
                                                            <button type="button" onClick={() => updateSeoPage(page.key, 'ogImage', '')}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5">
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-20 h-12 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
                                                            <ImageIcon size={14} className="text-zinc-600" />
                                                        </div>
                                                    )}
                                                    <label className="cursor-pointer px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400 font-medium transition-colors">
                                                        <Upload size={12} className="inline mr-1.5" />Upload
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleSeoImageUpload(e, page.key, 'ogImage')} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Save SEO button */}
                        <div className="mt-5 flex items-center gap-3">
                            <button
                                onClick={handleSaveSeo}
                                disabled={savingSeo}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
                            >
                                {savingSeo ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Spremi SEO postavke
                            </button>
                            {seoSuccess && (
                                <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5">
                                    <Check size={14} /> Spremljeno!
                                </span>
                            )}
                        </div>
                    </section>
                )}

                {/* ═══ DANGER ZONE TAB ═══ */}
                {activeTab === 'danger' && (
                    <section className="rounded-2xl p-6" style={{ background: 'var(--lp-bg-alt)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <h2 className="text-base font-semibold text-red-400 flex items-center gap-2 mb-1">
                            <AlertTriangle size={18} />
                            Opasna zona
                        </h2>
                        <p className="text-sm text-zinc-400 mb-4">
                            Resetiranje projekta trajno briše sve podatke i ne može se poništiti.
                        </p>

                        {!showResetConfirm ? (
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                Resetiraj projekt
                            </button>
                        ) : (
                            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div className="text-sm space-y-2">
                                    <p className="text-zinc-300 font-medium">⚠️ Jeste li sigurni? Ova radnja:</p>
                                    <ul className="text-zinc-400 space-y-1 ml-4 list-disc">
                                        <li>Trajno briše generiranu stranicu i sve podstranice</li>
                                        <li>Briše sve blog članke i kategorije</li>
                                        <li>Briše sve kontakt poruke i medije</li>
                                        <li>Resetira sve postavke projekta</li>
                                        <li>Pretplata ostaje aktivna — možete generirati novu stranicu</li>
                                    </ul>
                                    <p className="text-yellow-400 font-medium mt-2">
                                        💰 Generiranje nove stranice košta {planName.toLowerCase().includes('advanced') || planName.toLowerCase().includes('growth') ? '1000' : '500'} tokena
                                        ({planName.toLowerCase().includes('advanced') || planName.toLowerCase().includes('growth') ? 'Advanced' : 'Starter'} paket)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1.5">
                                        Za potvrdu upišite: <strong className="text-zinc-300">obriši {projectName}</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={resetConfirmText}
                                        onChange={(e) => { setResetConfirmText(e.target.value); setResetError(''); }}
                                        placeholder={`obriši ${projectName}`}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500/50"
                                    />
                                </div>

                                {resetError && (
                                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                                        <AlertCircle size={12} />{resetError}
                                    </p>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            setResetting(true);
                                            setResetError('');
                                            try {
                                                const result = await resetProjectAction(projectId, resetConfirmText);
                                                if (result.error) {
                                                    if (result.insufficientTokens) {
                                                        setResetError(`Nemate dovoljno tokena. Potrebno: ${result.tokensNeeded}, Preostalo: ${result.tokensRemaining}`);
                                                    } else {
                                                        setResetError(result.error);
                                                    }
                                                } else {
                                                    router.push('/dashboard');
                                                }
                                            } catch (e) {
                                                setResetError('Greška pri resetiranju.');
                                            } finally {
                                                setResetting(false);
                                            }
                                        }}
                                        disabled={resetting || resetConfirmText.toLowerCase().trim() !== `obriši ${projectName}`.toLowerCase()}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                                    >
                                        {resetting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        {resetting ? 'Resetiranje...' : 'Potvrdi resetiranje'}
                                    </button>
                                    <button
                                        onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); setResetError(''); }}
                                        className="px-4 py-2 text-zinc-400 hover:text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Odustani
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
