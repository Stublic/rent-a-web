'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Trash2, Loader2, X, Image, ToggleLeft, ToggleRight, Edit2, Save, ExternalLink, Upload, RefreshCw } from 'lucide-react';

export default function ReferencesPage() {
    const [refs, setRefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [dragActive, setDragActive] = useState(false);
    const [replacingImageId, setReplacingImageId] = useState(null);
    const fileInputRef = useRef(null);
    const replaceInputRef = useRef(null);

    // Upload form state
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadIndustry, setUploadIndustry] = useState('');
    const [uploadStyle, setUploadStyle] = useState('');
    const [uploadTags, setUploadTags] = useState('');
    const [uploadSourceUrl, setUploadSourceUrl] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);

    const fetchRefs = async () => {
        try {
            const res = await fetch('/api/admin/references');
            const data = await res.json();
            if (data.references) setRefs(data.references);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRefs(); }, []);

    const handleFileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setUploadFile(file);
        setUploadPreview(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            if (uploadTitle) formData.append('title', uploadTitle);
            if (uploadIndustry) formData.append('industry', uploadIndustry);
            if (uploadStyle) formData.append('style', uploadStyle);
            if (uploadTags) formData.append('tags', uploadTags);
            if (uploadSourceUrl) formData.append('sourceUrl', uploadSourceUrl);

            const res = await fetch('/api/admin/references', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.reference) {
                setRefs(prev => [data.reference, ...prev]);
                resetUploadForm();
                setShowUpload(false);
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const resetUploadForm = () => {
        setUploadTitle('');
        setUploadIndustry('');
        setUploadStyle('');
        setUploadTags('');
        setUploadSourceUrl('');
        setUploadFile(null);
        setUploadPreview(null);
    };

    const toggleActive = async (id, isActive) => {
        try {
            const res = await fetch('/api/admin/references', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !isActive }),
            });
            const data = await res.json();
            if (data.reference) {
                setRefs(prev => prev.map(r => r.id === id ? data.reference : r));
            }
        } catch (err) { console.error(err); }
    };

    const deleteRef = async (id) => {
        if (!confirm('Obrisati ovu referencu?')) return;
        try {
            await fetch(`/api/admin/references?id=${id}`, { method: 'DELETE' });
            setRefs(prev => prev.filter(r => r.id !== id));
        } catch (err) { console.error(err); }
    };

    const startEdit = (ref) => {
        setEditingId(ref.id);
        setEditData({
            title: ref.title || '',
            industry: ref.industry || '',
            style: ref.style || '',
            tags: (ref.tags || []).join(', '),
            sourceUrl: ref.sourceUrl || '',
        });
    };

    const saveEdit = async () => {
        try {
            const res = await fetch('/api/admin/references', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, ...editData }),
            });
            const data = await res.json();
            if (data.reference) {
                setRefs(prev => prev.map(r => r.id === editingId ? data.reference : r));
            }
            setEditingId(null);
        } catch (err) { console.error(err); }
    };

    const replaceImage = async (refId, file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setReplacingImageId(refId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('id', refId);
            const res = await fetch('/api/admin/references', { method: 'PUT', body: formData });
            const data = await res.json();
            if (data.reference) {
                setRefs(prev => prev.map(r => r.id === refId ? data.reference : r));
            } else {
                alert(data.error || 'Zamjena slike nije uspjela');
            }
        } catch (err) {
            console.error(err);
            alert('Zamjena slike nije uspjela');
        } finally {
            setReplacingImageId(null);
        }
    };

    // Drag handlers for upload modal
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
        if (file) handleFileSelect(file);
    }, []);

    const inputStyle = {
        background: 'var(--lp-surface)',
        border: '1px solid var(--lp-border)',
        color: 'var(--lp-heading)',
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-7 rounded w-48" style={{ background: 'var(--lp-surface)' }} />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[4/3] rounded-xl" style={{ background: 'var(--lp-surface)' }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 db-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Dizajn Reference</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
                        {refs.length} referenc{refs.length === 1 ? 'a' : refs.length < 5 ? 'e' : 'i'} • {refs.filter(r => r.isActive).length} aktivn{refs.filter(r => r.isActive).length === 1 ? 'a' : 'ih'}
                    </p>
                </div>
                <button onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                    style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                    <Plus size={16} /> Dodaj
                </button>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => { setShowUpload(false); resetUploadForm(); }}
                    onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>

                    {dragActive && (
                        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
                            style={{ background: 'rgba(34,197,94,0.12)', border: '3px dashed rgba(34,197,94,0.6)' }}>
                            <div className="text-center">
                                <Upload size={48} style={{ color: 'rgba(34,197,94,0.8)' }} className="mx-auto mb-3" />
                                <p className="text-lg font-bold" style={{ color: 'rgba(34,197,94,0.9)' }}>Ispustite sliku ovdje</p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                        style={{ background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)' }}
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                            <h3 className="text-base font-bold" style={{ color: 'var(--lp-heading)' }}>Nova Referenca</h3>
                            <button onClick={() => { setShowUpload(false); resetUploadForm(); }}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X size={18} style={{ color: 'var(--lp-text-muted)' }} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Image Upload */}
                            <input ref={fileInputRef} type="file" accept="image/*"
                                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                                style={{ display: 'none' }} />

                            {uploadPreview ? (
                                <div className="relative rounded-xl overflow-hidden aspect-[16/9]">
                                    <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors">
                                        <X size={14} className="text-white" />
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-xl p-8 text-center cursor-pointer transition-all hover:scale-[1.01]"
                                    style={{ border: '2px dashed var(--lp-border)', background: 'var(--lp-surface)' }}
                                    onClick={() => fileInputRef.current?.click()}>
                                    <Image size={32} className="mx-auto mb-3" style={{ color: 'var(--lp-text-muted)' }} />
                                    <p className="text-sm font-semibold" style={{ color: 'var(--lp-heading)' }}>Klikni za upload ili povuci sliku</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--lp-text-muted)' }}>Screenshot web stranice (JPG, PNG, WebP)</p>
                                </div>
                            )}

                            {/* Metadata Fields */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--lp-text-muted)' }}>Naziv (opcionalno)</label>
                                    <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                                        placeholder="npr. Moderni Restoran" className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                                        style={inputStyle} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--lp-text-muted)' }}>Industrija</label>
                                        <input type="text" value={uploadIndustry} onChange={e => setUploadIndustry(e.target.value)}
                                            placeholder="npr. Ugostiteljstvo" className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                                            style={inputStyle} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--lp-text-muted)' }}>Stil</label>
                                        <input type="text" value={uploadStyle} onChange={e => setUploadStyle(e.target.value)}
                                            placeholder="npr. minimalist, bold" className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                                            style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--lp-text-muted)' }}>Tagovi (odvojeni zarezom)</label>
                                    <input type="text" value={uploadTags} onChange={e => setUploadTags(e.target.value)}
                                        placeholder="npr. restoran, tamna, moderna, food" className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--lp-text-muted)' }}>Izvorni URL (opcionalno)</label>
                                    <input type="text" value={uploadSourceUrl} onChange={e => setUploadSourceUrl(e.target.value)}
                                        placeholder="https://example.com" className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                                        style={inputStyle} />
                                </div>
                            </div>

                            <button onClick={handleUpload} disabled={!uploadFile || uploading}
                                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                                {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploadam...</> : <><Plus size={16} /> Spremi Referencu</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* References Grid */}
            {refs.length === 0 ? (
                <div className="text-center py-20">
                    <Image size={40} className="mx-auto mb-4" style={{ color: 'var(--lp-text-muted)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--lp-text-muted)' }}>Nema dizajn referenci</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--lp-text-muted)' }}>Kliknite &quot;Dodaj&quot; za upload screenshot-ova web stranica</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {refs.map(ref => (
                        <div key={ref.id} className="db-card overflow-hidden group"
                            style={{ opacity: ref.isActive ? 1 : 0.5 }}>
                            {/* Image */}
                            <div className="relative aspect-[16/9] overflow-hidden">
                                <img src={ref.imageUrl} alt={ref.title || 'Reference'} className="w-full h-full object-cover object-top" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Replace image loading overlay */}
                                {replacingImageId === ref.id && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                        <div className="text-center">
                                            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-white" />
                                            <p className="text-xs text-white font-medium">Zamjena slike...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Replace image button (visible in edit mode) */}
                                {editingId === ref.id && !replacingImageId && (
                                    <button
                                        onClick={() => replaceInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 transition-opacity hover:bg-black/60 cursor-pointer"
                                    >
                                        <div className="text-center">
                                            <RefreshCw size={24} className="mx-auto mb-2 text-white" />
                                            <p className="text-xs text-white font-bold">Zamijeni sliku</p>
                                        </div>
                                    </button>
                                )}

                                {/* Overlay actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleActive(ref.id, ref.isActive)}
                                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors" title={ref.isActive ? 'Deaktiviraj' : 'Aktiviraj'}>
                                        {ref.isActive ? <ToggleRight size={14} className="text-emerald-400" /> : <ToggleLeft size={14} className="text-gray-400" />}
                                    </button>
                                    <button onClick={() => startEdit(ref)}
                                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors" title="Uredi">
                                        <Edit2 size={14} className="text-white" />
                                    </button>
                                    <button onClick={() => deleteRef(ref.id)}
                                        className="p-1.5 rounded-lg bg-black/60 hover:bg-red-600/80 transition-colors" title="Obriši">
                                        <Trash2 size={14} className="text-white" />
                                    </button>
                                </div>

                                {!ref.isActive && (
                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800/80 text-gray-400">
                                        NEAKTIVNA
                                    </div>
                                )}

                                {/* Hidden file input for image replacement */}
                                <input ref={editingId === ref.id ? replaceInputRef : undefined}
                                    type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => { if (e.target.files?.[0]) { replaceImage(ref.id, e.target.files[0]); e.target.value = ''; } }} />
                            </div>

                            {/* Info */}
                            <div className="p-3.5">
                                {editingId === ref.id ? (
                                    <div className="space-y-2">
                                        <input value={editData.title} onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Naziv" className="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={inputStyle} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input value={editData.industry} onChange={e => setEditData(prev => ({ ...prev, industry: e.target.value }))}
                                                placeholder="Industrija" className="rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={inputStyle} />
                                            <input value={editData.style} onChange={e => setEditData(prev => ({ ...prev, style: e.target.value }))}
                                                placeholder="Stil" className="rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={inputStyle} />
                                        </div>
                                        <input value={editData.tags} onChange={e => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                                            placeholder="Tagovi (zarezom)" className="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={inputStyle} />
                                        <div className="flex gap-2">
                                            <button onClick={saveEdit} className="flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                                                style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                                                <Save size={12} /> Spremi
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs"
                                                style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }}>
                                                Odustani
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--lp-heading)' }}>
                                                {ref.title || 'Bez naziva'}
                                            </p>
                                            {ref.sourceUrl && (
                                                <a href={ref.sourceUrl} target="_blank" rel="noopener noreferrer"
                                                    className="p-1 hover:bg-white/5 rounded transition-colors flex-shrink-0">
                                                    <ExternalLink size={12} style={{ color: 'var(--lp-text-muted)' }} />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] mb-2" style={{ color: 'var(--lp-text-muted)' }}>
                                            {ref.industry && <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>{ref.industry}</span>}
                                            {ref.style && <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>{ref.style}</span>}
                                        </div>
                                        {ref.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {ref.tags.map((tag, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px]"
                                                        style={{ background: 'rgba(34,197,94,0.1)', color: 'rgba(34,197,94,0.8)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
