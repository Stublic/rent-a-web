'use client';

import { useState, useEffect } from 'react';
import { Bug, Clock, Loader2, CheckCircle, AlertTriangle, Trash2, RefreshCw, User as UserIcon } from 'lucide-react';

const SEVERITY_CONFIG = {
    low: { label: 'Nizak', color: '#3b82f6', emoji: '🔵' },
    medium: { label: 'Srednji', color: '#f59e0b', emoji: '🟡' },
    high: { label: 'Visok', color: '#f97316', emoji: '🟠' },
    critical: { label: 'Kritičan', color: '#ef4444', emoji: '🔴' },
};

const STATUS_CONFIG = {
    OPEN: { label: 'Otvoren', color: '#3b82f6', icon: Clock, next: 'IN_PROGRESS', nextLabel: '▶ U tijeku' },
    IN_PROGRESS: { label: 'U tijeku', color: '#f59e0b', icon: AlertTriangle, next: 'RESOLVED', nextLabel: '✅ Riješi' },
    RESOLVED: { label: 'Riješen', color: '#22c55e', icon: CheckCircle, next: 'OPEN', nextLabel: '🔄 Ponovo otvori' },
};

export default function AdminBugReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/bug-reports');
            const data = await res.json();
            if (data.reports) setReports(data.reports);
        } catch (err) {
            console.error('Failed to load bug reports:', err);
        }
        setLoading(false);
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await fetch('/api/admin/bug-reports', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Obrisati ovaj bug report?')) return;
        try {
            await fetch('/api/admin/bug-reports', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const filtered = statusFilter === 'ALL' ? reports : reports.filter(r => r.status === statusFilter);
    const counts = {
        ALL: reports.length,
        OPEN: reports.filter(r => r.status === 'OPEN').length,
        IN_PROGRESS: reports.filter(r => r.status === 'IN_PROGRESS').length,
        RESOLVED: reports.filter(r => r.status === 'RESOLVED').length,
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--lp-heading)' }}>Bug Reportovi</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--lp-text-muted)' }}>
                        Prijave grešaka od beta testera
                    </p>
                </div>
                <button onClick={fetchReports} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'var(--lp-text-muted)' }}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {Object.entries({ ALL: 'Sve', OPEN: '🔵 Otvoreni', IN_PROGRESS: '🟡 U tijeku', RESOLVED: '✅ Riješeni' }).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: statusFilter === key ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: statusFilter === key ? 'var(--lp-heading)' : 'var(--lp-text-muted)',
                            border: `1px solid ${statusFilter === key ? 'var(--lp-border)' : 'transparent'}`,
                        }}
                    >
                        {label} ({counts[key] || 0})
                    </button>
                ))}
            </div>

            {/* Reports */}
            {loading && reports.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20" style={{ color: 'var(--lp-text-muted)' }}>
                    <Bug size={40} strokeWidth={1.5} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Nema bug reportova za prikazati</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((report) => {
                        const sev = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.medium;
                        const st = STATUS_CONFIG[report.status] || STATUS_CONFIG.OPEN;
                        const StatusIcon = st.icon;

                        return (
                            <div
                                key={report.id}
                                className="rounded-xl p-5 transition-all"
                                style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                            >
                                {/* Header Row */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--lp-heading)' }}>
                                            {report.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: `${st.color}15`, color: st.color }}>
                                                <StatusIcon size={11} /> {st.label}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded" style={{ background: `${sev.color}15`, color: sev.color }}>
                                                {sev.emoji} {sev.label}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <UserIcon size={11} />
                                                {report.user?.name || report.user?.email}
                                            </span>
                                            {report.page && <span>📍 {report.page}</span>}
                                            <span>
                                                {new Date(report.createdAt).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => updateStatus(report.id, st.next)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                                            style={{ background: `${STATUS_CONFIG[st.next]?.color || st.color}15`, color: STATUS_CONFIG[st.next]?.color || st.color }}
                                        >
                                            {st.nextLabel}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(report.id)}
                                            className="p-1.5 rounded-lg text-xs transition-all hover:bg-red-500/10"
                                            style={{ color: 'var(--lp-text-muted)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="text-sm whitespace-pre-wrap rounded-lg px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--lp-text-secondary)' }}>
                                    {report.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
