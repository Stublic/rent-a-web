'use client';

import { useEffect, useState } from 'react';
import { Search, Code2, Eye, Save, X, CheckCircle, AlertCircle, Pencil, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingProject, setEditingProject] = useState(null);
    const [editHtml, setEditHtml] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);

    const fetchProjects = () => {
        setLoading(true);
        fetch(`/api/admin/projects?search=${encodeURIComponent(search)}&page=1`)
            .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.json(); })
            .then(data => setProjects(data.projects || []))
            .catch(err => console.error('Admin projects error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProjects(); }, []);
    const handleSearch = (e) => { e.preventDefault(); fetchProjects(); };

    const openEditor = async (projectId) => {
        try {
            const res = await fetch(`/api/admin/projects/${projectId}`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            setEditingProject(data.project); setEditHtml(data.project.generatedHtml || ''); setSaveMsg(null);
        } catch (e) { console.error('Failed to load project:', e); }
    };

    const saveHtml = async () => {
        if (!editingProject) return;
        setSaving(true); setSaveMsg(null);
        try {
            const res = await fetch(`/api/admin/projects/${editingProject.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generatedHtml: editHtml }) });
            if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.details || `Status ${res.status}`); }
            setSaveMsg({ type: 'success', text: 'HTML uspješno spremljen!' });
            setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, generatedHtml: editHtml } : p));
            setTimeout(() => setSaveMsg(null), 4000);
        } catch (e) { setSaveMsg({ type: 'error', text: `Greška: ${e.message}` }); }
        setSaving(false);
    };

    const statusColors = {
        DRAFT: 'bg-zinc-500/15 text-zinc-400',
        SUBMITTED: 'bg-blue-500/15 text-blue-400',
        GENERATED: 'bg-emerald-500/15 text-emerald-400',
        PUBLISHED: 'bg-purple-500/15 text-purple-400',
        LIVE: 'bg-emerald-500/15 text-emerald-400',
        CANCELLED: 'bg-red-500/15 text-red-400',
    };

    if (editingProject) {
        return (
            <div className="h-screen flex flex-col" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ background: 'var(--lp-bg-alt)', borderBottom: '1px solid var(--lp-border)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => { setEditingProject(null); setEditHtml(''); setSaveMsg(null); }} className="p-1.5 rounded-lg transition-colors hover:bg-white/5 shrink-0" style={{ color: 'var(--lp-text-muted)' }}><X size={18} /></button>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--lp-heading)' }}>{editingProject.name}</h2>
                            <p className="text-xs truncate" style={{ color: 'var(--lp-text-muted)' }}>{editingProject.user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {saveMsg && (
                            <div className={`flex items-center gap-1.5 text-xs ${saveMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {saveMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{saveMsg.text}
                            </div>
                        )}
                        <Link href={`/dashboard/projects/${editingProject.id}/editor`} target="_blank" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}>
                            <Pencil size={13} /> Webica AI Editor
                        </Link>
                        <button onClick={saveHtml} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 hover:scale-105" style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                            <Save size={14} />{saving ? 'Spremam...' : 'Spremi'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="md:w-1/2 flex flex-col min-h-[40vh] md:min-h-0" style={{ borderRight: '1px solid var(--lp-border)' }}>
                        <div className="px-4 py-2 flex items-center gap-2 text-xs" style={{ background: 'var(--lp-surface)', borderBottom: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
                            <Code2 size={12} /><span>HTML Editor</span><span className="ml-auto">{editHtml.length.toLocaleString()} znakova</span>
                        </div>
                        <textarea value={editHtml} onChange={(e) => setEditHtml(e.target.value)} className="flex-1 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none text-emerald-400" style={{ background: 'var(--lp-bg)' }} spellCheck={false} />
                    </div>
                    <div className="md:w-1/2 flex flex-col min-h-[40vh] md:min-h-0">
                        <div className="px-4 py-2 flex items-center gap-2 text-xs" style={{ background: 'var(--lp-surface)', borderBottom: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
                            <Eye size={12} /><span>Preview</span>
                        </div>
                        <iframe srcDoc={editHtml} className="flex-1 bg-white" sandbox="allow-scripts" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 db-fade-in">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Projekti</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>{projects.length} ukupno</p>
                </div>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--lp-text-muted)' }} />
                        <input type="text" placeholder="Pretraži..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl text-sm w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-white/20"
                            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                    </div>
                    <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:scale-105 shrink-0" style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>Traži</button>
                </form>
            </div>

            <div className="db-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                {['Projekt', 'Korisnik', 'Plan', 'Status', 'Tip pretplate', 'Tokeni', 'Akcije'].map(h => (
                                    <th key={h} className="px-4 py-3 font-medium text-left text-xs" style={{ color: 'var(--lp-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? [...Array(5)].map((_, i) => (
                                <tr key={i}><td colSpan={7} className="px-4 py-3.5"><div className="h-4 rounded animate-pulse" style={{ background: 'var(--lp-surface)' }} /></td></tr>
                            )) : projects.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--lp-text-muted)' }}>Nema projekata</td></tr>
                            ) : projects.map(proj => (
                            <tr key={proj.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-sm" style={{ color: 'var(--lp-heading)' }}>{proj.name}</p>
                                    <p className="text-[11px] font-mono" style={{ color: 'var(--lp-text-muted)' }}>{proj.id}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{proj.user?.name || '—'}</p>
                                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{proj.user?.email}</p>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{proj.planName}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[proj.status] || statusColors.DRAFT}`}>{proj.status}</span>
                                        {proj.cancelledAt && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400">OTKAZANO</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {proj.buyoutStatus === 'MAINTAINED' ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">Godišnja</span>
                                    ) : proj.buyoutStatus === 'EXPORTED_LOCKED' ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">Zaključano</span>
                                    ) : proj.cancelledAt ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400">Otkazano</span>
                                    ) : proj.stripeSubscriptionId ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">Mjesečna</span>
                                    ) : (
                                        <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Nema</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{proj.editorTokens ?? '—'}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        {proj.hasGenerated && (
                                            <button onClick={() => openEditor(proj.id)} className="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                                                <Code2 size={11} className="inline mr-1" />HTML
                                            </button>
                                        )}
                                        <Link href={`/dashboard/projects/${proj.id}/content`} className="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                                            <Sparkles size={11} className="inline mr-1" />Sadržaj
                                        </Link>
                                        {proj.hasGenerated && (
                                            <Link href={`/dashboard/projects/${proj.id}/editor`} className="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                                                <Pencil size={11} className="inline mr-1" />Editor
                                            </Link>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
