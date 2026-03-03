"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, FileText, Zap, Globe, Sparkles, AlertTriangle, X, Clock, RefreshCw, MessageSquare } from "lucide-react";
import Link from "next/link";
import { TabLoader, ButtonLoader } from "./DashboardLoader";

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
                    <Icon size={17} style={{ color: 'var(--lp-text-muted)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>{title}</span>
                    {count !== undefined && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--lp-text-muted)' }}>
                            {count}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--lp-text-muted)' }}
                />
            </button>
            {open && (
                <div className="px-4 pb-4 db-fade-in" style={{ borderTop: '1px solid var(--lp-border)' }}>
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
            <div className="relative rounded-2xl p-6 max-w-md w-full shadow-2xl db-fade-in" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                <button onClick={onClose} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--lp-text-muted)' }}>
                    <X size={20} />
                </button>

                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={28} className="text-red-500" />
                </div>

                <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--lp-heading)' }}>Otkazivanje pretplate</h3>
                <p className="text-center text-sm mb-5" style={{ color: 'var(--lp-text-secondary)' }}>Jeste li sigurni da želite otkazati pretplatu za:</p>

                <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}>
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="shrink-0" style={{ color: 'var(--lp-text-muted)' }} />
                        <div className="min-w-0">
                            <h4 className="font-bold truncate" style={{ color: 'var(--lp-heading)' }}>{project.name}</h4>
                            <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>{project.planName}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mb-3">
                    <p className="text-amber-400/90 text-xs leading-relaxed">
                        ⏳ <strong>Vaši podaci bit će sačuvani {GRACE_PERIOD_DAYS} dana</strong> nakon otkazivanja.
                    </p>
                </div>

                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 mb-5">
                    <p className="text-red-400/90 text-xs leading-relaxed">
                        ⚠️ Nakon {GRACE_PERIOD_DAYS} dana svi podaci bit će <strong>trajno obrisani</strong>. Vaša web stranica odmah prestaje biti javno dostupna.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} disabled={cancelling} className="flex-1 font-medium py-3 rounded-xl transition-colors" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}>
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

    const activeProjects = projects.filter(p => !p.cancelledAt);
    const cancelledProjects = projects.filter(p => p.cancelledAt);

    const getStatusBadge = (project) => {
        if (project.cancelledAt) {
            const daysLeft = getDaysLeft(project.cancelledAt);
            return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Briše se za {daysLeft}d</span>;
        }
        if (project.stripeSubscriptionId) return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Aktivan</span>;
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-muted)' }}>Bez pretplate</span>;
    };

    if (loading) return <TabLoader message="Učitavanje pretplata..." />;

    return (
        <div className="max-w-4xl space-y-4">
            {cancelProject && (
                <CancelModal project={cancelProject} onClose={() => !cancelling && setCancelProject(null)} onConfirm={handleCancelSubscription} cancelling={cancelling} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--lp-heading)' }}>Pregled</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
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
                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
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
                            <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl hover:bg-white/[0.02] transition-colors" style={{ border: '1px solid var(--lp-border)' }}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--lp-heading)' }}>{project.name}</h4>
                                        {getStatusBadge(project)}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs flex-wrap" style={{ color: 'var(--lp-text-muted)' }}>
                                        <span className="font-medium" style={{ color: 'var(--lp-text-secondary)' }}>{project.planName}</span>
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
                                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
                                    >
                                        Otvori →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 rounded-xl" style={{ border: '1px dashed var(--lp-border)' }}>
                        <Globe size={24} className="mx-auto mb-2" style={{ color: 'var(--lp-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>Nemate aktivnih pretplata.</p>
                        <Link href="/dashboard/new-project" className="text-sm font-semibold mt-2 inline-block" style={{ color: 'var(--lp-heading)' }}>
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
                                <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl" style={{ border: `1px solid ${urgency === 'critical' ? 'rgba(239,68,68,0.2)' : urgency === 'high' ? 'rgba(245,158,11,0.2)' : 'var(--lp-border)'}`, background: urgency === 'critical' ? 'rgba(239,68,68,0.03)' : urgency === 'high' ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--lp-text-secondary)' }}>{project.name}</h4>
                                            {getStatusBadge(project)}
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                            <span>{project.planName}</span>
                                            <span>•</span>
                                            <span>Otkazano {new Date(project.cancelledAt).toLocaleDateString('hr-HR')}</span>
                                        </div>
                                        {/* Grace progress */}
                                        <div className="mt-2 w-full max-w-[200px]">
                                            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--lp-border)' }}>
                                                <div className={`h-full rounded-full ${urgency === 'critical' ? 'bg-red-500' : urgency === 'high' ? 'bg-amber-500' : 'bg-white/20'}`}
                                                    style={{ width: `${Math.max(2, (daysLeft / GRACE_PERIOD_DAYS) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRenew(project.id)}
                                        disabled={renewingProjectId === project.id}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 hover:scale-105"
                                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
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
                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.02]" style={{ border: '1px solid var(--lp-border)' }}>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-xs" style={{ color: 'var(--lp-heading)' }}>{inv.date}</div>
                                    <div className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>{inv.description || inv.status}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs" style={{ color: 'var(--lp-text-secondary)' }}>{inv.amount} {inv.currency}</span>
                                    {inv.pdfUrl && (
                                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-xs hover:opacity-80" style={{ color: 'var(--lp-heading)' }}>PDF ↗</a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-xs rounded-xl" style={{ color: 'var(--lp-text-muted)', border: '1px dashed var(--lp-border)' }}>
                        Nema dostupnih računa.
                    </div>
                )}
            </CollapsibleSection>

            {/* ── Quick Actions ── */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="db-card p-5 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ color: 'var(--lp-text-secondary)' }}>
                        <Zap size={20} />
                    </div>
                    <h4 className="font-bold mb-1.5" style={{ color: 'var(--lp-heading)' }}>Poboljšajte svoj web</h4>
                    <p className="text-sm mb-3" style={{ color: 'var(--lp-text-muted)' }}>Dodajte nove funkcionalnosti, SEO članke ili Google Ads vođenje.</p>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--lp-text-secondary)' }}>
                        Prikaži opcije <ChevronRight size={14} />
                    </span>
                </div>

                <Link href="/dashboard/feedback" className="db-card p-5 group block">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ color: 'var(--lp-text-secondary)' }}>
                        <MessageSquare size={20} />
                    </div>
                    <h4 className="font-bold mb-1.5" style={{ color: 'var(--lp-heading)' }}>Ostavi feedback</h4>
                    <p className="text-sm mb-3" style={{ color: 'var(--lp-text-muted)' }}>Vaše mišljenje nam pomaže poboljšati uslugu. Recite nam što mislite!</p>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--lp-text-secondary)' }}>
                        Ostavi feedback <ChevronRight size={14} />
                    </span>
                </Link>
            </div>
        </div>
    );
}
