"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Undo2, Sparkles, Coins, ArrowRight, Search, Pencil, ShieldCheck, Paperclip, X, Upload, Image, FolderOpen } from "lucide-react";
import { editWebsiteAction, undoLastEditAction } from "@/app/actions/edit-website";
import { useRouter } from "next/navigation";

// ─── Session storage helpers ──────────────────────────────────────────────────
function getChatKey(projectId) {
    return `webica_editor_chat_${projectId}`;
}

function loadMessages(projectId) {
    try {
        const raw = sessionStorage.getItem(getChatKey(projectId));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveMessages(projectId, messages) {
    try {
        // Only save non-transient messages (skip loading states)
        const toSave = messages.filter(m => !m._transient);
        sessionStorage.setItem(getChatKey(projectId), JSON.stringify(toSave));
    } catch { /* quota exceeded — silently fail */ }
}

// ─── Loading Indicator ────────────────────────────────────────────────────────
const LOADING_STEPS = [
    { icon: Search, text: "Analiziram tvoj zahtjev...", minMs: 0 },
    { icon: Pencil, text: "Uređujem HTML i CSS...", minMs: 2000 },
    { icon: ShieldCheck, text: "Provjeravam kvalitetu...", minMs: 5000 },
];

function LoadingIndicator({ startTime }) {
    const [stepIdx, setStepIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const nextIdx = LOADING_STEPS.findLastIndex(s => elapsed >= s.minMs);
            if (nextIdx >= 0 && nextIdx !== stepIdx) setStepIdx(nextIdx);
        }, 500);
        return () => clearInterval(interval);
    }, [startTime, stepIdx]);

    const step = LOADING_STEPS[stepIdx];
    const Icon = step.icon;

    return (
        <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2.5 max-w-[85%]"
                style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                <div className="relative">
                    <Loader2 className="animate-spin" size={14} style={{ color: 'var(--lp-accent-green)' }} />
                </div>
                <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color: 'var(--lp-text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--lp-text-secondary)' }}>{step.text}</span>
                </div>
                <div className="flex gap-1 ml-1">
                    {LOADING_STEPS.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{ background: i <= stepIdx ? 'var(--lp-accent-green)' : 'var(--lp-border)' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Assistant Message ────────────────────────────────────────────────────────
function AssistantMessage({ msg, onSuggestionClick }) {
    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] space-y-2">
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${msg.isError ? 'text-red-400' : ''}`}
                    style={
                        msg.isError ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }
                        : msg.success ? { background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }
                        : { background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-secondary)' }
                    }>
                    <p style={{ color: msg.isError ? undefined : msg.success ? 'var(--lp-text-secondary)' : undefined }}>
                        {msg.content}
                    </p>
                    {msg.tokensInfo && (
                        <p className="mt-1.5 text-[10px] font-medium" style={{ color: 'var(--lp-text-muted)' }}>
                            {msg.tokensInfo}
                        </p>
                    )}
                    {msg.showBuyTokens && (
                        <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                            <p className="text-[10px] text-red-300/80 mb-2">Trebate više tokena za nastavak.</p>
                            <a href={`/dashboard/projects/${msg.projectId}/tokens`}
                                className="w-full py-1.5 rounded-lg text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1.5 hover:scale-105"
                                style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                                <Coins size={12} /> Kupi Tokene
                            </a>
                        </div>
                    )}
                </div>
                {msg.suggestion && (
                    <button onClick={() => onSuggestionClick(msg.suggestion)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-[1.02] hover:shadow-sm w-fit"
                        style={{
                            background: 'color-mix(in srgb, var(--lp-accent-green) 8%, var(--lp-surface))',
                            border: '1px solid color-mix(in srgb, var(--lp-accent-green) 20%, var(--lp-border))',
                            color: 'var(--lp-accent-green)',
                        }}>
                        <ArrowRight size={12} /> {msg.suggestion}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Media Picker Popup ───────────────────────────────────────────────────────
function MediaPickerPopup({ projectId, onClose, onMediaSelected, onFileUpload }) {
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
                if (data.media) setMedia(data.media.filter(m => m.type.startsWith('image/')));
            } catch (err) { console.error("Failed to fetch media", err); }
            finally { setLoading(false); }
        };
        fetchMedia();
    }, []);

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
                        <h3 className="text-base font-bold" style={{ color: 'var(--lp-heading)' }}>Dodaj Medij</h3>
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
                                <input type="text" value={searchQuery || ''} onChange={e => setSearchQuery(e.target.value)}
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
                                            JPG, PNG, GIF, WebP, MP4 • Max 10MB (slike) / 50MB (video)
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

// ─── Main EditorChat ──────────────────────────────────────────────────────────
export default function EditorChat({ project, userTokens = 0, activePage = 'home', pageLabel = 'Početna' }) {
    const projectId = project.id;
    // Persist messages in sessionStorage so they survive tab navigation
    const [messages, setMessages] = useState(() => loadMessages(projectId));
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingStart, setLoadingStart] = useState(0);
    const [undoing, setUndoing] = useState(false);
    const [tokens, setTokens] = useState(userTokens);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const router = useRouter();

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        saveMessages(projectId, messages);
    }, [messages, projectId]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [messages, loading]);

    // Build conversation history from successful message pairs for multi-turn AI
    const buildConversationHistory = () => {
        const history = [];
        for (const msg of messages) {
            if (msg.role === 'user') {
                history.push({ role: 'user', content: msg.content });
            } else if (msg.role === 'assistant' && msg.success) {
                history.push({ role: 'assistant', content: msg.content });
            }
        }
        return history;
    };

    const submitEdit = async (editText) => {
        if (!editText.trim() || loading) return;
        const userMessage = { role: "user", content: editText };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setLoadingStart(Date.now());

        try {
            // Send conversation history for multi-turn context
            const conversationHistory = buildConversationHistory();
            const result = await editWebsiteAction(project.id, editText, conversationHistory, activePage);
            if (result.success) {
                if (result.tokensRemaining !== undefined) setTokens(result.tokensRemaining);
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: result.message || '✅ Izmjena primijenjena!',
                    success: true,
                    suggestion: result.suggestion || '',
                    tokensInfo: `−${result.tokensConsumed || 0} tokena · Preostalo: ${result.tokensRemaining}`,
                    projectId,
                }]);
                router.refresh();
            } else if (result.insufficientTokens) {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: result.error,
                    isError: true,
                    showBuyTokens: true,
                    projectId,
                }]);
            } else {
                setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: result.error || "Nisam mogao primijeniti izmjenu. Pokušaj ponovno ili reformuliraj zahtjev.",
                    isError: true,
                    projectId,
                }]);
            }
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Došlo je do greške. Pokušajte ponovno.",
                isError: true,
                projectId,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await submitEdit(input);
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    // Handle media selected from popup (library or uploaded)
    const handleMediaSelected = (mediaItem) => {
        const isVideo = mediaItem.type?.startsWith('video/');
        setMessages(prev => [...prev, {
            role: "assistant",
            content: `📎 Odabrano: ${mediaItem.filename}\nURL: ${mediaItem.url}\nMožete tražiti od AI-a da koristi ovu datoteku.`,
            success: true,
            suggestion: isVideo ? '' : 'Koristi odabranu sliku kao hero pozadinu',
            projectId,
        }]);
    };

    const handleUndo = async () => {
        setUndoing(true);
        try {
            const result = await undoLastEditAction(project.id, activePage);
            if (result.success) {
                setMessages((prev) => {
                    const newMsgs = [...prev];
                    for (let i = newMsgs.length - 1; i >= 0; i--) {
                        if (newMsgs[i].role === 'assistant' && newMsgs[i].success) {
                            newMsgs.splice(i, 1);
                            break;
                        }
                    }
                    for (let i = newMsgs.length - 1; i >= 0; i--) {
                        if (newMsgs[i].role === 'user') {
                            newMsgs.splice(i, 1);
                            break;
                        }
                    }
                    return [...newMsgs, { role: "assistant", content: "↩️ " + (result.message || "Izmjena poništena."), success: true, projectId }];
                });
                router.refresh();
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: result.error, isError: true, projectId }]);
            }
        } catch (error) { console.error(error); }
        finally { setUndoing(false); }
    };

    const hasEdits = Array.isArray(project.editHistory) && project.editHistory.length > 0;
    const tokenColor = tokens > 100 ? 'rgb(34,197,94)' : tokens > 50 ? 'rgb(234,179,8)' : 'rgb(239,68,68)';

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--lp-bg-alt)', borderLeft: '1px solid var(--lp-border)' }}>
            {/* Header */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--lp-heading)' }}>
                            <Sparkles size={16} className="text-emerald-400" /> Webica AI Editor
                            {activePage !== 'home' && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }}>
                                    {pageLabel}
                                </span>
                            )}
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--lp-text-muted)' }}>
                            {activePage === 'home' ? 'Razgovaraj s AI-em o promjenama' : `Uređuješ: ${pageLabel}`}
                        </p>
                    </div>
                    <button onClick={handleUndo} disabled={!hasEdits || undoing}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all hover:bg-white/5"
                        style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }}>
                        <Undo2 size={13} /><span className="hidden sm:inline">Undo</span>
                    </button>
                </div>
                
                {/* Token Display */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--lp-border)' }}>
                    <span className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>Preostali tokeni:</span>
                    <div className="flex items-center gap-2">
                        <Coins size={13} style={{ color: tokenColor }} />
                        <span className="text-xs font-mono font-bold" style={{ color: tokenColor }}>{tokens}</span>
                        {tokens === 0 && (
                            <a href={`/dashboard/projects/${projectId}/tokens`}
                                className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all hover:scale-105 flex items-center gap-1"
                                style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                                <Coins size={10} /> Kupi
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center mt-6 space-y-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                            style={{ background: 'color-mix(in srgb, var(--lp-accent-green) 12%, transparent)' }}>
                            <Sparkles size={18} style={{ color: 'var(--lp-accent-green)' }} />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--lp-text-secondary)' }}>
                            Zdravo! 👋 Ja sam tvoj AI asistent.
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>
                            {activePage === 'home'
                                ? 'Reci mi što želiš promijeniti na stranici.'
                                : `Reci mi što želiš promijeniti na stranici "${pageLabel}".`
                            }
                        </p>
                        <div className="space-y-2 max-w-sm mx-auto mt-4">
                            {[
                                'Promijeni boju gumba u plavu',
                                'Dodaj sekciju s cjenikom',
                                'Promijeni tekst u hero sekciji',
                                'Napravi font veći u About sekciji'
                            ].map((eg, i) => (
                                <button key={i} onClick={() => { setInput(eg); inputRef.current?.focus(); }}
                                    className="w-full rounded-lg p-2.5 text-xs text-left transition-all hover:scale-[1.02]"
                                    style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
                                    &quot;{eg}&quot;
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    msg.role === "user" ? (
                        <div key={idx} className="flex justify-end">
                            <div className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                                style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                                {msg.content}
                            </div>
                        </div>
                    ) : (
                        <AssistantMessage key={idx} msg={msg} onSuggestionClick={handleSuggestionClick} />
                    )
                ))}

                {loading && <LoadingIndicator startTime={loadingStart} />}
                <div ref={messagesEndRef} />
            </div>

            {/* Media Picker Popup */}
            {showMediaPicker && (
                <MediaPickerPopup
                    projectId={projectId}
                    onClose={() => setShowMediaPicker(false)}
                    onMediaSelected={handleMediaSelected}
                />
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3" style={{ borderTop: '1px solid var(--lp-border)' }}>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        disabled={loading}
                        title="Dodaj sliku ili video"
                        className="rounded-xl transition-all hover:bg-white/5"
                        style={{
                            padding: '0.65rem',
                            border: '1px solid var(--lp-border)',
                            background: 'var(--lp-surface)',
                            color: 'var(--lp-text-muted)',
                            cursor: 'pointer',
                            opacity: loading ? 0.5 : 1,
                            display: 'flex', alignItems: 'center',
                        }}
                    >
                        <Paperclip size={14} />
                    </button>
                    <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder={tokens < 50 ? "Nemate dovoljno tokena..." : "Reci mi što želiš promijeniti..."}
                        className="flex-1 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                        style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-heading)' }}
                        disabled={loading || tokens < 50} />
                    <button type="submit" disabled={loading || !input.trim() || tokens < 50}
                        className="px-4 rounded-xl font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
                        style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                        Pošalji
                    </button>
                </div>
            </form>
        </div>
    );
}
