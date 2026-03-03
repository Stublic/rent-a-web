'use client';

import { useState, useMemo, useEffect } from 'react';
import { MessageSquare, Eye, PanelRightClose, PanelRightOpen } from 'lucide-react';
import EditorPreview from './EditorPreview';
import EditorChat from './EditorChat';

const PREDEFINED_SUBPAGE_LABELS = {
    'o-nama': 'O nama',
    'usluge': 'Usluge',
    'kontakt': 'Kontakt',
};

function getSubpageLabels(project) {
    const labels = { ...PREDEFINED_SUBPAGE_LABELS };
    const customMeta = (project.contentData || {})._customSubpages || {};
    for (const [slug, meta] of Object.entries(customMeta)) {
        if (meta && meta.title) labels[slug] = meta.title;
    }
    return labels;
}

export default function EditorPageClient({ project, userTokens = 0, hasBlog = false }) {
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [showDesktopChat, setShowDesktopChat] = useState(true);
    const [activePage, setActivePage] = useState('home');

    const reactFiles = project.reactFiles || {};
    const subpageLabels = getSubpageLabels(project);
    const pages = useMemo(() => {
        const slugs = Object.keys(reactFiles).filter(k => subpageLabels[k]);
        return ['home', ...slugs];
    }, [reactFiles, subpageLabels]);
    const hasSubpages = pages.length > 1;

    const activeHtml = activePage === 'home'
        ? project.generatedHtml
        : reactFiles[activePage] || project.generatedHtml;

    const pageLabel = activePage === 'home' ? 'Početna' : (subpageLabels[activePage] || activePage);

    // Page tabs component
    const PageTabs = () => hasSubpages ? (
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto flex-shrink-0" style={{ background: 'var(--lp-bg)', borderBottom: '1px solid var(--lp-border)' }}>
            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => setActivePage(page)}
                    className="px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all"
                    style={activePage === page
                        ? { background: 'var(--lp-heading)', color: 'var(--lp-bg)' }
                        : { color: 'var(--lp-text-muted)', background: 'transparent' }
                    }
                >
                    {page === 'home' ? 'Početna' : (subpageLabels[page] || page)}
                </button>
            ))}
        </div>
    ) : null;

    return (
        <>
            {/* Desktop: full height minus header */}
            {/* Mobile: full height minus header minus bottom tab bar */}
            <div
                className="h-[calc(100dvh-56px-4.5rem)] md:h-[calc(100dvh-56px)] flex flex-col overflow-hidden"
                data-landing="true"
                style={{ background: 'var(--lp-bg)' }}
            >
                {/* ── DESKTOP: side-by-side with toggleable chat ── */}
                <div className="hidden md:flex flex-1 min-h-0 relative">
                    <div className="flex-1 min-w-0 flex flex-col">
                        <PageTabs />
                        <div className="flex-1 min-h-0">
                            <EditorPreview
                                html={activeHtml}
                                projectId={project.id}
                                project={project}
                                hasBlog={hasBlog}
                                activePage={activePage}
                            />
                        </div>
                    </div>

                    {/* Chat panel (collapsible) */}
                    {showDesktopChat && (
                        <div className="w-96 lg:w-[28rem] flex-shrink-0 flex flex-col relative">
                            <EditorChat
                                project={project}
                                userTokens={userTokens}
                                activePage={activePage}
                                pageLabel={pageLabel}
                            />
                        </div>
                    )}

                    {/* Desktop chat toggle button — positioned at bottom of preview area */}
                    <button
                        onClick={() => setShowDesktopChat(v => !v)}
                        className="absolute bottom-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all hover:scale-105"
                        style={{
                            background: showDesktopChat ? 'var(--lp-surface)' : 'var(--lp-heading)',
                            color: showDesktopChat ? 'var(--lp-text-muted)' : 'var(--lp-bg)',
                            border: showDesktopChat ? '1px solid var(--lp-border)' : 'none',
                            ...(showDesktopChat
                                ? { right: 'calc(24rem + 0.75rem)' }
                                : { right: '0.75rem' }
                            ),
                        }}
                        title={showDesktopChat ? 'Sakrij AI chat' : 'Prikaži AI chat'}
                    >
                        {showDesktopChat
                            ? <><PanelRightClose size={14} /> Sakrij chat</>
                            : <><PanelRightOpen size={14} /> AI Chat</>
                        }
                    </button>
                </div>

                {/* ── MOBILE: full-screen preview + floating chat toggle ── */}
                <div className="md:hidden flex-1 min-h-0 flex flex-col relative">
                    {/* Preview container (always rendered, but hidden when chat is shown) */}
                    <div className={`flex-1 min-h-0 flex flex-col ${showMobileChat ? 'hidden' : ''}`}>
                        <PageTabs />
                        <div className="flex-1 min-h-0">
                            <EditorPreview
                                html={activeHtml}
                                projectId={project.id}
                                project={project}
                                hasBlog={hasBlog}
                                activePage={activePage}
                            />
                        </div>
                    </div>

                    {/* Chat container (shown when toggle is active) */}
                    {showMobileChat && (
                        <div className="flex-1 min-h-0 flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                                <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--lp-heading)' }}>
                                    <MessageSquare size={15} style={{ color: 'var(--lp-text-muted)' }} />
                                    AI Editor
                                    {activePage !== 'home' && (
                                        <span className="text-xs font-normal px-1.5 py-0.5 rounded" style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-muted)' }}>
                                            {pageLabel}
                                        </span>
                                    )}
                                </span>
                                <button
                                    onClick={() => setShowMobileChat(false)}
                                    className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                                    style={{ color: 'var(--lp-text-muted)' }}
                                >
                                    <Eye size={14} />
                                    Stranica
                                </button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <EditorChat
                                    project={project}
                                    userTokens={userTokens}
                                    activePage={activePage}
                                    pageLabel={pageLabel}
                                />
                            </div>
                        </div>
                    )}

                    {/* Floating toggle button */}
                    <button
                        onClick={() => setShowMobileChat(v => !v)}
                        className="absolute bottom-3 right-3 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs shadow-2xl transition-all active:scale-95"
                        style={showMobileChat
                            ? { background: 'var(--lp-surface)', color: 'var(--lp-heading)', border: '1px solid var(--lp-border)' }
                            : { background: 'var(--lp-heading)', color: 'var(--lp-bg)', border: 'none' }
                        }
                    >
                        {showMobileChat ? <><Eye size={14} /> Stranica</> : <><MessageSquare size={14} /> AI Chat</>}
                    </button>
                </div>
            </div>
        </>
    );
}
