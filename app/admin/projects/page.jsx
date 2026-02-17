'use client';

import { useEffect, useState } from 'react';
import { Search, Code2, Eye, Save, X, CheckCircle, AlertCircle, ExternalLink, User, Pencil, Sparkles } from 'lucide-react';
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
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(data => setProjects(data.projects || []))
            .catch(err => console.error('Admin projects error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProjects();
    };

    const openEditor = async (projectId) => {
        try {
            const res = await fetch(`/api/admin/projects/${projectId}`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            setEditingProject(data.project);
            setEditHtml(data.project.generatedHtml || '');
            setSaveMsg(null);
        } catch (e) {
            console.error('Failed to load project:', e);
        }
    };

    const saveHtml = async () => {
        if (!editingProject) return;
        setSaving(true);
        setSaveMsg(null);
        try {
            const res = await fetch(`/api/admin/projects/${editingProject.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generatedHtml: editHtml }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.details || `Status ${res.status}`);
            }
            const data = await res.json();
            setSaveMsg({ type: 'success', text: 'HTML uspješno spremljen!' });
            // Update local project list
            setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, generatedHtml: editHtml } : p));
            setTimeout(() => setSaveMsg(null), 4000);
        } catch (e) {
            console.error('Save failed:', e);
            setSaveMsg({ type: 'error', text: `Greška: ${e.message}` });
        }
        setSaving(false);
    };

    const statusColors = {
        DRAFT: 'bg-zinc-700/30 text-zinc-400',
        SUBMITTED: 'bg-blue-500/20 text-blue-400',
        GENERATED: 'bg-green-500/20 text-green-400',
        PUBLISHED: 'bg-purple-500/20 text-purple-400',
        LIVE: 'bg-emerald-500/20 text-emerald-400',
        CANCELLED: 'bg-red-500/20 text-red-400',
    };

    // HTML Editor Modal
    if (editingProject) {
        return (
            <div className="h-screen flex flex-col">
                {/* Editor Toolbar */}
                <div className="bg-black border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setEditingProject(null); setEditHtml(''); setSaveMsg(null); }}
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div>
                            <h2 className="text-white font-semibold text-sm">{editingProject.name}</h2>
                            <p className="text-xs text-zinc-500">{editingProject.user?.email} · {editingProject.id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {saveMsg && (
                            <div className={`flex items-center gap-1.5 text-xs ${saveMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {saveMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {saveMsg.text}
                            </div>
                        )}
                        <Link
                            href={`/dashboard/projects/${editingProject.id}/editor`}
                            target="_blank"
                            className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white text-sm rounded-lg transition-colors border border-zinc-700 hover:border-zinc-600"
                        >
                            <Pencil size={14} />
                            AI Editor
                        </Link>
                        <button
                            onClick={saveHtml}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Save size={14} />
                            {saving ? 'Spremam...' : 'Spremi HTML'}
                        </button>
                    </div>
                </div>

                {/* Editor Body (Split: Code + Preview) */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Code Editor */}
                    <div className="w-1/2 border-r border-zinc-800 flex flex-col">
                        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                            <Code2 size={12} />
                            <span>HTML Editor</span>
                            <span className="ml-auto">{editHtml.length.toLocaleString()} znakova</span>
                        </div>
                        <textarea
                            value={editHtml}
                            onChange={(e) => setEditHtml(e.target.value)}
                            className="flex-1 p-4 bg-[#0a0a0a] text-green-400 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                            spellCheck={false}
                        />
                    </div>

                    {/* Live Preview */}
                    <div className="w-1/2 flex flex-col">
                        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                            <Eye size={12} />
                            <span>Preview</span>
                        </div>
                        <iframe
                            srcDoc={editHtml}
                            className="flex-1 bg-white"
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projekti</h1>
                    <p className="text-zinc-500 mt-1">{projects.length} ukupno</p>
                </div>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Pretraži projekte ili korisnike..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 w-72"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors">
                        Traži
                    </button>
                </form>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-500">
                            <th className="px-5 py-3 font-medium">Projekt</th>
                            <th className="px-5 py-3 font-medium">Korisnik</th>
                            <th className="px-5 py-3 font-medium">Plan</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium">Tokeni</th>
                            <th className="px-5 py-3 font-medium">Akcije</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={6} className="px-5 py-4">
                                        <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : projects.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-zinc-600">
                                    Nema projekata
                                </td>
                            </tr>
                        ) : projects.map(proj => (
                            <tr key={proj.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-5 py-3">
                                    <p className="text-white font-medium">{proj.name}</p>
                                    <p className="text-xs text-zinc-600 font-mono">{proj.id}</p>
                                </td>
                                <td className="px-5 py-3">
                                    <p className="text-zinc-300 text-sm">{proj.user?.name || '—'}</p>
                                    <p className="text-xs text-zinc-500">{proj.user?.email}</p>
                                </td>
                                <td className="px-5 py-3 text-zinc-400">{proj.planName}</td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[proj.status] || statusColors.DRAFT}`}>
                                            {proj.status}
                                        </span>
                                        {proj.cancelledAt && (
                                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                                                OTKAZANO
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className="text-zinc-400 text-sm">{proj.editorTokens ?? '—'}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        {proj.hasGenerated && (
                                            <button
                                                onClick={() => openEditor(proj.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition-colors"
                                                title="Uredi HTML izravno"
                                            >
                                                <Code2 size={12} />
                                                HTML
                                            </button>
                                        )}
                                        <Link
                                            href={`/dashboard/projects/${proj.id}/content`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors"
                                            title="Pogledaj sadržaj projekta"
                                        >
                                            <Sparkles size={12} />
                                            Sadržaj
                                        </Link>
                                        {proj.hasGenerated && (
                                            <Link
                                                href={`/dashboard/projects/${proj.id}/editor`}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 rounded-md transition-colors"
                                                title="AI Editor"
                                            >
                                                <Pencil size={12} />
                                                Editor
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
    );
}
