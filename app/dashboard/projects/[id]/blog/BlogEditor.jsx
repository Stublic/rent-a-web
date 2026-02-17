"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
    ArrowLeft, Save, Loader2, Sparkles, Bold, Italic, Heading1,
    Heading2, List, ListOrdered, Quote, Image as ImageIcon,
    Link2, Undo2, Redo2, Eye, EyeOff, Upload, FolderOpen, X,
    Tag, FolderPlus, Plus, ChevronDown
} from "lucide-react";

// MediaPickerModal (reuse pattern from ContentForm)
function MediaPickerModal({ onSelect, onClose }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const res = await fetch('/api/media');
                const data = await res.json();
                if (data.media) setMedia(data.media.filter(m => m.type.startsWith('image/')));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchMedia();
    }, []);

    const filtered = search ? media.filter(m => m.filename.toLowerCase().includes(search.toLowerCase())) : media;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h3 className="text-lg font-bold text-white">Odaberite sliku</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg"><X size={20} className="text-zinc-400" /></button>
                </div>
                <div className="px-5 py-3 border-b border-zinc-800/50">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pretraži..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500" />
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-green-500" /></div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {filtered.map(item => (
                                <button key={item.id} type="button" onClick={() => onSelect(item.url)}
                                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-800 hover:border-green-500 transition-all">
                                    <img src={item.url} alt={item.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                                        <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-xs truncate">{item.filename}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-600 text-sm text-center py-8">Nema slika</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Toolbar Button
function ToolbarButton({ onClick, active, disabled, children, title }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled} title={title}
            className={`p-2 rounded-lg transition-colors ${active ? 'bg-green-500/20 text-green-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'} ${disabled ? 'opacity-40' : ''}`}>
            {children}
        </button>
    );
}

