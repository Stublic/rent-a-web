"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

// ─── Nav injection helpers (mirrored from PreviewPanel) ──────────────

function extractNavLinkClass(html) {
    const firstNav = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (!firstNav) return '';
    const pocetnaLink = firstNav[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
    if (!pocetnaLink) return '';
    const cls = pocetnaLink[0].match(/class="([^"]*)"/);
    if (!cls) return '';
    return cls[1]
        .replace(/\bborder-b[-\w]*/g, '')
        .replace(/\bborder-primary\b/g, '')
        .replace(/\bpb-\d+/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

const PREDEFINED_LABELS = { 'o-nama': 'O nama', 'usluge': 'Usluge', 'kontakt': 'Kontakt' };

function getLabels(project) {
    const labels = { ...PREDEFINED_LABELS };
    const custom = (project?.contentData || {})._customSubpages || {};
    for (const [slug, meta] of Object.entries(custom)) {
        if (meta && meta.title) labels[slug] = meta.title;
    }
    return labels;
}

function injectNavLinks(html, project, hasBlog) {
    if (!html || !project) return html;

    // Strip old blog links
    html = html.replace(/<a\s[^>]*href=["']\/api\/site\/[^"']*\/blog["'][^>]*>[\s\S]*?<\/a>\s*/gi, '');

    const reactFiles = project.reactFiles || {};
    const labels = getLabels(project);
    const allSlugs = Object.keys(reactFiles).filter(k => labels[k]);
    const missingSlugs = allSlugs.filter(s => !html.includes(`href="/${s}"`) && !html.includes(`href='/${s}'`));

    if (missingSlugs.length > 0) {
        const linkClass = extractNavLinkClass(html);
        const navLinksHtml = missingSlugs.map(s => `<a href="/${s}"${linkClass ? ` class="${linkClass}"` : ''}>${labels[s]}</a>`).join('\n                    ');

        // Desktop nav
        if (html.includes('<!-- NAV_LINKS -->')) {
            html = html.replace(/<!-- NAV_LINKS -->/g, navLinksHtml);
        } else {
            const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
            if (navMatch) {
                const poc = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
                if (poc) html = html.replace(navMatch[0], navMatch[0].replace(poc[0], poc[0] + '\n                    ' + navLinksHtml));
            }
        }

        // Mobile menu
        if (html.includes('<!-- NAV_LINKS_MOBILE -->')) {
            const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
            let mc = '';
            if (mm) {
                const mp = mm[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
                if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1].replace(/\bborder-b[-\w]*/g,'').replace(/\bborder-primary\b/g,'').replace(/\s{2,}/g,' ').trim(); }
            }
            const ml = missingSlugs.map(s => `<a href="/${s}"${mc ? ` class="${mc}"` : ''}>${labels[s]}</a>`).join('\n            ');
            html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, ml);
        } else {
            const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
            if (mm) {
                const mp = mm[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
                if (mp && !mm[0].includes(`href="/${missingSlugs[0]}"`)) {
                    let mc = ''; const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1].replace(/\bborder-b[-\w]*/g,'').replace(/\bborder-primary\b/g,'').replace(/\s{2,}/g,' ').trim();
                    const ml = missingSlugs.map(s => `<a href="/${s}"${mc ? ` class="${mc}"` : ''}>${labels[s]}</a>`).join('\n            ');
                    html = html.replace(mm[0], mm[0].replace(mp[0], mp[0] + '\n            ' + ml));
                }
            }
        }

        // Footer
        if (html.includes('<!-- FOOTER_NAV_LINKS -->')) {
            html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, missingSlugs.map(s => `<a href="/${s}">${labels[s]}</a>`).join('\n'));
        } else {
            const fm = html.match(/<footer[\s\S]*?<\/footer>/i);
            if (fm) {
                const fh = fm[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>\s*<\/li>/i);
                if (fh && !fm[0].includes(`href="/${missingSlugs[0]}"`)) {
                    const fl = missingSlugs.map(s => `<li><a href="/${s}" class="hover:text-white transition-colors">${labels[s]}</a></li>`).join('\n                        ');
                    html = html.replace(fm[0], fm[0].replace(fh[0], fh[0] + '\n                        ' + fl));
                }
            }
        }
    }

    // Clean markers
    html = html.replace(/<!-- NAV_LINKS -->/g, '').replace(/<!-- NAV_LINKS_MOBILE -->/g, '').replace(/<!-- FOOTER_NAV_LINKS -->/g, '');

    // Blog link
    if (hasBlog && !html.includes('href="/blog"') && !html.includes("href='/blog'")) {
        const lc = extractNavLinkClass(html);
        const bl = `<a href="/blog"${lc ? ` class="${lc}"` : ''}>Blog</a>`;
        const ns = html.match(/<nav[\s\S]*?<\/nav>/i);
        if (ns) {
            const dl = ns[0].match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
            const target = dl || ns;
            const lp = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
            const links = target[0].match(lp);
            if (links && links.length > 0) {
                const last = links[links.length - 1];
                html = html.replace(target[0], target[0].replace(last, last + '\n                    ' + bl));
            }
        }
        // Mobile blog
        const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
        if (mm && !mm[0].includes('href="/blog"')) {
            const cta = mm[0].match(/<a\s[^>]*class="[^"]*bg-primary[^"]*"[^>]*>[\s\S]*?<\/a>/i);
            if (cta) {
                const mp = mm[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
                let mc = ''; if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1].replace(/\bborder-b[-\w]*/g,'').replace(/\bborder-primary\b/g,'').replace(/\s{2,}/g,' ').trim(); }
                const mbl = `<a href="/blog"${mc ? ` class="${mc}"` : ''}>Blog</a>`;
                html = html.replace(mm[0], mm[0].replace(cta[0], mbl + '\n            ' + cta[0]));
            }
        }
    }

    return html;
}

