"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, X, Upload, Image, FolderOpen, Search } from "lucide-react";

/**
 * Reusable Media Picker Popup.
 * Shows library of existing images + upload tab with drag-and-drop.
 *
 * Props:
 *  - projectId: string
 *  - onClose: () => void
 *  - onMediaSelected: (mediaItem: { url, filename, type, ... }) => void
 *  - imagesOnly?: boolean  (default true — filter to images only)
 */
export default function MediaPickerPopup({ projectId, onClose, onMediaSelected, imagesOnly = true }) {
    const [tab, setTab] = useState('library'); // 'library' | 'upload'
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const res = await fetch('/api/media');
                const data = await res.json();
                if (data.media) {
                    setMedia(imagesOnly
                        ? data.media.filter(m => m.type.startsWith('image/'))
                        : data.media
                    );
                }
            } catch (err) { console.error("Failed to fetch media", err); }
            finally { setLoading(false); }
        };
        fetchMedia();
    }, [imagesOnly]);

    const filtered = searchQuery
        ? media.filter(m => m.filename.toLowerCase().includes(searchQuery.toLowerCase()))
        : media;

    // Upload handler (for both button and drag-drop)
    const handleUpload = async (file) => {
        if (!file) return;
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(isVideo ? 'Video je prevelik (max 50MB)' : 'Datoteka je prevelika (max 10MB)');
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', projectId);
            const res = await fetch('/api/media', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok && data.media) {
                onMediaSelected(data.media);
                onClose();
            } else {
                alert(data.error || 'Upload nije uspio');
            }
        } catch {
            alert('Upload nije uspio. Pokušajte ponovno.');
        } finally {
            setUploading(false);
        }
    };

    // Drag handlers
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer?.files?.[0];
        if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
            handleUpload(file);
        }
    }, []);

    // ESC to close
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}>

            {/* Drag overlay */}
            {dragActive && (
                <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '3px dashed rgba(34,197,94,0.6)' }}>
                    <div className="text-center">
                        <Upload size={48} style={{ color: 'rgba(34,197,94,0.8)' }} className="mx-auto mb-3" />
                        <p className="text-lg font-bold" style={{ color: 'rgba(34,197,94,0.9)' }}>Ispustite datoteku ovdje</p>
                        <p className="text-sm mt-1" style={{ color: 'rgba(34,197,94,0.6)' }}>Slika ili video</p>
                    </div>
                </div>
            )}

            <div className="rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
                style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                    <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--lp-heading)' }}>Odaberi sliku</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>Odaberite iz knjižnice ili uploadajte novu datoteku</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={18} style={{ color: 'var(--lp-text-muted)' }} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-5 pt-3 gap-1">
                    <button onClick={() => setTab('library')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={tab === 'library'
                            ? { background: 'var(--lp-heading)', color: 'var(--lp-bg)' }
                            : { background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }
                        }>
                        <FolderOpen size={14} /> Knjižnica
                    </button>
                    <button onClick={() => setTab('upload')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={tab === 'upload'
                            ? { background: 'var(--lp-heading)', color: 'var(--lp-bg)' }
                            : { background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }
                        }>
                        <Upload size={14} /> Upload
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {tab === 'library' ? (
                        <>
                            {/* Search */}
                            <div className="mb-4">
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Pretraži po nazivu..."
                                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }} />
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--lp-text-muted)' }} />
                                </div>
                            ) : filtered.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {filtered.map(item => (
                                        <button key={item.id} type="button"
                                            onClick={() => { onMediaSelected(item); onClose(); }}
                                            className="group relative aspect-square rounded-xl overflow-hidden border-2 hover:border-emerald-500 transition-all focus:outline-none"
                                            style={{ borderColor: 'var(--lp-border)' }}>
                                            <img src={item.url} alt={item.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                                                <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs truncate font-medium">{item.filename}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <Image size={28} className="mx-auto mb-3" style={{ color: 'var(--lp-text-muted)' }} />
                                    <p className="text-sm font-medium" style={{ color: 'var(--lp-text-muted)' }}>{searchQuery ? "Nema rezultata" : "Nema uploadanih slika"}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--lp-text-muted)' }}>{searchQuery ? "Pokušajte s drugim pojmom" : "Prebacite se na Upload tab"}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Upload tab */
                        <div className="flex flex-col items-center justify-center py-12">
                            <input ref={fileInputRef} type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                                onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ''; }}
                                style={{ display: 'none' }} />

                            {uploading ? (
                                <div className="text-center">
                                    <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--lp-accent-green)' }} />
                                    <p className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>Uploadam...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-full max-w-sm rounded-2xl p-8 text-center cursor-pointer transition-all hover:scale-[1.02]"
                                        style={{ border: '2px dashed var(--lp-border)', background: 'var(--lp-surface)' }}
                                        onClick={() => fileInputRef.current?.click()}>
                                        <Upload size={32} className="mx-auto mb-3" style={{ color: 'var(--lp-text-muted)' }} />
                                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--lp-heading)' }}>
                                            Klikni za upload
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>
                                            ili povuci datoteku bilo gdje na ekran
                                        </p>
                                        <p className="text-[10px] mt-3" style={{ color: 'var(--lp-text-muted)' }}>
                                            JPG, PNG, GIF, WebP • Max 10MB
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
