'use client';

import { useState } from 'react';
import { MessageSquare, Eye } from 'lucide-react';
import EditorPreview from './EditorPreview';
import EditorChat from './EditorChat';

export default function EditorPageClient({ project, userTokens = 0 }) {
    const [showMobileChat, setShowMobileChat] = useState(false);

    // ── HTML Editor for all plans ──
    return (
        <div className="h-[calc(100dvh-56px)] flex flex-col overflow-hidden" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
            {/* ── DESKTOP: side-by-side ── */}
            <div className="hidden md:flex flex-1 min-h-0">
                <div className="flex-1 min-w-0">
                    <EditorPreview html={project.generatedHtml} projectId={project.id} />
                </div>
                <div className="w-96 lg:w-[28rem] flex-shrink-0">
                    <EditorChat project={project} userTokens={userTokens} />
                </div>
            </div>

            {/* ── MOBILE: full-screen preview + floating chat toggle ── */}
            <div className="md:hidden flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                    <EditorPreview html={project.generatedHtml} projectId={project.id} />
                </div>

                {showMobileChat && (
                    <div className="absolute inset-0 z-30 flex flex-col" style={{ background: 'var(--lp-bg)' }}>
                        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--lp-heading)' }}>
                                <MessageSquare size={15} style={{ color: 'var(--lp-text-muted)' }} />
                                Webica AI Editor
                            </span>
                            <button
                                onClick={() => setShowMobileChat(false)}
                                className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                                style={{ color: 'var(--lp-text-muted)' }}
                            >
                                <Eye size={14} />
                                Vidi stranicu
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <EditorChat project={project} />
                        </div>
                    </div>
                )}

                {/* Floating toggle button */}
                <button
                    onClick={() => setShowMobileChat(v => !v)}
                    className="absolute bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-2xl transition-all active:scale-95"
                    style={showMobileChat
                        ? { background: 'var(--lp-surface)', color: 'var(--lp-heading)', border: '1px solid var(--lp-border)' }
                        : { background: 'var(--lp-heading)', color: 'var(--lp-bg)', border: 'none' }
                    }
                >
                    {showMobileChat ? <><Eye size={16} /> Vidi stranicu</> : <><MessageSquare size={16} /> Uredi chatom</>}
                </button>
            </div>
        </div>
    );
}
