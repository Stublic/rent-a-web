'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Eye } from 'lucide-react';
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
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto" style={{ background: 'var(--lp-bg)', borderBottom: '1px solid var(--lp-border)' }}>
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
        <div className="h-[calc(100dvh-56px)] flex flex-col overflow-hidden" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
            {/* ── DESKTOP: side-by-side ── */}
            <div className="hidden md:flex flex-1 min-h-0">
                <div className="flex-1 min-w-0 flex flex-col">
                    <PageTabs />
                    <div className="flex-1 min-h-0">
                        <EditorPreview
                            html={activeHtml}
                            projectId={project.id}
                            project={project}
                            hasBlog={hasBlog}
                        />
                    </div>
                </div>
                <div className="w-96 lg:w-[28rem] flex-shrink-0">
                    <EditorChat
                        project={project}
                        userTokens={userTokens}
                        activePage={activePage}
                        pageLabel={pageLabel}
                    />
                </div>
            </div>

            {/* ── MOBILE: full-screen preview + floating chat toggle ── */}
            <div className="md:hidden flex-1 min-h-0 relative">
                <div className="absolute inset-0 flex flex-col">
                    <PageTabs />
                    <div className="flex-1 min-h-0">
                        <EditorPreview
                            html={activeHtml}
                            projectId={project.id}
                            project={project}
                            hasBlog={hasBlog}
                        />
                    </div>
                </div>

                {showMobileChat && (
                    <div className="absolute inset-0 z-30 flex flex-col" style={{ background: 'var(--lp-bg)' }}>
                        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--lp-border)' }}>
                            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--lp-heading)' }}>
                                <MessageSquare size={15} style={{ color: 'var(--lp-text-muted)' }} />
                                Webica AI Editor
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
                                Vidi stranicu
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <EditorChat
                                project={project}
                                activePage={activePage}
                                pageLabel={pageLabel}
                            />
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
