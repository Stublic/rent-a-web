"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Zap, Sparkles, ChevronRight, Clock, RefreshCw, Globe, Pencil, Plus, ExternalLink } from "lucide-react";
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

function getProjectDomain(project) {
    if (project.customDomain) return project.customDomain;
    if (project.subdomain) return `${project.subdomain}.webica.hr`;
    if (project.domain) return project.domain;
    return null;
}

function getProjectUrl(project) {
    const domain = getProjectDomain(project);
    if (!domain) return null;
    return domain.startsWith('http') ? domain : `https://${domain}`;
}

// Color schemes per column type
const COLUMN_COLORS = {
    published: {
        cardBorder: 'rgba(34,197,94,0.15)',
        cardBg: 'rgba(34,197,94,0.03)',
        avatarBg: 'rgba(34,197,94,0.12)',
        avatarColor: '#22c55e',
        avatarBorder: 'rgba(34,197,94,0.25)',
        accentColor: '#22c55e',
        headerBg: 'rgba(34,197,94,0.8)',
    },
    inProgress: {
        cardBorder: 'rgba(59,130,246,0.15)',
        cardBg: 'rgba(59,130,246,0.03)',
        avatarBg: 'rgba(59,130,246,0.12)',
        avatarColor: '#3b82f6',
        avatarBorder: 'rgba(59,130,246,0.25)',
        accentColor: '#3b82f6',
        headerBg: 'rgba(59,130,246,0.8)',
    },
    pending: {
        cardBorder: 'rgba(168,85,247,0.15)',
        cardBg: 'rgba(168,85,247,0.03)',
        avatarBg: 'rgba(168,85,247,0.12)',
        avatarColor: '#a855f7',
        avatarBorder: 'rgba(168,85,247,0.25)',
        accentColor: '#a855f7',
        headerBg: 'rgba(168,85,247,0.8)',
    },
};

