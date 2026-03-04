"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Undo2, Sparkles, Coins, ArrowRight, Search, Pencil, ShieldCheck, Paperclip, X, Upload, Image, FolderOpen } from "lucide-react";
import { editWebsiteAction, undoLastEditAction } from "@/app/actions/edit-website";
import { useRouter } from "next/navigation";
import MediaPickerPopup from "./MediaPickerPopup";
import InfoTooltip from "@/components/InfoTooltip";

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
                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                <div className="relative">
                    <Loader2 className="animate-spin" size={14} style={{ color: 'var(--db-accent-green)' }} />
                </div>
                <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color: 'var(--db-text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--db-text-secondary)' }}>{step.text}</span>
                </div>
                <div className="flex gap-1 ml-1">
                    {LOADING_STEPS.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{ background: i <= stepIdx ? 'var(--db-accent-green)' : 'var(--db-border)' }} />
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
                        : { background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-text-secondary)' }
                    }>
                    <p style={{ color: msg.isError ? undefined : msg.success ? 'var(--db-text-secondary)' : undefined }}>
                        {msg.content}
                    </p>
                    {msg.tokensInfo && (
                        <p className="mt-1.5 text-[10px] font-medium" style={{ color: 'var(--db-text-muted)' }}>
                            {msg.tokensInfo}
                        </p>
                    )}
                    {msg.showBuyTokens && (
                        <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                            <p className="text-[10px] text-red-300/80 mb-2">Trebate više tokena za nastavak.</p>
                            <a href={`/dashboard/projects/${msg.projectId}/tokens`}
                                className="w-full py-1.5 rounded-lg text-[11px] font-bold text-center transition-all flex items-center justify-center gap-1.5 hover:scale-105"
                                style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}>
                                <Coins size={12} /> Kupi Tokene
                            </a>
                        </div>
                    )}
                </div>
                {msg.suggestion && (
                    <button onClick={() => onSuggestionClick(msg.suggestion)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-[1.02] hover:shadow-sm w-fit"
                        style={{
                            background: 'color-mix(in srgb, var(--db-accent-green) 8%, var(--db-surface))',
                            border: '1px solid color-mix(in srgb, var(--db-accent-green) 20%, var(--db-border))',
                            color: 'var(--db-accent-green)',
                        }}>
                        <ArrowRight size={12} /> {msg.suggestion}
                    </button>
                )}
            </div>
        </div>
    );
}

// MediaPickerPopup is now imported from ./MediaPickerPopup.jsx

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

    // Sync tokens when the prop changes (e.g. after router.refresh())
    useEffect(() => {
        setTokens(userTokens);
    }, [userTokens]);

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
                window.dispatchEvent(new Event('project-html-saved'));
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
        <div className="flex flex-col h-full" style={{ background: 'var(--db-bg-alt)', borderLeft: '1px solid var(--db-border)' }}>
            {/* Header */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--db-border)' }}>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--db-heading)' }}>
                            <Sparkles size={16} className="text-emerald-400" /> Webica AI Editor
                            {activePage !== 'home' && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--db-surface)', color: 'var(--db-text-muted)', border: '1px solid var(--db-border)' }}>
                                    {pageLabel}
                                </span>
                            )}
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--db-text-muted)' }}>
                            {activePage === 'home' ? 'Razgovaraj s AI-em o promjenama' : `Uređuješ: ${pageLabel}`}
                        </p>
                    </div>
                    <button onClick={handleUndo} disabled={!hasEdits || undoing}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all hover:bg-white/5"
                        style={{ color: 'var(--db-text-muted)', border: '1px solid var(--db-border)' }}>
                        <Undo2 size={13} /><span className="hidden sm:inline">Undo</span>
                    </button>
                </div>
                
                {/* Token Display */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--db-border)' }}>
                    <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--db-text-muted)' }}>
                        Preostali tokeni:
                        <InfoTooltip text="Svaka AI izmjena troši tokene. Za besplatno uređivanje teksta i slika koristite 'Vizualno uređivanje' u Preview-u." side="bottom" />
                    </span>
                    <div className="flex items-center gap-2">
                        <Coins size={13} style={{ color: tokenColor }} />
                        <span className="text-xs font-mono font-bold" style={{ color: tokenColor }}>{tokens}</span>
                        {tokens === 0 && (
                            <a href={`/dashboard/projects/${projectId}/tokens`}
                                className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all hover:scale-105 flex items-center gap-1"
                                style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}>
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
                            style={{ background: 'color-mix(in srgb, var(--db-accent-green) 12%, transparent)' }}>
                            <Sparkles size={18} style={{ color: 'var(--db-accent-green)' }} />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--db-text-secondary)' }}>
                            Zdravo! 👋 Ja sam tvoj AI asistent.
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--db-text-muted)' }}>
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
                                    style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-text-muted)' }}>
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
                                style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}>
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

            {/* Token hint banner */}
            <div className="px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(234,179,8,0.04)', borderTop: '1px solid rgba(234,179,8,0.1)' }}>
                <Pencil size={11} style={{ color: '#ca8a04', flexShrink: 0 }} />
                <p className="text-[10px] leading-relaxed" style={{ color: '#ca8a04' }}>
                    AI izmjene troše tokene. Za besplatnu izmjenu teksta uključite <strong>Vizualno uređivanje</strong> u Preview-u.
                </p>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3" style={{ borderTop: '1px solid var(--db-border)' }}>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        disabled={loading}
                        title="Dodaj sliku ili video"
                        className="rounded-xl transition-all hover:bg-white/5"
                        style={{
                            padding: '0.65rem',
                            border: '1px solid var(--db-border)',
                            background: 'var(--db-surface)',
                            color: 'var(--db-text-muted)',
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
                        style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', color: 'var(--db-heading)' }}
                        disabled={loading || tokens < 50} />
                    <button type="submit" disabled={loading || !input.trim() || tokens < 50}
                        className="px-4 rounded-xl font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
                        style={{ background: 'var(--db-heading)', color: 'var(--db-bg)' }}>
                        Pošalji
                    </button>
                </div>
            </form>
        </div>
    );
}