// ─── Component ──────────────────────────────────────────────────────

export default function EditorPreview({ html, projectId, project, hasBlog = false }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const iframeRef = useRef(null);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const injectedHtml = useMemo(
        () => injectNavLinks(html, project, hasBlog),
        [html, project, hasBlog]
    );

    const openInNewTab = () => {
        const newWindow = window.open();
        if (newWindow && injectedHtml) { newWindow.document.write(injectedHtml); newWindow.document.close(); }
    };

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const handleIframeLoad = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) return;
                iframeDoc.addEventListener('click', (e) => {
                    const target = e.target.closest('a');
                    if (target && target.tagName === 'A') {
                        e.preventDefault();
                        const href = target.getAttribute('href');
                        if (href) {
                            if (href.startsWith('http://') || href.startsWith('https://')) window.open(href, '_blank');
                            else if (href.startsWith('#')) { const el = iframeDoc.querySelector(href); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
                        }
                    }
                });
            } catch (error) { console.warn('Cannot access iframe content (cross-origin)'); }
        };
        iframe.addEventListener('load', handleIframeLoad);
        if (iframe.contentDocument?.readyState === 'complete') handleIframeLoad();
        return () => iframe.removeEventListener('load', handleIframeLoad);
    }, [refreshKey]);

    return (
        <div className="h-full flex flex-col" style={{ background: 'var(--lp-bg)' }}>
            {/* Header */}
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--lp-bg-alt)', borderBottom: '1px solid var(--lp-border)' }}>
                <h2 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>Live Preview</h2>
                <div className="flex items-center gap-1.5">
                    <button onClick={handleRefresh} className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/5" style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }} title="Osvježi preview">
                        <RefreshCw size={13} /><span className="hidden sm:inline">Osvježi</span>
                    </button>
                    <button onClick={openInNewTab} className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/5" style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }} title="Otvori u novom tabu">
                        <ExternalLink size={13} /><span className="hidden sm:inline">Novi Tab</span>
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 bg-white relative overflow-auto">
                {injectedHtml ? (
                    <iframe ref={iframeRef} key={refreshKey} srcDoc={injectedHtml} className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" title="Website Preview" />
                ) : (
                    <div className="flex items-center justify-center h-full" style={{ background: 'var(--lp-bg)' }}>
                        <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>Nema generiranog HTML-a za prikaz</p>
                    </div>
                )}
            </div>
        </div>
    );
}
