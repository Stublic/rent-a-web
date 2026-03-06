"use client";

import { useState, useEffect } from "react";
import { Globe, ExternalLink, Copy, Check, Loader2, AlertTriangle, Trash2, Rocket, CloudOff, Link2, Mail, RefreshCw, AlertCircle, Upload, Image as ImageIcon, Crown, Download, Shield, Server, CalendarClock, CreditCard, XCircle } from "lucide-react";
import { saveSeoSettingsAction } from "@/app/actions/seo-settings";
import { resetProjectAction } from "@/app/actions/reset-project";
import { useRouter } from 'next/navigation';
import { useToast } from "@/app/dashboard/components/ToastProvider";
import InfoTooltip from "@/components/InfoTooltip";

const SETTINGS_TABS = [
    { id: 'publish', label: 'Objava', icon: Rocket },
    { id: 'domain', label: 'Domena', icon: Link2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'buyout', label: 'Otkup', icon: Crown },
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

    // Buyout state
    const [buyoutStatus, setBuyoutStatus] = useState('NONE');
    const [buyoutLoading, setBuyoutLoading] = useState(null);
    const [maintenanceInfo, setMaintenanceInfo] = useState(null);
    const [cancellingMaintenance, setCancellingMaintenance] = useState(false);
    const [showMaintenanceCancelConfirm, setShowMaintenanceCancelConfirm] = useState(false);

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
                if (d.buyoutStatus) setBuyoutStatus(d.buyoutStatus);
                if (d.projectName) setProjectName(d.projectName);
                if (d.subpageKeys) setSubpageKeys(d.subpageKeys);
                if (d.maintenanceInfo) setMaintenanceInfo(d.maintenanceInfo);
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
                <Loader2 className="animate-spin text-[color:var(--db-text-muted)]" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-10">
            <h1 className="text-2xl font-bold text-white mb-2">Postavke</h1>
            <p className="text-[color:var(--db-text-muted)] mb-6 text-sm">Objavi stranicu i upravljaj postavkama</p>

            {/* ─── Sub-tab Navigation ─── */}
            <div className="settings-tabs mb-6">
                {SETTINGS_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    // Hide domain tab if not published
                    if (tab.id === 'domain' && !status?.published) return null;
                    // Show 'Pretplata' tab for MAINTAINED, or 'Otkup' for eligible NONE
                    if (tab.id === 'buyout') {
                        if (buyoutStatus === 'MAINTAINED') {
                            // Show as subscription tab
                            return (
                                <button
                                    key="maintenance"
                                    onClick={() => setActiveTab('buyout')}
                                    className={`settings-tab ${isActive ? 'settings-tab-active' : ''}`}
                                    title="Pretplata"
                                >
                                    <CreditCard size={14} />
                                    <span className="hidden sm:inline">Pretplata</span>
                                </button>
                            );
                        }
                        if (buyoutStatus !== 'NONE') return null;
                        const pn = planName.toLowerCase();
                        if (!pn.includes('starter') && !pn.includes('advanced') && !pn.includes('growth')) return null;
                    }
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`settings-tab ${isActive ? 'settings-tab-active' : ''}`}
                            title={tab.label}
                        >
                            <Icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ─── Tab Content ─── */}
            <div className="db-fade-in" key={activeTab}>

                {/* ═══ PUBLISH TAB ═══ */}
                {activeTab === 'publish' && (
                    <section className="db-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                                <Rocket size={20} className="text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Objavljivanje</h2>
                                <p className="text-[color:var(--db-text-muted)] text-sm">Objavi stranicu na privremenu domenu</p>
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
                                    <div className="db-card rounded-xl p-4 mb-4">
                                        <p className="text-[color:var(--db-text-muted)] text-xs uppercase tracking-wider font-medium mb-2">Privremena domena</p>
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
                                                className="shrink-0 p-1.5 hover:bg-[color:var(--db-surface-hover)] rounded-lg transition-colors"
                                                title="Kopiraj URL"
                                            >
                                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-[color:var(--db-text-muted)]" />}
                                            </button>
                                            <a
                                                href={status.subdomainUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 p-1.5 hover:bg-[color:var(--db-surface-hover)] rounded-lg transition-colors"
                                                title="Otvori stranicu"
                                            >
                                                <ExternalLink size={14} className="text-[color:var(--db-text-muted)]" />
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
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-[color:var(--db-surface-hover)] border border-[color:var(--db-border)] text-[color:var(--db-text-secondary)] rounded-xl text-sm transition-colors disabled:opacity-50"
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
                    <section className="db-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                                <Link2 size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    Custom domena
                                    <InfoTooltip text="Povežite vlastitu domenu (npr. www.moj-biznis.hr) umjesto privremene .webica.hr adrese. Potrebno je podesiti DNS zapise kod vašeg pružatelja domene." side="bottom" />
                                </h2>
                                <p className="text-[color:var(--db-text-muted)] text-sm">Poveži vlastitu domenu</p>
                            </div>
                        </div>

                        {status.customDomain ? (
                            <div>
                                <div className="db-card rounded-xl p-4 mb-4">
                                    <p className="text-[color:var(--db-text-muted)] text-xs uppercase tracking-wider font-medium mb-2">Povezana domena</p>
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
                                        <div className="bg-zinc-900/80 border border-[color:var(--db-border)]/50 rounded-lg p-3 mb-3">
                                            <p className="text-[color:var(--db-text-muted)] text-xs font-medium mb-2">Postavi DNS zapise:</p>
                                            <div className="font-mono text-xs space-y-1">
                                                <div className="flex gap-4 text-[color:var(--db-text-secondary)]">
                                                    <span className="text-[color:var(--db-text-muted)] w-10">A</span>
                                                    <span className="text-[color:var(--db-text-muted)] w-8">@</span>
                                                    <span>76.76.21.21</span>
                                                </div>
                                                <div className="flex gap-4 text-[color:var(--db-text-secondary)]">
                                                    <span className="text-[color:var(--db-text-muted)] w-10">CNAME</span>
                                                    <span className="text-[color:var(--db-text-muted)] w-8">www</span>
                                                    <span>cname.vercel-dns.com</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleVerifyDomain}
                                            disabled={verifying}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-[color:var(--db-surface-hover)] text-zinc-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
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
                                    className="flex-1 px-4 py-2.5 bg-zinc-800 border border-[color:var(--db-border)] rounded-xl text-white text-sm placeholder:text-[color:var(--db-text-muted)] focus:outline-none focus:border-blue-500 transition-colors"
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
                    <section className="db-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                                <Mail size={20} className="text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Email za upite</h2>
                                <p className="text-[color:var(--db-text-muted)] text-sm">Kamo idu upiti s kontakt forme na vašoj stranici</p>
                            </div>
                        </div>
                        <form onSubmit={handleSaveContactEmail} className="space-y-3">
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={e => setContactEmail(e.target.value)}
                                placeholder="info@mojbiznis.hr (ostavite prazno za vaš registracijski email)"
                                className="w-full px-4 py-2.5 bg-zinc-800 border border-[color:var(--db-border)] rounded-xl text-white text-sm placeholder:text-[color:var(--db-text-muted)] focus:outline-none focus:border-violet-500 transition-colors"
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
                    <section className="db-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                <Globe size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">SEO Postavke</h2>
                                <p className="text-[color:var(--db-text-muted)] text-sm">Meta naslovi, opisi, slike za dijeljenje i favicon</p>
                            </div>
                        </div>

                        {/* Favicon */}
                        <div className="db-card rounded-xl p-4 mb-5">
                            <label className="text-sm font-medium text-[color:var(--db-text-secondary)] flex items-center gap-2 mb-3">
                                <ImageIcon size={14} className="text-[color:var(--db-text-muted)]" /> Site Icon (Favicon)
                            </label>
                            <div className="flex items-center gap-4">
                                {seoData.favicon ? (
                                    <div className="relative">
                                        <img src={seoData.favicon} alt="Favicon" className="w-12 h-12 rounded-lg object-cover border border-[color:var(--db-border)]" />
                                        <button type="button" onClick={() => setSeoData(prev => ({ ...prev, favicon: '' }))}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-zinc-800 border-2 border-dashed border-[color:var(--db-border)] rounded-lg flex items-center justify-center">
                                        <ImageIcon size={16} className="text-zinc-600" />
                                    </div>
                                )}
                                <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-[color:var(--db-surface-hover)] border border-[color:var(--db-border)] rounded-xl text-sm text-[color:var(--db-text-secondary)] font-medium transition-colors">
                                    <Upload size={14} className="inline mr-2" />Upload favicon
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleSeoImageUpload(e, null, 'favicon')} />
                                </label>
                                <p className="text-xs text-[color:var(--db-text-muted)]">Idealno 32x32 ili 512x512 px</p>
                            </div>
                        </div>

                        {/* Per-page SEO */}
                        <div className="space-y-4">
                            {SEO_PAGES.map(page => {
                                const pageData = seoData.pages?.[page.key] || {};
                                return (
                                    <div key={page.key} className="db-card rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs">{page.label}</span>
                                            SEO
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-[color:var(--db-text-muted)] flex justify-between mb-1">
                                                    <span>Meta Naslov</span>
                                                    <span className={`${(pageData.title?.length || 0) > 60 ? 'text-red-400' : ''}`}>{pageData.title?.length || 0}/60</span>
                                                </label>
                                                <input
                                                    type="text" maxLength={70}
                                                    value={pageData.title || ''}
                                                    onChange={e => updateSeoPage(page.key, 'title', e.target.value)}
                                                    placeholder={`Naslov za stranicu "${page.label}"`}
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-[color:var(--db-border)] rounded-lg text-white text-sm placeholder:text-[color:var(--db-text-muted)] focus:outline-none focus:border-emerald-500"
                                                />
                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--db-text-muted, #71717a)' }}>Naslov koji se prikazuje u Google rezultatima. Najbolje do 60 znakova.</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-[color:var(--db-text-muted)] flex justify-between mb-1">
                                                    <span>Meta Opis</span>
                                                    <span className={`${(pageData.description?.length || 0) > 160 ? 'text-red-400' : ''}`}>{pageData.description?.length || 0}/160</span>
                                                </label>
                                                <textarea
                                                    rows={2} maxLength={170}
                                                    value={pageData.description || ''}
                                                    onChange={e => updateSeoPage(page.key, 'description', e.target.value)}
                                                    placeholder={`Kratki opis za Google rezultate (${page.label})`}
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-[color:var(--db-border)] rounded-lg text-white text-sm placeholder:text-[color:var(--db-text-muted)] focus:outline-none focus:border-emerald-500 resize-none"
                                                />
                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--db-text-muted, #71717a)' }}>Kratki opis koji se prikazuje na Googleu ispod naslova. 150–160 znakova je idealno.</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-[color:var(--db-text-muted)] mb-1 flex items-center gap-1">
                                                    OG:Image (slika za dijeljenje)
                                                    <InfoTooltip text="Slika koja se prikazuje kad netko podijeli vaš link na Facebooku, LinkedInu ili WhatsAppu. Preporučena veličina: 1200×630 px." side="bottom" />
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    {pageData.ogImage ? (
                                                        <div className="relative">
                                                            <img src={pageData.ogImage} alt="OG" className="w-20 h-12 rounded-lg object-cover border border-[color:var(--db-border)]" />
                                                            <button type="button" onClick={() => updateSeoPage(page.key, 'ogImage', '')}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5">
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-20 h-12 bg-zinc-900 border-2 border-dashed border-[color:var(--db-border)] rounded-lg flex items-center justify-center">
                                                            <ImageIcon size={14} className="text-zinc-600" />
                                                        </div>
                                                    )}
                                                    <label className="cursor-pointer px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-[color:var(--db-border)] rounded-lg text-xs text-[color:var(--db-text-muted)] font-medium transition-colors">
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

                {/* ═══ MAINTAINED SUBSCRIPTION TAB ═══ */}
                {activeTab === 'buyout' && buyoutStatus === 'MAINTAINED' && (
                    <section className="db-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className={`w-10 h-10 ${maintenanceInfo?.cancelAtPeriodEnd ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl flex items-center justify-center`}>
                                <CreditCard size={20} className={maintenanceInfo?.cancelAtPeriodEnd ? 'text-amber-400' : 'text-emerald-400'} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold" style={{ color: 'var(--db-heading)' }}>Godišnje održavanje</h2>
                                <p className="text-[color:var(--db-text-muted)] text-sm">
                                    {maintenanceInfo?.cancelAtPeriodEnd
                                        ? 'Pretplata je otkazana — projekt ostaje aktivan do isteka'
                                        : 'Vaša otkupljena web stranica je na godišnjem održavanju'}
                                </p>
                            </div>
                        </div>

                        {/* Cancellation banner */}
                        {maintenanceInfo?.cancelAtPeriodEnd && maintenanceInfo?.periodEndDate && (
                            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-amber-400 mb-1">Pretplata otkazana</p>
                                        <p className="text-xs leading-relaxed" style={{ color: 'var(--db-text-muted)' }}>
                                            Vaš projekt ostaje potpuno aktivan do <strong className="text-amber-400">{new Date(maintenanceInfo.periodEndDate).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. 
                                            Nakon tog datuma, projekt će biti zaključan i imat ćete 90 dana za preuzimanje koda.
                                        </p>
                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            <button
                                                onClick={async () => {
                                                    setCancellingMaintenance(true);
                                                    try {
                                                        const res = await fetch('/api/revert-cancellation', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ projectId }),
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            toast.success('Pretplata je obnovljena!');
                                                            router.refresh();
                                                            window.location.reload();
                                                        } else {
                                                            toast.error(data.error || 'Greška.');
                                                        }
                                                    } catch {
                                                        toast.error('Greška pri obnovi.');
                                                    } finally {
                                                        setCancellingMaintenance(false);
                                                    }
                                                }}
                                                disabled={cancellingMaintenance}
                                                className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}
                                            >
                                                {cancellingMaintenance ? <><Loader2 size={12} className="animate-spin" /> Obnavljam...</> : <><RefreshCw size={12} /> Predomislio sam se — zadrži pretplatu</>}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/projects/${projectId}/export`);
                                                        if (!res.ok) { toast.error('Greška pri preuzimanju.'); return; }
                                                        const blob = await res.blob();
                                                        const { saveAs } = await import('file-saver');
                                                        const safeName = (projectName || 'website')
                                                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                                                            .replace(/[đĐ]/g, 'd')
                                                            .replace(/[^a-zA-Z0-9\s-]/g, '')
                                                            .replace(/\s+/g, '-')
                                                            .toLowerCase()
                                                            .substring(0, 50) || 'website';
                                                        saveAs(blob, `${safeName}-export.zip`);
                                                        toast.success('Preuzimanje pokrenuto!');
                                                    } catch {
                                                        toast.error('Greška pri preuzimanju.');
                                                    }
                                                }}
                                                className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--db-text-secondary)' }}
                                            >
                                                <Download size={12} /> Preuzmi stranicu (.zip)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status card */}
                        <div className="rounded-xl p-5 mb-4" style={{ 
                            background: maintenanceInfo?.cancelAtPeriodEnd ? 'rgba(245,158,11,0.03)' : 'rgba(16,185,129,0.05)', 
                            border: `1px solid ${maintenanceInfo?.cancelAtPeriodEnd ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.15)'}` 
                        }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {maintenanceInfo?.cancelAtPeriodEnd ? (
                                        <>
                                            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                                            <span className="text-sm font-bold text-amber-400">Vrijedi do isteka</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-sm font-bold text-emerald-400">Aktivna pretplata</span>
                                        </>
                                    )}
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${maintenanceInfo?.cancelAtPeriodEnd ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {maintenanceInfo?.cancelAtPeriodEnd ? 'Otkazano' : 'Otkupljeno + Održavanje'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-lg p-3" style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)' }}>
                                    <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--db-text-muted)' }}>Plan</p>
                                    <p className="text-sm font-bold" style={{ color: 'var(--db-heading)' }}>Godišnje održavanje</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--db-text-muted)' }}>Hosting, domena, tehnička podrška</p>
                                </div>
                                <div className="rounded-lg p-3" style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)' }}>
                                    <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--db-text-muted)' }}>Cijena</p>
                                    <p className="text-sm font-bold" style={{ color: 'var(--db-heading)' }}>250€ <span className="font-normal text-xs" style={{ color: 'var(--db-text-muted)' }}>/godišnje</span></p>
                                </div>
                            </div>

                            {maintenanceInfo && (
                                <div className="mt-4 space-y-1.5">
                                    {maintenanceInfo.startDate && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--db-text-muted)' }}>
                                            <CalendarClock size={14} />
                                            Početak pretplate: <strong style={{ color: 'var(--db-text-secondary)' }}>{new Date(maintenanceInfo.startDate).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                                        </div>
                                    )}
                                    {maintenanceInfo.cancelAtPeriodEnd && maintenanceInfo.periodEndDate ? (
                                        <div className="flex items-center gap-2 text-xs text-amber-400">
                                            <CalendarClock size={14} />
                                            Pristup do: <strong>{new Date(maintenanceInfo.periodEndDate).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                                        </div>
                                    ) : maintenanceInfo.nextBillingDate ? (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--db-text-secondary)' }}>
                                            <CalendarClock size={14} className="text-emerald-400" />
                                            Sljedeća naplata: <strong className="text-emerald-400">{new Date(maintenanceInfo.nextBillingDate).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {/* What's included */}
                        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)' }}>
                            <h3 className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: 'var(--db-text-muted)' }}>Uključeno u održavanje</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {['Hosting i SSL certifikat', 'Registracija domene', 'Tehnička podrška', 'Pristup dashboardu i uređivaču', 'Stranica online i aktivna', 'Sigurnosne nadogradnje'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--db-text-secondary)' }}>
                                        <Check size={12} className="text-emerald-400 shrink-0" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Download section */}
                        <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)' }}>
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--db-text-muted)' }}>Vaša web stranica</h3>
                                <p className="text-xs" style={{ color: 'var(--db-text-muted)' }}>Preuzmite ažurnu verziju web stranice s svim slikama</p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        toast.success('Priprema preuzimanja...');
                                        const res = await fetch(`/api/projects/${projectId}/export`);
                                        if (!res.ok) { 
                                            const errText = await res.text().catch(() => '');
                                            console.error('Export error:', res.status, errText);
                                            toast.error(errText || 'Greška pri preuzimanju.'); 
                                            return; 
                                        }
                                        const blob = await res.blob();
                                        const { saveAs } = await import('file-saver');
                                        const safeName = (projectName || 'website')
                                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                                            .replace(/[đĐ]/g, 'd')
                                            .replace(/[^a-zA-Z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-')
                                            .toLowerCase()
                                            .substring(0, 50) || 'website';
                                        saveAs(blob, `${safeName}-export.zip`);
                                        toast.success('Preuzimanje pokrenuto!');
                                    } catch (err) {
                                        console.error('Download error:', err);
                                        toast.error('Greška pri preuzimanju.');
                                    }
                                }}
                                className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5 shrink-0"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--db-text-secondary)' }}
                            >
                                <Download size={12} /> Preuzmi (.zip)
                            </button>
                        </div>

                        {/* Cancel section — only show if NOT already cancelled */}
                        {!maintenanceInfo?.cancelAtPeriodEnd && (
                            <>
                                {!showMaintenanceCancelConfirm ? (
                                    <button
                                        onClick={() => setShowMaintenanceCancelConfirm(true)}
                                        className="text-xs font-medium text-red-400/60 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-all cursor-pointer"
                                    >
                                        <XCircle size={12} className="inline mr-1" />
                                        Otkaži godišnje održavanje
                                    </button>
                                ) : (
                                    <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-red-400 mb-1">Jeste li sigurni?</h4>
                                                <p className="text-xs leading-relaxed" style={{ color: 'var(--db-text-muted)' }}>
                                                    Vaš projekt će ostati aktivan do isteka trenutnog obračunskog razdoblja. Nakon toga, stranica će biti skinuta s interneta i imat ćete <strong className="text-amber-400">90 dana</strong> za preuzimanje kompletnog koda.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowMaintenanceCancelConfirm(false)}
                                                disabled={cancellingMaintenance}
                                                className="flex-1 text-xs font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                                                style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                                            >
                                                Odustani
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setCancellingMaintenance(true);
                                                    try {
                                                        const res = await fetch('/api/cancel-subscription', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ projectId }),
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            toast.success(data.message || 'Pretplata otkazana.');
                                                            router.refresh();
                                                            window.location.reload();
                                                        } else {
                                                            toast.error(data.error || 'Greška pri otkazivanju.');
                                                        }
                                                    } catch {
                                                        toast.error('Greška pri otkazivanju.');
                                                    } finally {
                                                        setCancellingMaintenance(false);
                                                        setShowMaintenanceCancelConfirm(false);
                                                    }
                                                }}
                                                disabled={cancellingMaintenance}
                                                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                            >
                                                {cancellingMaintenance ? <><Loader2 size={12} className="animate-spin" /> Otkazujem...</> : 'Potvrdi otkazivanje'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}

                {/* ═══ BUYOUT TAB ═══ */}
                {activeTab === 'buyout' && buyoutStatus === 'NONE' && (() => {
                    const pn = planName.toLowerCase();
                    const isAdvanced = pn.includes('advanced') || pn.includes('growth');
                    const buyoutPrice = isAdvanced ? 990 : 390;

                    async function handleBuyout(option) {
                        setBuyoutLoading(option);
                        try {
                            const res = await fetch('/api/buyout-checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ projectId, option }),
                            });
                            const data = await res.json();
                            if (res.ok && data.url) {
                                window.location.href = data.url;
                            } else {
                                toast.error(data.error || 'Greška pri pokretanju plaćanja.');
                            }
                        } catch {
                            toast.error('Greška pri pokretanju plaćanja.');
                        } finally {
                            setBuyoutLoading(null);
                        }
                    }

                    return (
                        <section>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold mb-4">
                                    <Crown size={14} />
                                    Ekskluzivna ponuda
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Otkupite svoju web stranicu</h2>
                                <p className="text-[color:var(--db-text-muted)] text-sm max-w-lg mx-auto">
                                    Umjesto mjesečne pretplate, platite jednokratni iznos i postanite trajni vlasnik svoje web stranice. Odaberite opciju koja vam odgovara.
                                </p>
                            </div>

                            {/* Pricing Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Option 1: Buyout + Yearly Maintenance */}
                                <div className="relative db-card border-2 border-emerald-500/30 rounded-2xl p-6 flex flex-col transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">PREPORUČENO</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 mt-2">
                                        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                            <Shield size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Otkup + Održavanje</h3>
                                            <p className="text-xs text-[color:var(--db-text-muted)]">Stranica ostaje online</p>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex items-baseline gap-1 mb-1">
                                            <span className="text-3xl font-bold text-white">{buyoutPrice}€</span>
                                            <span className="text-[color:var(--db-text-muted)] text-sm">jednokratno</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-semibold text-emerald-400">+ 250€</span>
                                            <span className="text-[color:var(--db-text-muted)] text-sm">/godišnje</span>
                                        </div>
                                        <p className="text-xs text-[color:var(--db-text-muted)] mt-1">Za hosting, domenu i tehničko održavanje</p>
                                    </div>

                                    <ul className="space-y-2.5 mb-6 flex-1">
                                        {[
                                            'Trajno vlasništvo nad kodom',
                                            'Stranica ostaje online i aktivna',
                                            'Pristup dashboardu i uređivaču',
                                            'Mi brinemo o hostingu i domeni',
                                            'Tehnička podrška uključena',
                                            'Bez mjesečne pretplate',
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-[color:var(--db-text-secondary)]">
                                                <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleBuyout('maintain')}
                                        disabled={buyoutLoading !== null}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/20"
                                    >
                                        {buyoutLoading === 'maintain' ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                                        {buyoutLoading === 'maintain' ? 'Preusmjeravanje...' : 'Odaberi Otkup + Održavanje'}
                                    </button>
                                </div>

                                {/* Option 2: Buyout & Code Export */}
                                <div className="relative db-card border border-[color:var(--db-border)] rounded-2xl p-6 flex flex-col transition-all hover:border-zinc-600 hover:shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                                            <Download size={20} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Otkup i Preuzimanje</h3>
                                            <p className="text-xs text-[color:var(--db-text-muted)]">Preuzmite kod, hostajte sami</p>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex items-baseline gap-1 mb-1">
                                            <span className="text-3xl font-bold text-white">{buyoutPrice}€</span>
                                            <span className="text-[color:var(--db-text-muted)] text-sm">jednokratno</span>
                                        </div>
                                        <p className="text-xs text-[color:var(--db-text-muted)] mt-1">Bez ikakvih daljnjih troškova</p>
                                    </div>

                                    <ul className="space-y-2.5 mb-5 flex-1">
                                        {[
                                            'Trajno vlasništvo nad kodom',
                                            'Preuzmite kompletni HTML kod',
                                            'Hostajte gdje god želite',
                                            'Nema godišnjih naknada',
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-[color:var(--db-text-secondary)]">
                                                <Check size={15} className="text-orange-400 shrink-0 mt-0.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Warning box */}
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-5">
                                        <p className="text-xs text-amber-400/90 font-medium flex items-start gap-1.5">
                                            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Važno:</strong> Nakon otkupa, vaša stranica se skida s interneta. Uređivač i AI editor postaju nedostupni. Imate 90 dana za preuzimanje koda prije trajnog brisanja projekta.
                                            </span>
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleBuyout('export')}
                                        disabled={buyoutLoading !== null}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 hover:opacity-90"
                                        style={{ background: '#27272a', color: '#d4d4d8', border: '1px solid #3f3f46' }}
                                    >
                                        {buyoutLoading === 'export' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                        {buyoutLoading === 'export' ? 'Preusmjeravanje...' : 'Odaberi Otkup i Preuzimanje'}
                                    </button>
                                </div>
                            </div>

                            {/* FAQ / info footer */}
                            <div className="mt-6 db-card rounded-xl p-4">
                                <p className="text-xs text-[color:var(--db-text-muted)] text-center">
                                    <Server size={12} className="inline mr-1" />
                                    Imate pitanja o otkupu? Obratite nam se putem <a href="mailto:jurica@webica.hr" className="text-emerald-400 hover:underline">jurica@webica.hr</a> ili kroz podršku u dashboardu.
                                </p>
                            </div>
                        </section>
                    );
                })()}

                {/* ═══ DANGER ZONE TAB ═══ */}
                {activeTab === 'danger' && (
                    <section className="rounded-2xl p-6" style={{ background: 'var(--db-bg-alt)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <h2 className="text-base font-semibold text-red-400 flex items-center gap-2 mb-1">
                            <AlertTriangle size={18} />
                            Opasna zona
                            <InfoTooltip text="Ove radnje su nepovratne. Resetiranjem projekta trajno brišete sav sadržaj, stranicu, blog i postavke. Pretplata ostaje aktivna." side="right" />
                        </h2>
                        <p className="text-sm text-[color:var(--db-text-muted)] mb-4">
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
                                    <p className="text-[color:var(--db-text-secondary)] font-medium">⚠️ Jeste li sigurni? Ova radnja:</p>
                                    <ul className="text-[color:var(--db-text-muted)] space-y-1 ml-4 list-disc">
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
                                    <label className="block text-xs text-[color:var(--db-text-muted)] mb-1.5">
                                        Za potvrdu upišite: <strong className="text-[color:var(--db-text-secondary)]">obriši {projectName}</strong>
                                    </label>
                                    <input
                                        type="text"
                                        value={resetConfirmText}
                                        onChange={(e) => { setResetConfirmText(e.target.value); setResetError(''); }}
                                        placeholder={`obriši ${projectName}`}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-[color:var(--db-border)] text-white text-sm placeholder-[color:var(--db-text-muted)] focus:outline-none focus:border-red-500/50"
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
                                        className="px-4 py-2 text-[color:var(--db-text-muted)] hover:text-[color:var(--db-text-secondary)] rounded-xl text-sm font-medium transition-colors"
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