export default function BlogEditor({ projectId, existingPost }) {
    const router = useRouter();
    const [title, setTitle] = useState(existingPost?.title || "");
    const [excerpt, setExcerpt] = useState(existingPost?.excerpt || "");
    const [coverImage, setCoverImage] = useState(existingPost?.coverImage || "");
    const [metaTitle, setMetaTitle] = useState(existingPost?.metaTitle || "");
    const [metaDescription, setMetaDescription] = useState(existingPost?.metaDescription || "");
    const [status, setStatus] = useState(existingPost?.status || "DRAFT");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(null); // null | 'cover' | 'editor'
    const [showSeo, setShowSeo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    // Category state
    const [categoryId, setCategoryId] = useState(existingPost?.categoryId || "");
    const [categories, setCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creatingCategory, setCreatingCategory] = useState(false);
    const categoryRef = useRef(null);

    // Tags state
    const [tags, setTags] = useState(
        existingPost?.tags ? existingPost.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    );
    const [tagInput, setTagInput] = useState("");

    // AI Generate state
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiKeywords, setAiKeywords] = useState("");
    const [aiTone, setAiTone] = useState("professional");
    const [aiLength, setAiLength] = useState("medium");
    const [generating, setGenerating] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            ImageExtension,
            Placeholder.configure({ placeholder: "Počnite pisati svoj članak..." }),
        ],
        content: existingPost?.content || "",
        editorProps: {
            attributes: {
                class: "prose prose-invert prose-green max-w-none min-h-[400px] focus:outline-none px-6 py-4 text-base leading-relaxed"
            }
        }
    });

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`/api/blog/categories?projectId=${projectId}`);
                const data = await res.json();
                if (data.categories) setCategories(data.categories);
            } catch (err) { console.error(err); }
        };
        fetchCategories();
    }, [projectId]);

    // Close category dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setShowCategoryDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const addImage = useCallback((url) => {
        if (editor) editor.chain().focus().setImage({ src: url }).run();
        setShowMediaPicker(null);
    }, [editor]);

    const addLink = useCallback(() => {
        const url = prompt("Unesite URL:");
        if (url && editor) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    }, [editor]);

    // Direct file upload for cover image
    const handleCoverUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setError('Slika je prevelika (max 10MB)'); return; }
        if (!file.type.startsWith('image/')) { setError('Samo slike su dozvoljene'); return; }

        setUploadingCover(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', projectId);
            const res = await fetch('/api/media', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload error');
            setCoverImage(data.media.url);
        } catch (err) { setError(err.message); }
        finally { setUploadingCover(false); }
    };

    // Create new category
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setCreatingCategory(true);
        try {
            const res = await fetch('/api/blog/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, name: newCategoryName.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Greška');
            setCategories(prev => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
            setCategoryId(data.category.id);
            setNewCategoryName("");
            setShowCategoryDropdown(false);
        } catch (err) { setError(err.message); }
        finally { setCreatingCategory(false); }
    };

    // Tags handlers
    const addTag = (value) => {
        const tag = value.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
            setTags(prev => [...prev, tag]);
        }
        setTagInput("");
    };

    const removeTag = (tagToRemove) => {
        setTags(prev => prev.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(prev => prev.slice(0, -1));
        }
    };

    const handleSave = async (publishStatus) => {
        if (!title.trim()) { setError("Naslov je obavezan."); return; }
        if (!editor?.getHTML() || editor.getHTML() === '<p></p>') { setError("Sadržaj je obavezan."); return; }

        setSaving(true);
        setError("");

        try {
            const body = {
                projectId,
                title: title.trim(),
                content: editor.getHTML(),
                excerpt: excerpt.trim(),
                coverImage: coverImage || null,
                categoryId: categoryId || null,
                tags: tags.length > 0 ? tags.join(',') : null,
                metaTitle: metaTitle.trim() || title.trim(),
                metaDescription: metaDescription.trim() || excerpt.trim(),
                status: publishStatus || status,
            };

            let res;
            if (existingPost) {
                res = await fetch('/api/blog', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: existingPost.id, ...body })
                });
            } else {
                res = await fetch('/api/blog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }

            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch { throw new Error('Server error: prazan odgovor'); }
            if (!res.ok) throw new Error(data.error || 'Greška');

            router.push(`/dashboard/projects/${projectId}/blog`);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiTopic.trim()) return;
        setGenerating(true);
        setError("");

        try {
            const res = await fetch('/api/blog/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    topic: aiTopic,
                    keywords: aiKeywords,
                    tone: aiTone,
                    length: aiLength,
                })
            });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch { throw new Error('Server error: prazan odgovor. Provjerite logove.'); }
            if (!res.ok) throw new Error(data.error || 'Greška');

            // Fill form with AI content
            if (data.article) {
                setTitle(data.article.title);
                setExcerpt(data.article.excerpt || "");
                setMetaTitle(data.article.metaTitle || "");
                setMetaDescription(data.article.metaDescription || "");
                if (editor) editor.commands.setContent(data.article.content);
                setShowAiPanel(false);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
            {showMediaPicker === 'cover' && (
                <MediaPickerModal onSelect={url => { setCoverImage(url); setShowMediaPicker(null); }} onClose={() => setShowMediaPicker(null)} />
            )}
            {showMediaPicker === 'editor' && (
                <MediaPickerModal onSelect={addImage} onClose={() => setShowMediaPicker(null)} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
                    <ArrowLeft size={16} /> Natrag
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleSave('DRAFT')} disabled={saving}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors disabled:opacity-50">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Spremi nacrt
                    </button>
                    <button onClick={() => handleSave('PUBLISHED')} disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors disabled:opacity-50">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                        Objavi
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
            )}

            {/* AI Generate Panel */}
            <div className="bg-gradient-to-r from-purple-500/10 to-green-500/10 border border-purple-500/20 rounded-2xl overflow-hidden">
                <button onClick={() => setShowAiPanel(!showAiPanel)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <Sparkles className="text-purple-400" size={20} />
                        <span className="text-white font-bold text-sm">AI Napiši Članak</span>
                        <span className="text-zinc-500 text-xs">Opišite temu i AI će napisati potpun članak</span>
                    </div>
                    <span className="text-zinc-500 text-xs">{showAiPanel ? '▲' : '▼'}</span>
                </button>
                {showAiPanel && (
                    <div className="px-4 pb-4 space-y-3 border-t border-purple-500/10">
                        <div className="space-y-1 pt-3">
                            <label className="text-zinc-400 text-xs font-medium">Tema članka *</label>
                            <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                                placeholder="npr. 5 razloga zašto svaki biznis treba web stranicu"
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-zinc-400 text-xs font-medium">Ključne riječi (opcionalno)</label>
                            <input value={aiKeywords} onChange={e => setAiKeywords(e.target.value)}
                                placeholder="web dizajn, SEO, digitalni marketing"
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-zinc-400 text-xs font-medium">Ton</label>
                                <select value={aiTone} onChange={e => setAiTone(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                                    <option value="professional">Profesionalan</option>
                                    <option value="casual">Opušten</option>
                                    <option value="informative">Informativan</option>
                                    <option value="persuasive">Persuazivan</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-zinc-400 text-xs font-medium">Duljina</label>
                                <select value={aiLength} onChange={e => setAiLength(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                                    <option value="short">Kratki (500-800 riječi)</option>
                                    <option value="medium">Srednji (800-1200 riječi)</option>
                                    <option value="long">Dugi (1200-2000 riječi)</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleAiGenerate} disabled={generating || !aiTopic.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                            {generating ? <><Loader2 size={18} className="animate-spin" />AI piše članak...</> : <><Sparkles size={18} />Generiraj Članak</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Cover Image */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <label className="text-zinc-300 text-sm font-medium flex items-center gap-2"><ImageIcon size={16} className="text-zinc-500" />Cover Slika (opcionalno)</label>
                {coverImage ? (
                    <div className="relative">
                        <img src={coverImage} alt="Cover" className="w-full h-48 object-cover rounded-xl" />
                        <button onClick={() => setCoverImage("")} className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowMediaPicker('cover')}
                            className="px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-green-500/20">
                            <FolderOpen size={14} />Iz knjižnice
                        </button>
                        <label className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border cursor-pointer ${uploadingCover ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/20'}`}>
                            {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {uploadingCover ? 'Uploadam...' : 'Upload sliku'}
                            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
                        </label>
                    </div>
                )}
            </div>

            {/* Category & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Picker */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                        <FolderPlus size={16} className="text-zinc-500" />Kategorija
                    </label>
                    <div className="relative" ref={categoryRef}>
                        <button type="button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm hover:border-zinc-600 transition-colors">
                            <span className={categoryId ? 'text-white' : 'text-zinc-500'}>
                                {categoryId ? categories.find(c => c.id === categoryId)?.name || 'Odaberi...' : 'Bez kategorije'}
                            </span>
                            <ChevronDown size={14} className="text-zinc-500" />
                        </button>
                        {showCategoryDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="max-h-48 overflow-y-auto">
                                    <button type="button" onClick={() => { setCategoryId(""); setShowCategoryDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors ${!categoryId ? 'text-green-400 bg-green-500/10' : 'text-zinc-400'}`}>
                                        Bez kategorije
                                    </button>
                                    {categories.map(cat => (
                                        <button key={cat.id} type="button"
                                            onClick={() => { setCategoryId(cat.id); setShowCategoryDropdown(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors ${categoryId === cat.id ? 'text-green-400 bg-green-500/10' : 'text-white'}`}>
                                            {cat.name}
                                            {cat._count?.posts > 0 && <span className="text-zinc-600 ml-2 text-xs">({cat._count.posts})</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-zinc-800 p-3 flex gap-2">
                                    <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                                        placeholder="Nova kategorija..."
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                                    <button type="button" onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}
                                        className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                                        {creatingCategory ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags Input */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <label className="text-zinc-300 text-sm font-medium flex items-center gap-2">
                        <Tag size={16} className="text-zinc-500" />Tagovi
                    </label>
                    <div className="flex flex-wrap gap-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 min-h-[42px] focus-within:border-green-500 transition-colors">
                        {tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 bg-green-600/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full border border-green-500/20">
                                #{tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                            placeholder={tags.length === 0 ? 'Dodaj tag (Enter)...' : ''}
                            className="flex-1 min-w-[120px] bg-transparent text-white text-sm focus:outline-none placeholder-zinc-600" />
                    </div>
                </div>
            </div>

            {/* Title */}
            <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Naslov članka..."
                className="w-full bg-transparent text-3xl sm:text-4xl font-bold text-white placeholder-zinc-700 focus:outline-none border-none" />

            {/* Excerpt */}
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="Kratki sažetak (opcionalno)..."
                rows={2}
                className="w-full bg-transparent text-lg text-zinc-400 placeholder-zinc-700 focus:outline-none border-none resize-none" />

            {/* Editor Toolbar */}
            {editor && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl sticky top-16 z-40">
                    <div className="flex items-center gap-0.5 p-2 flex-wrap">
                        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                            <Bold size={16} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                            <Italic size={16} />
                        </ToolbarButton>
                        <div className="w-px h-6 bg-zinc-800 mx-1" />
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                            <Heading1 size={16} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                            <Heading2 size={16} />
                        </ToolbarButton>
                        <div className="w-px h-6 bg-zinc-800 mx-1" />
                        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
                            <List size={16} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numerirana lista">
                            <ListOrdered size={16} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citat">
                            <Quote size={16} />
                        </ToolbarButton>
                        <div className="w-px h-6 bg-zinc-800 mx-1" />
                        <ToolbarButton onClick={addLink} title="Link">
                            <Link2 size={16} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => setShowMediaPicker('editor')} title="Slika">
                            <ImageIcon size={16} />
                        </ToolbarButton>
                        <div className="w-px h-6 bg-zinc-800 mx-1" />
                        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                            <Undo2 size={16} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                            <Redo2 size={16} />
                        </ToolbarButton>
                    </div>
                </div>
            )}

            {/* Editor Content */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl min-h-[400px] overflow-hidden">
                <EditorContent editor={editor} />
            </div>

            {/* SEO Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <button onClick={() => setShowSeo(!showSeo)} className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/70 transition-colors">
                    <span className="text-zinc-400 text-sm font-medium">SEO Postavke (opcionalno)</span>
                    <span className="text-zinc-600 text-xs">{showSeo ? '▲' : '▼'}</span>
                </button>
                {showSeo && (
                    <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
                        <div className="space-y-1 pt-3">
                            <label className="text-zinc-500 text-xs">Meta Naslov</label>
                            <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO naslov..."
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-zinc-500 text-xs">Meta Opis</label>
                            <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2} placeholder="SEO opis..."
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
