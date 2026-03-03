"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Copy, Image, Film, FileText, Check, FolderOpen } from "lucide-react";
import { TabLoader, ButtonLoader } from "./DashboardLoader";

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaTab() {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [filterProject, setFilterProject] = useState('');
    const fileInputRef = useRef(null);

    const fetchMedia = useCallback(async () => {
        try {
            const url = filterProject ? `/api/media?projectId=${filterProject}` : '/api/media';
            const res = await fetch(url);
            const data = await res.json();
            if (data.media) setMedia(data.media);
        } catch (err) {
            console.error("Failed to fetch media", err);
        } finally {
            setLoading(false);
        }
    }, [filterProject]);

    useEffect(() => { fetchMedia(); }, [fetchMedia]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects');
                const data = await res.json();
                if (Array.isArray(data)) setProjects(data);
                else if (data.projects) setProjects(data.projects);
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }
        };
        fetchProjects();
    }, []);

    const handleUpload = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                if (filterProject) formData.append('projectId', filterProject);

                const res = await fetch('/api/media', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.error) alert(data.error);
                else if (data.media) setMedia(prev => [data.media, ...prev]);
            } catch (err) {
                console.error("Upload failed:", err);
                alert("Greška pri uploadu datoteke.");
            }
        }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm("Jeste li sigurni da želite obrisati ovu datoteku?")) return;
        try {
            const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setMedia(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleCopyUrl = (id, url) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); };
    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };

    return (
        <div className="max-w-5xl space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Media Knjižnica</h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
                        Uploadajte slike, videa i dokumente za vaše projekte
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterProject}
                        onChange={(e) => { setFilterProject(e.target.value); setLoading(true); }}
                        className="rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                        style={{
                            background: 'var(--lp-surface)',
                            border: '1px solid var(--lp-border)',
                            color: 'var(--lp-text-secondary)',
                        }}
                    >
                        <option value="">Svi projekti</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105"
                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
                    >
                        {uploading ? <ButtonLoader size={16} /> : <Upload size={16} />}
                        Upload
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files)}
                    />
                </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOver(false)}
                className="rounded-2xl p-8 text-center transition-all"
                style={{
                    border: `2px dashed ${dragOver ? '#fafafa' : 'var(--lp-border)'}`,
                    background: dragOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                }}
            >
                <Upload size={28} className="mx-auto mb-3" style={{ color: dragOver ? 'var(--lp-heading)' : 'var(--lp-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--lp-text-secondary)' }}>
                    Povucite datoteke ovdje ili{' '}
                    <button onClick={() => fileInputRef.current?.click()} className="font-medium hover:opacity-80" style={{ color: 'var(--lp-heading)' }}>
                        odaberite sa računala
                    </button>
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--lp-text-muted)' }}>Slike, videa, PDF — max 10MB</p>
            </div>

            {/* Upload Progress */}
            {uploading && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lp-border)' }}>
                    <ButtonLoader size={18} />
                    <span className="text-sm font-medium" style={{ color: 'var(--lp-text-secondary)' }}>Uploading...</span>
                </div>
            )}

            {/* Media Grid */}
            {loading ? (
                <TabLoader message="Učitavanje media..." />
            ) : media.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {media.map((item) => (
                        <div
                            key={item.id}
                            className="group relative rounded-xl overflow-hidden transition-all"
                            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                        >
                            <div className="aspect-square relative flex items-center justify-center" style={{ background: 'var(--lp-bg)' }}>
                                {item.type.startsWith('image/') ? (
                                    <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                                ) : item.type.startsWith('video/') ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Film size={36} className="text-purple-400" />
                                        <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>Video</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText size={36} style={{ color: 'var(--lp-text-muted)' }} />
                                        <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>PDF</span>
                                    </div>
                                )}

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleCopyUrl(item.id, item.url)}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ background: 'var(--lp-surface)' }}
                                        title="Kopiraj URL"
                                    >
                                        {copiedId === item.id ? (
                                            <Check size={14} className="text-emerald-400" />
                                        ) : (
                                            <Copy size={14} style={{ color: 'var(--lp-text-secondary)' }} />
                                        )}
                                    </button>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ background: 'var(--lp-surface)' }}
                                        title="Otvori"
                                    >
                                        <FolderOpen size={14} style={{ color: 'var(--lp-text-secondary)' }} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 rounded-lg transition-colors hover:bg-red-900/50"
                                        style={{ background: 'var(--lp-surface)' }}
                                        title="Obriši"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-2.5">
                                <p className="text-xs truncate font-medium" style={{ color: 'var(--lp-heading)' }} title={item.filename}>
                                    {item.filename}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{formatFileSize(item.size)}</span>
                                    <span className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                        {new Date(item.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    className="text-center py-16 rounded-2xl"
                    style={{ background: 'var(--lp-bg-alt)', border: '1px dashed var(--lp-border)' }}
                >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--lp-surface)' }}>
                        <Image size={28} style={{ color: 'var(--lp-text-muted)' }} />
                    </div>
                    <h4 className="font-bold text-base mb-2" style={{ color: 'var(--lp-heading)' }}>Nema uploadanih datoteka</h4>
                    <p className="text-sm mb-6" style={{ color: 'var(--lp-text-muted)' }}>
                        Uploadajte slike, videa ili dokumente za vaše web stranice.
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="font-semibold text-sm px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 hover:scale-105"
                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}
                    >
                        <Upload size={16} /> Upload datoteke
                    </button>
                </div>
            )}

            {/* Stats */}
            {media.length > 0 && (
                <div className="flex items-center gap-4 text-sm pt-3" style={{ color: 'var(--lp-text-muted)', borderTop: '1px solid var(--lp-border)' }}>
                    <span>{media.length} {media.length === 1 ? 'datoteka' : 'datoteka'}</span>
                    <span>•</span>
                    <span>{formatFileSize(media.reduce((acc, m) => acc + m.size, 0))} ukupno</span>
                </div>
            )}
        </div>
    );
}
