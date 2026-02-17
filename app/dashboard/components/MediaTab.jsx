"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Copy, Image, Film, FileText, Loader2, Check, X, FolderOpen } from "lucide-react";

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type) {
    if (type.startsWith('image/')) return <Image size={20} className="text-blue-400" />;
    if (type.startsWith('video/')) return <Film size={20} className="text-purple-400" />;
    return <FileText size={20} className="text-zinc-400" />;
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

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    useEffect(() => {
        // Fetch projects for the filter dropdown
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

                const res = await fetch('/api/media', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();
                if (data.error) {
                    alert(data.error);
                } else if (data.media) {
                    setMedia(prev => [data.media, ...prev]);
                }
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
            if (data.success) {
                setMedia(prev => prev.filter(m => m.id !== id));
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleCopyUrl = (id, url) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    return (
        <div className="max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Media Knjižnica</h2>
                    <p className="text-zinc-500 text-sm mt-1">Uploadajte slike, videa i dokumente za vaše projekte</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterProject}
                        onChange={(e) => { setFilterProject(e.target.value); setLoading(true); }}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-green-500"
                    >
                        <option value="">Svi projekti</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
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
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    dragOver
                        ? 'border-green-500 bg-green-500/5'
                        : 'border-zinc-800 hover:border-zinc-700'
                }`}
            >
                <Upload size={32} className={`mx-auto mb-3 ${dragOver ? 'text-green-500' : 'text-zinc-600'}`} />
                <p className="text-zinc-400 text-sm">
                    Povucite datoteke ovdje ili{' '}
                    <button onClick={() => fileInputRef.current?.click()} className="text-green-500 hover:text-green-400 font-medium">
                        odaberite sa računala
                    </button>
                </p>
                <p className="text-zinc-600 text-xs mt-2">Slike, videa, PDF — max 10MB</p>
            </div>

            {/* Upload Progress */}
            {uploading && (
                <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <Loader2 size={20} className="animate-spin text-green-500" />
                    <span className="text-green-400 text-sm font-medium">Uploading...</span>
                </div>
            )}

            {/* Media Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-green-500" />
                </div>
            ) : media.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {media.map((item) => (
                        <div
                            key={item.id}
                            className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
                        >
                            {/* Preview */}
                            <div className="aspect-square relative bg-zinc-950 flex items-center justify-center">
                                {item.type.startsWith('image/') ? (
                                    <img
                                        src={item.url}
                                        alt={item.filename}
                                        className="w-full h-full object-cover"
                                    />
                                ) : item.type.startsWith('video/') ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Film size={40} className="text-purple-400" />
                                        <span className="text-xs text-zinc-500">Video</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText size={40} className="text-zinc-500" />
                                        <span className="text-xs text-zinc-500">PDF</span>
                                    </div>
                                )}

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handleCopyUrl(item.id, item.url)}
                                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                                        title="Kopiraj URL"
                                    >
                                        {copiedId === item.id ? (
                                            <Check size={16} className="text-green-500" />
                                        ) : (
                                            <Copy size={16} className="text-zinc-300" />
                                        )}
                                    </button>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                                        title="Otvori"
                                    >
                                        <FolderOpen size={16} className="text-zinc-300" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-zinc-800 rounded-lg hover:bg-red-900/50 transition-colors"
                                        title="Obriši"
                                    >
                                        <Trash2 size={16} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <p className="text-sm text-white truncate font-medium" title={item.filename}>
                                    {item.filename}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-zinc-500">{formatFileSize(item.size)}</span>
                                    <span className="text-xs text-zinc-600">
                                        {new Date(item.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Image size={28} className="text-zinc-600" />
                    </div>
                    <h4 className="font-bold text-lg text-white mb-2">Nema uploadanih datoteka</h4>
                    <p className="text-zinc-500 text-sm mb-6">Uploadajte slike, videa ili dokumente za vaše web stranice.</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2"
                    >
                        <Upload size={18} /> Upload datoteke
                    </button>
                </div>
            )}

            {/* Stats */}
            {media.length > 0 && (
                <div className="flex items-center gap-6 text-sm text-zinc-500 border-t border-zinc-800 pt-4">
                    <span>{media.length} {media.length === 1 ? 'datoteka' : 'datoteka'}</span>
                    <span>•</span>
                    <span>{formatFileSize(media.reduce((acc, m) => acc + m.size, 0))} ukupno</span>
                </div>
            )}
        </div>
    );
}
