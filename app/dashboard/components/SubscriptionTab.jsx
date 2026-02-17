"use client";

import { useState, useEffect } from "react";
import { ChevronRight, FileText, Zap, LifeBuoy, Globe, Sparkles, Loader2, AlertTriangle, X, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

const GRACE_PERIOD_DAYS = 90;

function getDaysLeft(cancelledAt) {
    if (!cancelledAt) return null;
    const cancelled = new Date(cancelledAt);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - cancelled.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, GRACE_PERIOD_DAYS - daysSince);
}

function CancelModal({ project, onClose, onConfirm, cancelling }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Warning icon */}
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={28} className="text-red-500" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white text-center mb-2">
                    Otkazivanje pretplate
                </h3>
                <p className="text-zinc-400 text-center text-sm mb-5">
                    Jeste li sigurni da želite otkazati pretplatu za:
                </p>

                {/* Project info */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="text-zinc-500 shrink-0" />
                        <div className="min-w-0">
                            <h4 className="font-bold text-white truncate">{project.name}</h4>
                            <p className="text-sm text-zinc-500">{project.planName}</p>
                        </div>
                    </div>
                </div>

                {/* Grace period info */}
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mb-3">
                    <p className="text-amber-400/90 text-xs leading-relaxed">
                        ⏳ <strong>Vaši podaci bit će sačuvani {GRACE_PERIOD_DAYS} dana</strong> nakon otkazivanja. 
                        U tom periodu možete obnoviti pretplatu i zadržati sve podatke.
                    </p>
                </div>

                {/* Warning message */}
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 mb-5">
                    <p className="text-red-400/90 text-xs leading-relaxed">
                        ⚠️ Nakon {GRACE_PERIOD_DAYS} dana svi podaci — web stranica, blog, slike i postavke — 
                        bit će <strong>trajno obrisani</strong>. Vaša web stranica odmah prestaje biti javno dostupna.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={cancelling}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors border border-zinc-700"
                    >
                        Odustani
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={cancelling}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {cancelling ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Otkazujem...
                            </>
                        ) : (
                            'Potvrdi otkazivanje'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SubscriptionTab({ user, onPortal }) {
    const [projects, setProjects] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelProject, setCancelProject] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [renewingProjectId, setRenewingProjectId] = useState(null);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/user/subscription");
            const data = await res.json();
            if (data.projects) setProjects(data.projects);
            if (data.invoices) setInvoices(data.invoices);
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
            if (data.success) {
                await fetchData();
                setCancelProject(null);
            } else {
                alert(data.error || 'Greška pri otkazivanju.');
            }
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
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Greška pri obnovi.');
            }
        } catch (err) {
            console.error('Renew error:', err);
            alert('Došlo je do greške.');
        } finally {
            setRenewingProjectId(null);
        }
    };

    // Split projects into active and cancelled
    const activeProjects = projects.filter(p => !p.cancelledAt);
    const cancelledProjects = projects.filter(p => p.cancelledAt);

    const getStatusBadge = (project) => {
        if (project.cancelledAt) {
            const daysLeft = getDaysLeft(project.cancelledAt);
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Briše se za {daysLeft} {daysLeft === 1 ? 'dan' : 'dana'}
                </span>
            );
        }
        if (project.stripeSubscriptionId) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                    Aktivan
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-zinc-800 text-zinc-500">
                Bez pretplate
            </span>
        );
    };

    const getPlanColor = (planName) => {
        if (planName?.includes('Advanced')) return 'text-green-400';
        if (planName?.includes('Starter')) return 'text-zinc-300';
        if (planName?.includes('Poduzetni')) return 'text-purple-400';
        return 'text-zinc-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-green-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cancel Confirmation Modal */}
            {cancelProject && (
                <CancelModal
                    project={cancelProject}
                    onClose={() => !cancelling && setCancelProject(null)}
                    onConfirm={handleCancelSubscription}
                    cancelling={cancelling}
                />
            )}

            {/* Active Subscriptions / Projects */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Moje Pretplate</h3>
                    <Link
                        href="/dashboard/new-project"
                        className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2"
                    >
                        <Zap size={16} /> Novi paket
                    </Link>
                </div>

                {activeProjects.length > 0 ? (
                    <div className="space-y-3">
                        {activeProjects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Globe size={18} className="text-zinc-500 shrink-0" />
                                            <h4 className="font-bold text-white truncate">{project.name}</h4>
                                            {getStatusBadge(project)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-zinc-500 ml-8">
                                            <span className={`font-medium ${getPlanColor(project.planName)}`}>
                                                {project.planName}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Sparkles size={14} className="text-amber-500" />
                                                {project.editorTokens} tokena
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {project.hasGenerated ? "Generiran" : "Čeka generiranje"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-8 sm:ml-0">
                                        <Link
                                            href={`/dashboard/projects/${project.id}/${project.hasGenerated ? 'editor' : 'content'}`}
                                            className="text-sm font-medium text-green-500 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/5 transition-all"
                                        >
                                            Otvori →
                                        </Link>
                                        {project.stripeSubscriptionId && (
                                            <button
                                                onClick={() => setCancelProject(project)}
                                                className="text-sm font-medium text-red-400/70 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                                            >
                                                Otkaži pretplatu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
                        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe size={28} className="text-zinc-600" />
                        </div>
                        <h4 className="font-bold text-lg text-white mb-2">Nemate još projekata</h4>
                        <p className="text-zinc-500 mb-6">Odaberite paket i kreirajte svoju prvu web stranicu.</p>
                        <Link
                            href="/dashboard/new-project"
                            className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2"
                        >
                            <Zap size={18} /> Odaberi paket
                        </Link>
                    </div>
                )}
            </div>

            {/* Cancelled Projects — Grace Period */}
            {cancelledProjects.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-amber-500" />
                        Otkazane pretplate
                    </h3>
                    <div className="space-y-3">
                        {cancelledProjects.map((project) => {
                            const daysLeft = getDaysLeft(project.cancelledAt);
                            const urgency = daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'high' : 'normal';

                            return (
                                <div
                                    key={project.id}
                                    className={`border rounded-2xl p-5 transition-all ${
                                        urgency === 'critical'
                                            ? 'bg-red-500/5 border-red-500/20'
                                            : urgency === 'high'
                                                ? 'bg-amber-500/5 border-amber-500/20'
                                                : 'bg-zinc-900/30 border-zinc-800'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Globe size={18} className="text-zinc-600 shrink-0" />
                                                <h4 className="font-bold text-zinc-400 truncate">{project.name}</h4>
                                                {getStatusBadge(project)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-zinc-600 ml-8">
                                                <span className="font-medium">{project.planName}</span>
                                                <span>•</span>
                                                <span>
                                                    Otkazano {new Date(project.cancelledAt).toLocaleDateString('hr-HR')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-8 sm:ml-0">
                                            <button
                                                onClick={() => handleRenew(project.id)}
                                                disabled={renewingProjectId === project.id}
                                                className="text-sm font-medium text-green-500 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/5 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {renewingProjectId === project.id ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Obnavljam...</>
                                                ) : (
                                                    <><RefreshCw size={14} /> Obnovi pretplatu</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-3 ml-8">
                                        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                                            <span>Grace period</span>
                                            <span className={
                                                urgency === 'critical' ? 'text-red-400 font-bold' :
                                                urgency === 'high' ? 'text-amber-400 font-medium' : 'text-zinc-400'
                                            }>
                                                {daysLeft} {daysLeft === 1 ? 'dan' : 'dana'} preostalo
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    urgency === 'critical' ? 'bg-red-500' :
                                                    urgency === 'high' ? 'bg-amber-500' : 'bg-zinc-500'
                                                }`}
                                                style={{ width: `${Math.max(2, (daysLeft / GRACE_PERIOD_DAYS) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Invoice History */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-zinc-500" /> Povijest Računa
                 </h4>
                 {invoices.length > 0 ? (
                     <div className="space-y-2">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-white">{inv.date}</div>
                                    <div className="text-xs text-zinc-500">{inv.description || inv.status}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-zinc-300">{inv.amount} {inv.currency}</span>
                                    {inv.pdfUrl && (
                                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 font-medium text-sm">
                                            PDF
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                     </div>
                 ) : (
                     <div className="text-center py-8 text-zinc-500 italic border border-dashed border-zinc-800 rounded-xl">
                        Nema dostupnih računa.
                     </div>
                 )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Poboljšajte svoj web</h4>
                    <p className="text-zinc-500 text-sm mb-4">Dodajte nove funkcionalnosti, SEO članke ili Google Ads vođenje.</p>
                    <button className="text-purple-400 font-bold text-sm hover:text-purple-300 flex items-center gap-1">Prikaži opcije <ChevronRight size={14} /></button>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <LifeBuoy size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Trebate pomoć?</h4>
                    <p className="text-zinc-500 text-sm mb-4">Naš tim je tu za vas 24/7. Otvorite ticket i riješit ćemo sve u trenu.</p>
                    <button className="text-blue-400 font-bold text-sm hover:text-blue-300 flex items-center gap-1">Kontaktiraj podršku <ChevronRight size={14} /></button>
                </div>
            </div>
        </div>
    );
}