function ProjectCard({ project, colorScheme, onRenew, renewingProjectId }) {
    const isCancelled = !!project.cancelledAt;
    const daysLeft = isCancelled ? getDaysLeft(project.cancelledAt) : null;
    const urgency = daysLeft !== null ? (daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'high' : 'normal') : null;
    const domain = getProjectDomain(project);
    const url = getProjectUrl(project);

    const linkHref = project.hasGenerated
        ? `/dashboard/projects/${project.id}/editor`
        : `/dashboard/projects/${project.id}/content`;

    const colors = isCancelled ? null : colorScheme;

    const cardStyle = isCancelled
        ? {
            background: urgency === 'critical' ? 'rgba(239,68,68,0.03)' : urgency === 'high' ? 'rgba(245,158,11,0.03)' : 'var(--lp-bg-alt)',
            border: `1px solid ${urgency === 'critical' ? 'rgba(239,68,68,0.2)' : urgency === 'high' ? 'rgba(245,158,11,0.2)' : 'var(--lp-border)'}`,
            borderRadius: '16px',
            opacity: 0.7,
        }
        : {
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
        };

    return (
        <div
            className="p-4 transition-all hover:shadow-lg"
            style={cardStyle}
            onMouseEnter={e => { if (!isCancelled) e.currentTarget.style.borderColor = colors.avatarBorder; }}
            onMouseLeave={e => { if (!isCancelled) e.currentTarget.style.borderColor = colors.cardBorder; }}
        >
            {/* Top: avatar + status */}
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{
                        background: isCancelled ? 'var(--lp-surface)' : colors.avatarBg,
                        color: isCancelled ? 'var(--lp-text-muted)' : colors.avatarColor,
                        border: `1px solid ${isCancelled ? 'var(--lp-border)' : colors.avatarBorder}`,
                    }}
                >
                    {project.name?.charAt(0) || '?'}
                </div>
                {isCancelled ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${urgency === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {daysLeft}d preostalo
                    </span>
                ) : project.status === 'LIVE' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● Live
                    </span>
                ) : null}
            </div>

            {/* Name */}
            <h4 className="font-semibold text-sm truncate mb-0.5" style={{ color: isCancelled ? 'var(--lp-text-secondary)' : 'var(--lp-heading)' }}>
                {project.name}
            </h4>

            {/* Domain with link */}
            {domain ? (
                <div className="flex items-center gap-1.5 mb-3">
                    <p className="text-[11px] truncate" style={{ color: colors?.accentColor || 'var(--lp-text-muted)' }}>
                        {domain}
                    </p>
                    {url && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
                            title="Otvori stranicu"
                        >
                            <ExternalLink size={11} style={{ color: colors?.accentColor || 'var(--lp-text-muted)' }} />
                        </a>
                    )}
                </div>
            ) : (
                <p className="text-[11px] mb-3" style={{ color: 'var(--lp-text-muted)' }}>
                    {project.hasGenerated ? 'Još nije objavljena' : 'Čeka sadržaj'}
                </p>
            )}

            {/* Cancelled: grace period bar */}
            {isCancelled && (
                <div className="mb-3">
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--lp-border)' }}>
                        <div
                            className={`h-full rounded-full ${urgency === 'critical' ? 'bg-red-500' : urgency === 'high' ? 'bg-amber-500' : 'bg-white/20'}`}
                            style={{ width: `${Math.max(2, (daysLeft / GRACE_PERIOD_DAYS) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {isCancelled ? (
                    <button
                        onClick={() => onRenew(project.id)}
                        disabled={renewingProjectId === project.id}
                        className="flex-1 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 hover:scale-[1.02]"
                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
                    >
                        {renewingProjectId === project.id ? (
                            <><ButtonLoader size={12} /> Obnavljam...</>
                        ) : (
                            <><RefreshCw size={12} /> Obnovi pretplatu</>
                        )}
                    </button>
                ) : (
                    <>
                        <Link
                            href={linkHref}
                            className="flex-1 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                            style={{
                                background: !project.hasGenerated ? colors.accentColor : 'var(--lp-surface)',
                                color: !project.hasGenerated ? '#fff' : 'var(--lp-text-secondary)',
                                border: project.hasGenerated ? '1px solid var(--lp-border)' : 'none',
                            }}
                        >
                            {!project.hasGenerated ? (
                                <><Sparkles size={12} /> Kreiraj</>
                            ) : (
                                <><Pencil size={12} /> Uredi</>
                            )}
                        </Link>
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 hover:scale-[1.02]"
                                style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}
                            >
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function ColumnHeader({ icon: Icon, title, count, color }) {
    return (
        <div className="flex items-center gap-2.5 mb-3 pb-3" style={{ borderBottom: '1px solid var(--lp-border)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color }}>
                <Icon size={14} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold" style={{ color: 'var(--lp-heading)' }}>{title}</h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-muted)' }}>
                    {count}
                </span>
            </div>
        </div>
    );
}

export default function ProjectsTab() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [renewingProjectId, setRenewingProjectId] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("/api/projects");
                const data = await res.json();
                setProjects(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

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

    if (loading) return <TabLoader message="Učitavanje projekata..." />;

    const activeProjects = projects.filter(p => !p.cancelledAt);
    const cancelledProjects = projects.filter(p => p.cancelledAt);

    const published = activeProjects.filter(p => p.status === 'LIVE' || p.publishedAt);
    const inProgress = activeProjects.filter(p => p.hasGenerated && p.status !== 'LIVE' && !p.publishedAt);
    const pending = activeProjects.filter(p => !p.hasGenerated);

    const totalActive = activeProjects.length;

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Moji Projekti</h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
                        {totalActive} {totalActive === 1 ? 'projekt' : 'projekata'} • {published.length} objavljeno
                    </p>
                </div>
                <Link
                    id="tour-new-project"
                    href="/dashboard/new-project"
                    className="px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all text-sm hover:scale-105 active:scale-95"
                    style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Novi projekt</span>
                </Link>
            </div>

            {totalActive === 0 && cancelledProjects.length === 0 ? (
                <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--lp-bg-alt)', border: '1px dashed var(--lp-border)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--lp-surface)' }}>
                        <LayoutDashboard size={28} style={{ color: 'var(--lp-text-muted)' }} />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--lp-heading)' }}>Nemate aktivnih projekata</h3>
                    <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--lp-text-muted)' }}>
                        Započnite svoje putovanje odabirom paketa i kreiranjem prve web stranice.
                    </p>
                    <Link
                        href="/dashboard/new-project"
                        className="font-semibold text-sm px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 hover:scale-105"
                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
                    >
                        <Zap size={15} /> Kreiraj prvi projekt
                    </Link>
                </div>
            ) : (
                <>
                    {/* Three-column layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                        {/* Published */}
                        <div>
                            <ColumnHeader icon={Globe} title="Objavljene" count={published.length} color={COLUMN_COLORS.published.headerBg} />
                            {published.length > 0 ? (
                                <div className="space-y-3">
                                    {published.map(p => (
                                        <ProjectCard key={p.id} project={p} colorScheme={COLUMN_COLORS.published} onRenew={handleRenew} renewingProjectId={renewingProjectId} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl p-6 text-center" style={{ border: '1px dashed var(--lp-border)' }}>
                                    <Globe size={20} className="mx-auto mb-2" style={{ color: 'var(--lp-text-muted)' }} />
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Nema objavljenih stranica</p>
                                </div>
                            )}
                        </div>

                        {/* In Progress */}
                        <div>
                            <ColumnHeader icon={Pencil} title="U izradi" count={inProgress.length} color={COLUMN_COLORS.inProgress.headerBg} />
                            {inProgress.length > 0 ? (
                                <div className="space-y-3">
                                    {inProgress.map(p => (
                                        <ProjectCard key={p.id} project={p} colorScheme={COLUMN_COLORS.inProgress} onRenew={handleRenew} renewingProjectId={renewingProjectId} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl p-6 text-center" style={{ border: '1px dashed var(--lp-border)' }}>
                                    <Pencil size={20} className="mx-auto mb-2" style={{ color: 'var(--lp-text-muted)' }} />
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Nema stranica u izradi</p>
                                </div>
                            )}
                        </div>

                        {/* Pending */}
                        <div>
                            <ColumnHeader icon={Sparkles} title="Čekaju generiranje" count={pending.length} color={COLUMN_COLORS.pending.headerBg} />
                            {pending.length > 0 ? (
                                <div className="space-y-3">
                                    {pending.map(p => (
                                        <ProjectCard key={p.id} project={p} colorScheme={COLUMN_COLORS.pending} onRenew={handleRenew} renewingProjectId={renewingProjectId} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl p-6 text-center" style={{ border: '1px dashed var(--lp-border)' }}>
                                    <Sparkles size={20} className="mx-auto mb-2" style={{ color: 'var(--lp-text-muted)' }} />
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Sve stranice su generirane</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cancelled */}
                    {cancelledProjects.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--lp-heading)' }}>
                                <Clock size={15} className="text-amber-400" />
                                Otkazani projekti
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-muted)' }}>
                                    {cancelledProjects.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {cancelledProjects.map(p => (
                                    <ProjectCard key={p.id} project={p} colorScheme={null} onRenew={handleRenew} renewingProjectId={renewingProjectId} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
