"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, FileText, Zap, Globe, Sparkles, AlertTriangle, X, Clock, RefreshCw, MessageSquare, ArrowUpCircle, Check, Bug, Hourglass } from "lucide-react";
import Link from "next/link";
import { TabLoader, ButtonLoader } from "./DashboardLoader";
import { useToast } from "./ToastProvider";

const GRACE_PERIOD_DAYS = 90;

function getDaysLeft(cancelledAt) {
    if (!cancelledAt) return null;
    const cancelled = new Date(cancelledAt);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - cancelled.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, GRACE_PERIOD_DAYS - daysSince);
}

/* ── Collapsible Section ── */
function CollapsibleSection({ title, icon: Icon, count, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="db-card overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02]"
            >
                <div className="flex items-center gap-2.5">
                    <Icon size={17} style={{ color: 'var(--db-text-muted)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--db-heading)' }}>{title}</span>
                    {count !== undefined && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--db-text-muted)' }}>
                            {count}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--db-text-muted)' }}
                />
            </button>
            {open && (
                <div className="px-4 pb-4 db-fade-in" style={{ borderTop: '1px solid var(--db-border)' }}>
                    <div className="pt-3">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Cancel Modal ── */
function CancelModal({ project, onClose, onConfirm, cancelling }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl p-6 max-w-md w-full shadow-2xl db-fade-in" style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                <button onClick={onClose} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--db-text-muted)' }}>
                    <X size={20} />
                </button>

                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={28} className="text-red-500" />
                </div>

                <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--db-heading)' }}>Otkazivanje pretplate</h3>
                <p className="text-center text-sm mb-5" style={{ color: 'var(--db-text-secondary)' }}>Jeste li sigurni da želite otkazati pretplatu za:</p>

                <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)' }}>
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="shrink-0" style={{ color: 'var(--db-text-muted)' }} />
                        <div className="min-w-0">
                            <h4 className="font-bold truncate" style={{ color: 'var(--db-heading)' }}>{project.name}</h4>
                            <p className="text-sm" style={{ color: 'var(--db-text-muted)' }}>{project.planName}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mb-3">
                    <p className="text-amber-400/90 text-xs leading-relaxed">
                        <Hourglass size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>Vaši podaci bit će sačuvani {GRACE_PERIOD_DAYS} dana</strong> nakon otkazivanja.
                    </p>
                </div>

                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 mb-5">
                    <p className="text-red-400/90 text-xs leading-relaxed">
                        <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Nakon {GRACE_PERIOD_DAYS} dana svi podaci bit će <strong>trajno obrisani</strong>. Vaša web stranica odmah prestaje biti javno dostupna.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} disabled={cancelling} className="flex-1 font-medium py-3 rounded-xl transition-colors" style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}>
                        Odustani
                    </button>
                    <button onClick={onConfirm} disabled={cancelling} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {cancelling ? <><ButtonLoader size={14} /> Otkazujem...</> : 'Potvrdi otkazivanje'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Component ── */
export default function SubscriptionTab({ user, onPortal }) {
    const [projects, setProjects] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelProject, setCancelProject] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [renewingProjectId, setRenewingProjectId] = useState(null);
    const [editorTokens, setEditorTokens] = useState(0);
    const [upgradingProjectId, setUpgradingProjectId] = useState(null);
    const toast = useToast();

    const fetchData = async () => {
        try {
            const res = await fetch("/api/user/subscription");
            const data = await res.json();
            if (data.projects) setProjects(data.projects);
            if (data.invoices) setInvoices(data.invoices);
            if (data.editorTokens !== undefined) setEditorTokens(data.editorTokens);
        } catch (err) {
            console.error("Failed to fetch subscription data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCancelSubscription = async () => {
        if (!cancelProject) return;
        setCancelling(true);
        try {
            const res = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: cancelProject.id })
            });
            const data = await res.json();
            if (data.success) { await fetchData(); setCancelProject(null); }
            else alert(data.error || 'Greška pri otkazivanju.');
        } catch (err) {
            console.error('Cancel error:', err);
            alert('Došlo je do greške.');
        } finally {
            setCancelling(false);
        }
    };

    const handleRenew = async (projectId) => {
        setRenewingProjectId(projectId);
        try {
            const res = await fetch('/api/renew-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert(data.error || 'Greška pri obnovi.');
        } catch (err) {
            console.error('Renew error:', err);
            alert('Došlo je do greške.');
        } finally {
            setRenewingProjectId(null);
        }
    };

    const handleUpgrade = async (projectId) => {
        setUpgradingProjectId(projectId);
        try {
            const res = await fetch('/api/upgrade-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Uspješno nadograđeno na Advanced!');
                await fetchData(); // refresh everything
            } else {
                toast.error(data.error || 'Greška pri nadogradnji.');
            }
        } catch (err) {
            console.error('Upgrade error:', err);
            toast.error('Došlo je do greške pri nadogradnji.');
        } finally {
            setUpgradingProjectId(null);
        }
    };

    const activeProjects = projects.filter(p => !p.cancelledAt);
    const cancelledProjects = projects.filter(p => p.cancelledAt);
    const starterProjects = activeProjects.filter(p => p.planName?.toLowerCase().includes('starter') && p.stripeSubscriptionId);

    const getStatusBadge = (project) => {
        if (project.cancelledAt) {
            const daysLeft = getDaysLeft(project.cancelledAt);
            return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Briše se za {daysLeft}d</span>;
        }
        if (project.stripeSubscriptionId) return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Aktivan</span>;
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--db-surface)', color: 'var(--db-text-muted)' }}>Bez pretplate</span>;
    };

    if (loading) return <TabLoader message="Učitavanje pretplata..." />;

    return (
        <div className="max-w-4xl space-y-4">
            {cancelProject && (
                <CancelModal project={cancelProject} onClose={() => !cancelling && setCancelProject(null)} onConfirm={handleCancelSubscription} cancelling={cancelling} />
            )}

            {/* ── Upgrade Banner (Starter → Advanced) ── */}
            {starterProjects.map(project => (
                <div
                    key={`upgrade-${project.id}`}
                    className="relative overflow-hidden rounded-2xl p-5 md:p-6 db-fade-in"
                    style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.06) 50%, rgba(139,92,246,0.06) 100%)',
                        border: '1px solid rgba(16,185,129,0.2)',
                    }}
                >
                    {/* Decorative glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(16,185,129,0.12)' }} />

                    <div className="relative flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowUpCircle size={20} className="text-emerald-400 shrink-0" />
                                <h3 className="text-base font-bold" style={{ color: 'var(--db-heading)' }}>
                                    Nadogradi na Advanced
                                </h3>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                    {project.name}
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--db-text-secondary)' }}>
                                Otključajte neograničene podstranice, SEO Blog i dobijte dodatnih 500 AI tokena!
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--db-text-muted)' }}>
                                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-400" /> Podstranice (Usluge, O nama, Kontakt)</span>
                                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-400" /> CMS Blog sustav</span>
                                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-400" /> 10 AI članaka mjesečno</span>
                                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-400" /> +500 AI tokena bonus</span>
                                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-400" /> Napredne animacije</span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                            <button
                                onClick={() => handleUpgrade(project.id)}
                                disabled={upgradingProjectId === project.id}
                                className="font-bold text-sm px-6 py-3 rounded-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: 'white',
                                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                                }}
                            >
                                {upgradingProjectId === project.id ? (
                                    <><ButtonLoader size={14} /> Nadogradnja...</>
                                ) : (
                                    <><Zap size={16} /> Nadogradi na Advanced</>
                                )}
                            </button>
                            <span className="text-[11px]" style={{ color: 'var(--db-text-muted)' }}>
                                39€ → 99€/mj · proporcionalna naplata
                            </span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--db-heading)' }}>Pregled</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--db-text-muted)' }}>
                        {activeProjects.length} {activeProjects.length === 1 ? 'aktivan projekt' : 'aktivnih projekata'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Account-level token balance */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)', color: '#ca8a04' }}>
                        <Sparkles size={12} /> {editorTokens} tokena
                    </div>
                    <Link
                        href="/dashboard/new-project"
                        className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 hover:scale-105 active:scale-95"
                        style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                    >
                        <Zap size={15} /> Novi paket
                    </Link>
                </div>
            </div>

            {/* ── Active Subscriptions (collapsible, default open) ── */}
            <CollapsibleSection title="Aktivne pretplate" icon={Globe} count={activeProjects.length} defaultOpen={true}>
                {activeProjects.length > 0 ? (
                    <div className="space-y-2.5">
                        {activeProjects.map((project) => (
                            <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl hover:bg-white/[0.02] transition-colors" style={{ border: '1px solid var(--db-border)' }}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--db-heading)' }}>{project.name}</h4>
                                        {getStatusBadge(project)}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs flex-wrap" style={{ color: 'var(--db-text-muted)' }}>
                                        <span className="font-medium" style={{ color: 'var(--db-text-secondary)' }}>{project.planName}</span>
                                        <span>•</span>
                                        <span>{project.hasGenerated ? "Generiran" : "Čeka generiranje"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {project.stripeSubscriptionId && (
                                        <button onClick={() => setCancelProject(project)} className="text-xs font-medium text-red-400/60 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/5 transition-all">
                                            Otkaži
                                        </button>
                                    )}
                                    <Link
                                        href={`/dashboard/projects/${project.id}/${project.hasGenerated ? 'editor' : 'content'}`}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                                        style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                                    >
                                        Otvori →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 rounded-xl" style={{ border: '1px dashed var(--db-border)' }}>
                        <Globe size={24} className="mx-auto mb-2" style={{ color: 'var(--db-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--db-text-muted)' }}>Nemate aktivnih pretplata.</p>
                        <Link href="/dashboard/new-project" className="text-sm font-semibold mt-2 inline-block" style={{ color: 'var(--db-heading)' }}>
                            Odaberi paket →
                        </Link>
                    </div>
                )}
            </CollapsibleSection>

            {/* ── Cancelled Subscriptions (collapsible) ── */}
            {cancelledProjects.length > 0 && (
                <CollapsibleSection title="Otkazane pretplate" icon={Clock} count={cancelledProjects.length}>
                    <div className="space-y-2.5">
                        {cancelledProjects.map((project) => {
                            const daysLeft = getDaysLeft(project.cancelledAt);
                            const urgency = daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'high' : 'normal';
                            return (
                                <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl" style={{ border: `1px solid ${urgency === 'critical' ? 'rgba(239,68,68,0.2)' : urgency === 'high' ? 'rgba(245,158,11,0.2)' : 'var(--db-border)'}`, background: urgency === 'critical' ? 'rgba(239,68,68,0.03)' : urgency === 'high' ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--db-text-secondary)' }}>{project.name}</h4>
                                            {getStatusBadge(project)}
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--db-text-muted)' }}>
                                            <span>{project.planName}</span>
                                            <span>•</span>
                                            <span>Otkazano {new Date(project.cancelledAt).toLocaleDateString('hr-HR')}</span>
                                        </div>
                                        {/* Grace progress */}
                                        <div className="mt-2 w-full max-w-[200px]">
                                            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--db-border)' }}>
                                                <div className={`h-full rounded-full ${urgency === 'critical' ? 'bg-red-500' : urgency === 'high' ? 'bg-amber-500' : 'bg-white/20'}`}
                                                    style={{ width: `${Math.max(2, (daysLeft / GRACE_PERIOD_DAYS) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRenew(project.id)}
                                        disabled={renewingProjectId === project.id}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 hover:scale-105"
                                        style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}
                                    >
                                        {renewingProjectId === project.id ? <><ButtonLoader size={12} /> Obnavljam...</> : <><RefreshCw size={12} /> Obnovi</>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>
            )}

            {/* ── Invoice History (collapsible) ── */}
            <CollapsibleSection title="Povijest računa" icon={FileText} count={invoices.length}>
                {invoices.length > 0 ? (
                    <div className="space-y-2">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.02]" style={{ border: '1px solid var(--db-border)' }}>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-xs" style={{ color: 'var(--db-heading)' }}>{inv.date}</div>
                                    <div className="text-[11px]" style={{ color: 'var(--db-text-muted)' }}>{inv.description || inv.status}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs" style={{ color: 'var(--db-text-secondary)' }}>{inv.amount} {inv.currency}</span>
                                    {inv.pdfUrl && (
                                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-xs hover:opacity-80" style={{ color: 'var(--db-heading)' }}>PDF ↗</a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-xs rounded-xl" style={{ color: 'var(--db-text-muted)', border: '1px dashed var(--db-border)' }}>
                        Nema dostupnih računa.
                    </div>
                )}
            </CollapsibleSection>

            {/* ── Quick Actions ── */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <Link href="/dashboard/bug-report" className="db-card p-5 group block">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ color: 'var(--db-text-secondary)' }}>
                        <Bug size={20} />
                    </div>
                    <h4 className="font-bold mb-1.5" style={{ color: 'var(--db-heading)' }}>Prijavite bug</h4>
                    <p className="text-sm mb-3" style={{ color: 'var(--db-text-muted)' }}>Nešto ne radi kako treba? Prijavite grešku i pomozite nam poboljšati platformu.</p>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--db-text-secondary)' }}>
                        Prijavi bug <ChevronRight size={14} />
                    </span>
                </Link>

                <Link href="/dashboard/feedback" className="db-card p-5 group block">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ color: 'var(--db-text-secondary)' }}>
                        <MessageSquare size={20} />
                    </div>
                    <h4 className="font-bold mb-1.5" style={{ color: 'var(--db-heading)' }}>Ostavi feedback</h4>
                    <p className="text-sm mb-3" style={{ color: 'var(--db-text-muted)' }}>Vaše mišljenje nam pomaže poboljšati uslugu. Recite nam što mislite!</p>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--db-text-secondary)' }}>
                        Ostavi feedback <ChevronRight size={14} />
                    </span>
                </Link>
            </div>
        </div>
    );
}
