"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Eye, EyeOff, ExternalLink, Code2, X, Save, Loader2, Check, RotateCcw } from 'lucide-react';
import { useToast } from '@/app/dashboard/components/ToastProvider';

const PREDEFINED_PAGE_LABELS = {
    home: 'Početna',
    'o-nama': 'O nama',
    'usluge': 'Usluge',
    'kontakt': 'Kontakt',
};

function getPageLabels(project) {
    const labels = { ...PREDEFINED_PAGE_LABELS };
    const customMeta = (project.contentData || {})._customSubpages || {};
    for (const [slug, meta] of Object.entries(customMeta)) {
        if (meta && meta.title) {
            labels[slug] = meta.title;
        }
    }
    return labels;
}

/**
 * Extract "Početna" nav link class for consistent styling.
 */
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

/**
 * Client-side nav link injection for preview iframe.
 */
function injectNavLinksClient(html, project) {
    if (!html) return html;
    const reactFiles = project.reactFiles || {};
    const labels = getPageLabels(project);
    const allSlugs = Object.keys(reactFiles).filter(k => labels[k]);
    if (allSlugs.length === 0) return html;

    // Strip old blog links
    html = html.replace(/<a\s[^>]*href=["']\/api\/site\/[^"']*\/blog["'][^>]*>[\s\S]*?<\/a>\s*/gi, '');

    const linkClass = extractNavLinkClass(html);
    const buildLink = (slug) => {
        const cls = linkClass ? ` class="${linkClass}"` : '';
        return `<a href="/${slug}"${cls}>${labels[slug]}</a>`;
    };

    // Check which slugs are missing FROM THE NAV LINKS AREA (not CTA buttons)
    const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
    const desktopLinksDiv = navMatch?.[0]?.match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
    const navLinksArea = desktopLinksDiv?.[0] || '';

    const missingSlugs = allSlugs.filter(slug =>
        !navLinksArea.includes(`href="/${slug}"`) && !navLinksArea.includes(`href='/${slug}'`)
    );

    const navLinksHtml = missingSlugs.map(buildLink).join('\n                    ');

    // Desktop nav
    if (html.includes('<!-- NAV_LINKS -->')) {
        html = html.replace(/<!-- NAV_LINKS -->/g, navLinksHtml);
    } else if (missingSlugs.length > 0 && navMatch) {
        const pocetnaLink = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
        if (pocetnaLink) {
            const updated = navMatch[0].replace(pocetnaLink[0], pocetnaLink[0] + '\n                    ' + navLinksHtml);
            html = html.replace(navMatch[0], updated);
        }
    }

    // Mobile menu
    const mmMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mmMatch && missingSlugs.length > 0) {
        const mobileHtml = mmMatch[0];
        const mobileMissing = missingSlugs.filter(slug =>
            !mobileHtml.match(new RegExp(`<a\\\\s[^>]*href=["']\\\\/${slug}["'][^>]*>\\\\s*${labels[slug]}\\\\s*<\\\\/a>`, 'i'))
        );
        if (mobileMissing.length > 0) {
            let mobileCls = '';
            const mobilePocetna = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mobilePocetna) {
                const c = mobilePocetna[0].match(/class="([^"]*)"/);
                if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim();
            }
            const mobileLinks = mobileMissing.map(s => `<a href="/${s}"${mobileCls ? ` class="${mobileCls}"` : ''}>${labels[s]}</a>`).join('\n            ');
            if (html.includes('<!-- NAV_LINKS_MOBILE -->')) {
                html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, mobileLinks);
            } else if (mobilePocetna) {
                const updatedMobile = mobileHtml.replace(mobilePocetna[0], mobilePocetna[0] + '\n            ' + mobileLinks);
                html = html.replace(mmMatch[0], updatedMobile);
            }
        }
    }

    // Footer
    if (missingSlugs.length > 0) {
        if (html.includes('<!-- FOOTER_NAV_LINKS -->')) {
            const footerLinks = missingSlugs.map(s => `<li><a href="/${s}" class="text-textMuted hover:text-white transition-colors">${labels[s]}</a></li>`).join('\n                        ');
            html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, footerLinks);
        } else {
            const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
            if (footerMatch) {
                const footerHomeLi = footerMatch[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>\s*<\/li>/i);
                if (footerHomeLi && !footerMatch[0].includes(`href="/${missingSlugs[0]}"`)) {
                    const footerLiLinks = missingSlugs.map(s => `<li><a href="/${s}" class="hover:text-white transition-colors">${labels[s]}</a></li>`).join('\n                        ');
                    const updatedFooter = footerMatch[0].replace(footerHomeLi[0], footerHomeLi[0] + '\n                        ' + footerLiLinks);
                    html = html.replace(footerMatch[0], updatedFooter);
                }
            }
        }
    }

    // Clean markers
    html = html.replace(/<!-- NAV_LINKS -->/g, '');
    html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, '');
    html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, '');

    return html;
}

/**
 * Replace a subpage's <header>/<nav> and <footer> with the homepage's canonical versions.
 */
function replaceNavAndFooterClient(subpageHtml, homepageHtml) {
    if (!subpageHtml || !homepageHtml) return subpageHtml;

    // Replace <header> (or <nav> if no header)
    const homeHeader = homepageHtml.match(/<header[\s\S]*?<\/header>/i);
    const subHeader = subpageHtml.match(/<header[\s\S]*?<\/header>/i);
    if (homeHeader && subHeader) {
        subpageHtml = subpageHtml.replace(subHeader[0], homeHeader[0]);
    } else {
        const homeNav = homepageHtml.match(/<nav[\s\S]*?<\/nav>/i);
        const subNav = subpageHtml.match(/<nav[\s\S]*?<\/nav>/i);
        if (homeNav && subNav) {
            subpageHtml = subpageHtml.replace(subNav[0], homeNav[0]);
        }
    }

    // Replace <footer>
    const homeFooter = homepageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    const subFooter = subpageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    if (homeFooter && subFooter) {
        subpageHtml = subpageHtml.replace(subFooter[0], homeFooter[0]);
    }

    return subpageHtml;
}

/**
 * Normalize mobile nav so Početna matches other links' styling.
 */
function normalizeMobileNavClient(html) {
    if (!html) return html;
    const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (!mobileMenuMatch) return html;
    const mobileHtml = mobileMenuMatch[0];
    const otherLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi);
    if (!otherLinks || otherLinks.length === 0) return html;
    const standardCls = otherLinks[0].match(/class="([^"]*)"/);
    if (!standardCls) return html;
    const pocetnaMatch = mobileHtml.match(/<a\s([^>]*)href=["']\/["']([^>]*)>\s*Početna\s*<\/a>/i);
    if (!pocetnaMatch) return html;
    const fullPocetna = pocetnaMatch[0];
    const pocetnaCls = fullPocetna.match(/class="([^"]*)"/);
    if (!pocetnaCls || pocetnaCls[1] === standardCls[1]) return html;
    const updatedPocetna = fullPocetna.replace(`class="${pocetnaCls[1]}"`, `class="${standardCls[1]}"`);
    return html.replace(mobileMenuMatch[0], mobileHtml.replace(fullPocetna, updatedPocetna));
}

/**
 * Client-side blog nav link injection.
 */
function injectBlogNavLinkClient(html) {
    if (!html) return html;
    if (html.includes('href="/blog"') || html.includes("href='/blog'")) return html;

    const linkClass = extractNavLinkClass(html);
    const blogLink = `<a href="/blog"${linkClass ? ` class="${linkClass}"` : ''}>Blog</a>`;

    // Desktop nav
    const navSection = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (navSection) {
        const desktopLinks = navSection[0].match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
        if (desktopLinks) {
            const linkPattern = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
            const links = desktopLinks[0].match(linkPattern);
            if (links && links.length > 0) {
                const lastLink = links[links.length - 1];
                html = html.replace(desktopLinks[0], desktopLinks[0].replace(lastLink, lastLink + '\n                    ' + blogLink));
            }
        } else {
            const linkPattern = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
            const links = navSection[0].match(linkPattern);
            if (links && links.length > 0) {
                const lastLink = links[links.length - 1];
                html = html.replace(navSection[0], navSection[0].replace(lastLink, lastLink + '\n                    ' + blogLink));
            }
        }
    }

    // Mobile menu
    const mmMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mmMatch && !mmMatch[0].includes('href="/blog"')) {
        const mobileHtml = mmMatch[0];
        const ctaButton = mobileHtml.match(/<a\s[^>]*class="[^"]*(?:bg-(?:primary|brand)[^"]*|inline-flex[^"]*rounded-full)"[^>]*>[\s\S]*?<\/a>/i);
        const mobileNavLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi);
        let mobileCls = '';
        if (mobileNavLinks && mobileNavLinks.length > 0) {
            const c = mobileNavLinks[0].match(/class="([^"]*)"/);
            if (c) mobileCls = c[1];
        }
        if (!mobileCls) {
            const mobilePocetna = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mobilePocetna) { const c = mobilePocetna[0].match(/class="([^"]*)"/); if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g,'').replace(/\bborder-primary\b/g,'').replace(/\s{2,}/g,' ').trim(); }
        }
        const mobileBlogLink = `<a href="/blog"${mobileCls ? ` class="${mobileCls}"` : ''}>Blog</a>`;
        if (ctaButton) {
            html = html.replace(mmMatch[0], mobileHtml.replace(ctaButton[0], mobileBlogLink + '\n            ' + ctaButton[0]));
        } else {
            const allLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi);
            if (allLinks && allLinks.length > 0) {
                const lastLink = allLinks[allLinks.length - 1];
                html = html.replace(mmMatch[0], mobileHtml.replace(lastLink, lastLink + '\n            ' + mobileBlogLink));
            }
        }
    }

    return html;
}

export default function PreviewPanel({ project, hasBlog = false }) {
    const [showPreview, setShowPreview] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [showHtmlEditor, setShowHtmlEditor] = useState(false);
    const [activePage, setActivePage] = useState('home');

    const reactFiles = project.reactFiles || {};
    const pageLabels = getPageLabels(project);
    const pages = ['home', ...Object.keys(reactFiles).filter(k => pageLabels[k])];
    const isAdvanced = pages.length > 1;

    // Build canonical homepage HTML with all nav links first
    const canonicalHomeHtml = useMemo(() => {
        let html = injectNavLinksClient(project.generatedHtml || '', project);
        if (hasBlog) html = injectBlogNavLinkClient(html);
        html = normalizeMobileNavClient(html);
        return html;
    }, [project.generatedHtml, project, hasBlog]);

    // For subpages, replace their nav/footer with homepage's canonical versions
    const activeHtml = useMemo(() => {
        if (activePage === 'home') return canonicalHomeHtml;
        const subpageHtml = reactFiles[activePage] || '';
        return replaceNavAndFooterClient(subpageHtml, canonicalHomeHtml);
    }, [activePage, canonicalHomeHtml, reactFiles]);

    useEffect(() => { setIframeKey(prev => prev + 1); }, [activeHtml]);

    if (!project.generatedHtml) return null;

    const previewUrl = `/api/site/${project.id}/preview`;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={showPreview
                        ? { background: 'var(--lp-surface)', color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }
                        : { background: 'var(--lp-heading)', color: 'var(--lp-bg)' }
                    }
                >
                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPreview ? 'Sakrij Preview' : 'Prikaži Preview'}
                </button>

                <button
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}
                >
                    <ExternalLink size={16} />
                    <span className="hidden sm:inline">Otvori u Novom Tabu</span>
                    <span className="sm:hidden">Novi Tab</span>
                </button>

                <button
                    onClick={() => setShowHtmlEditor(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}
                >
                    <Code2 size={16} />
                    <span className="hidden sm:inline">Uredi HTML</span>
                    <span className="sm:hidden">HTML</span>
                </button>
            </div>

            {/* Page tabs for Advanced plans */}
            {showPreview && isAdvanced && (
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                    {pages.map(slug => (
                        <button
                            key={slug}
                            onClick={() => setActivePage(slug)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={activePage === slug
                                ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                                : { color: 'var(--lp-text-muted)', border: '1px solid transparent' }
                            }
                        >
                            {pageLabels[slug] || slug}
                        </button>
                    ))}
                </div>
            )}

            {showPreview && (
                <div className="rounded-2xl overflow-hidden db-fade-in" style={{ border: '2px solid rgba(34,197,94,0.2)', boxShadow: '0 0 40px rgba(34,197,94,0.05)' }}>
                    <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'var(--lp-bg-alt)', borderBottom: '1px solid var(--lp-border)' }}>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
                        </div>
                        <span className="text-[11px] font-mono ml-2" style={{ color: 'var(--lp-text-muted)' }}>
                            {activePage === 'home' ? 'index.html' : `${activePage}.html`}
                        </span>
                    </div>
                    <PreviewIframe html={activeHtml} iframeKey={iframeKey} />
                </div>
            )}

            {showHtmlEditor && (
                <HtmlEditorModal
                    project={project}
                    projectId={project.id}
                    pageSlug={activePage}
                    initialHtml={activeHtml}
                    onClose={() => setShowHtmlEditor(false)}
                    onSaved={() => { setIframeKey(prev => prev + 1); setShowHtmlEditor(false); }}
                />
            )}
        </div>
    );
}

function PreviewIframe({ html, iframeKey }) {
    const iframeRef = useRef(null);

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
                            else if (href.startsWith('/api/site/')) window.open(href, '_blank');
                        }
                    }
                });
            } catch (error) { console.warn('Cannot access iframe content (cross-origin)'); }
        };

        iframe.addEventListener('load', handleIframeLoad);
        if (iframe.contentDocument?.readyState === 'complete') handleIframeLoad();
        return () => iframe.removeEventListener('load', handleIframeLoad);
    }, [iframeKey]);

    return (
        <iframe
            ref={iframeRef}
            key={iframeKey}
            srcDoc={html}
            className="w-full h-[600px] bg-white"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin"
        />
    );
}

// ─── Lightweight HTML syntax highlighter ─────────────────────────────────────
const C = {
    doctype:    '#f97583',
    comment:    '#6a737d',
    tagBracket: '#79b8ff',
    tagName:    '#85e89d',
    attrName:   '#b392f0',
    attrEq:     '#e1e4e8',
    attrVal:    '#f8b172',
    text:       '#e1e4e8',
};

function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenizeTag(full) {
    let result = '';
    let i = 0;

    // < and optional /
    result += `<span style="color:${C.tagBracket}">&lt;</span>`;
    i++;
    if (full[i] === '/') { result += `<span style="color:${C.tagBracket}">/</span>`; i++; }

    // tag name
    let nameStart = i;
    while (i < full.length && /[a-zA-Z0-9\-:]/.test(full[i])) i++;
    const name = full.slice(nameStart, i);
    if (name) result += `<span style="color:${C.tagName}">${name}</span>`;

    // attributes
    while (i < full.length) {
        const ch = full[i];
        if (ch === '/' && full[i + 1] === '>') { result += `<span style="color:${C.tagBracket}">/&gt;</span>`; break; }
        if (ch === '>') { result += `<span style="color:${C.tagBracket}">&gt;</span>`; break; }
        if (/\s/.test(ch)) { result += ch; i++; continue; }

        // attr name
        let attrStart = i;
        while (i < full.length && !/[\s=>\\/]/.test(full[i])) i++;
        const attrName = full.slice(attrStart, i);
        if (attrName) result += `<span style="color:${C.attrName}">${esc(attrName)}</span>`;

        while (i < full.length && full[i] === ' ') { result += ' '; i++; }

        if (full[i] === '=') {
            result += `<span style="color:${C.attrEq}">=</span>`;
            i++;
        } else continue;

        while (i < full.length && full[i] === ' ') { result += ' '; i++; }

        if (full[i] === '"' || full[i] === "'") {
            const quote = full[i];
            let j = i + 1;
            while (j < full.length && full[j] !== quote) j++;
            const val = full.slice(i, j + 1);
            result += `<span style="color:${C.attrVal}">${esc(val)}</span>`;
            i = j + 1;
        }
    }
    return result;
}

function highlightHtml(raw) {
    let result = '';
    let i = 0;
    const len = raw.length;

    while (i < len) {
        if (raw.startsWith('<!--', i)) {
            const end = raw.indexOf('-->', i + 4);
            const slice = end === -1 ? raw.slice(i) : raw.slice(i, end + 3);
            result += `<span style="color:${C.comment}">${esc(slice)}</span>`;
            i += slice.length; continue;
        }
        if (raw.startsWith('<![', i)) {
            const end = raw.indexOf('>', i + 3);
            const slice = end === -1 ? raw.slice(i) : raw.slice(i, end + 1);
            result += `<span style="color:${C.doctype}">${esc(slice)}</span>`;
            i += slice.length; continue;
        }
        if (raw.startsWith('<!', i)) {
            const end = raw.indexOf('>', i + 2);
            const slice = end === -1 ? raw.slice(i) : raw.slice(i, end + 1);
            result += `<span style="color:${C.doctype}">${esc(slice)}</span>`;
            i += slice.length; continue;
        }
        if (raw[i] === '<' && i + 1 < len && (raw[i + 1] === '/' || /[a-zA-Z!?]/.test(raw[i + 1]))) {
            let j = i + 1;
            let inStr = null;
            while (j < len) {
                if (inStr) { if (raw[j] === inStr) inStr = null; }
                else { if (raw[j] === '"' || raw[j] === "'") inStr = raw[j]; else if (raw[j] === '>') break; }
                j++;
            }
            const full = raw.slice(i, j + 1);
            result += tokenizeTag(full);
            i += full.length; continue;
        }
        let j = i + 1;
        while (j < len && raw[j] !== '<') j++;
        result += `<span style="color:${C.text}">${esc(raw.slice(i, j))}</span>`;
        i = j;
    }
    return result;
}

// Shared editor typography constants — must be IDENTICAL in pre and textarea
const MONO = "'JetBrains Mono','Fira Code',ui-monospace,'Courier New',monospace";
const EDITOR_COMMON = {
    fontFamily: MONO,
    fontSize: '12.5px',
    lineHeight: '1.5rem',
    tabSize: 4,
    padding: '16px 24px 32px 8px',
    margin: 0,
    whiteSpace: 'pre',
    wordWrap: 'normal',
    overflowWrap: 'normal',
    border: 'none',
    outline: 'none',
};

// ─── HTML Editor Modal ────────────────────────────────────────────────────────
function HtmlEditorModal({ project, projectId, pageSlug, initialHtml, onClose, onSaved }) {
    const [html, setHtml] = useState(initialHtml);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const toast = useToast();

    const textareaRef = useRef(null);
    const preRef = useRef(null);
    const lineNumRef = useRef(null);

    // Syntax-highlighted version (recomputed only when html changes)
    const highlighted = useMemo(() => highlightHtml(html), [html]);
    const lineCount = useMemo(() => (html.match(/\n/g) || []).length + 1, [html]);

    // Sync pre + line numbers scroll from textarea
    const syncScroll = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        if (preRef.current) {
            preRef.current.scrollTop = ta.scrollTop;
            preRef.current.scrollLeft = ta.scrollLeft;
        }
        if (lineNumRef.current) {
            lineNumRef.current.scrollTop = ta.scrollTop;
        }
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const ta = e.target;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const next = html.substring(0, start) + '    ' + html.substring(end);
            setHtml(next);
            setIsDirty(true);
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
        if (e.key === 'Escape' && !isDirty) onClose();
    }, [html, isDirty]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/project/${projectId}/html`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, pageSlug }),
            });
            if (res.ok) {
                setSaved(true); setIsDirty(false);
                setTimeout(() => { setSaved(false); onSaved(); }, 1200);
            } else {
                const d = await res.json();
                toast.error(d.error || 'Greška pri spremanju.');
            }
        } catch { toast.error('Greška veze. Pokušajte ponovno.'); }
        finally { setSaving(false); }
    };

    const handleReset = () => { setHtml(initialHtml); setIsDirty(false); };

    const fileName = pageSlug === 'home' ? 'index.html' : `${pageSlug}.html`;
    const pageLabel = getPageLabels(project)[pageSlug] || pageSlug;

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
            <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-3 sm:p-4">

                {/* ── Title Bar ── */}
                <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
                    style={{ background: '#161b22', border: '1px solid #30363d', borderBottom: 'none', borderRadius: '12px 12px 0 0' }}>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            <Code2 size={13} style={{ color: '#6e7681' }} />
                            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#c9d1d9' }}>{fileName}</span>
                            {pageSlug !== 'home' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>{pageLabel}</span>
                            )}
                            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline" style={{ fontFamily: MONO, fontSize: '11px', color: '#6e7681' }}>
                            {lineCount.toLocaleString()} ln · {(html.length / 1024).toFixed(1)} KB
                        </span>
                        {isDirty && (
                            <button onClick={handleReset}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80"
                                style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}>
                                <RotateCcw size={12} />
                                <span className="hidden sm:inline">Resetiraj</span>
                            </button>
                        )}
                        <button onClick={handleSave} disabled={saving || !isDirty}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:scale-105 disabled:opacity-40"
                            style={saved
                                ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
                                : { background: '#e6edf3', color: '#0d1117' }}>
                            {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
                            {saving ? 'Sprema...' : saved ? 'Spremljeno!' : 'Spremi'}
                            {!saved && <span className="hidden sm:inline ml-1" style={{ fontSize: '10px', opacity: 0.55 }}>⌘S</span>}
                        </button>
                        <button onClick={onClose}
                            className="p-1.5 rounded-lg hover:opacity-80"
                            style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}>
                            <X size={15} />
                        </button>
                    </div>
                </div>



                {/* ── Editor body ── */}
                <div className="flex flex-1 min-h-0"
                    style={{ background: '#0d1117', border: '1px solid #30363d', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>

                    {/* Line numbers — scrolled by JS, not by user */}
                    <div ref={lineNumRef}
                        style={{
                            fontFamily: MONO, fontSize: '12.5px', lineHeight: '1.5rem',
                            padding: '16px 12px 32px 16px',
                            minWidth: '3.5rem', width: '3.5rem',
                            background: '#0d1117', color: '#4b5563',
                            textAlign: 'right', flexShrink: 0,
                            overflowY: 'hidden', overflowX: 'hidden',
                            userSelect: 'none', pointerEvents: 'none',
                        }}>
                        {Array.from({ length: lineCount }, (_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>

                    {/* Highlight + textarea overlay container */}
                    <div className="relative flex-1 min-w-0" style={{ overflow: 'hidden' }}>

                        {/* Highlighted pre — background layer, no scrollbars, synced via JS */}
                        <pre ref={preRef}
                            aria-hidden="true"
                            style={{
                                ...EDITOR_COMMON,
                                position: 'absolute', inset: 0,
                                color: '#e1e4e8',
                                background: 'transparent',
                                overflow: 'hidden',  // NO scrollbars — JS driven
                                pointerEvents: 'none',
                                zIndex: 0,
                            }}
                            dangerouslySetInnerHTML={{ __html: highlighted + '\u200b' }}
                        />

                        {/* Transparent textarea — THE scroll master */}
                        <textarea ref={textareaRef}
                            value={html}
                            onChange={(e) => { setHtml(e.target.value); setIsDirty(true); setSaved(false); }}
                            onKeyDown={handleKeyDown}
                            onScroll={syncScroll}
                            style={{
                                ...EDITOR_COMMON,
                                position: 'absolute', inset: 0,
                                width: '100%', height: '100%',
                                resize: 'none',
                                background: 'transparent',
                                color: 'transparent',
                                caretColor: '#79b8ff',
                                overflow: 'auto',   // Only this scrolls
                                zIndex: 1,
                            }}
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                    </div>
                </div>

                {/* ── Footer hint ── */}
                <div className="pt-2" style={{ fontFamily: MONO, fontSize: '11px', color: '#6e7681' }}>
                    💡 Tab indenta · ⌘S spremi · Esc zatvori
                </div>
            </div>
        </div>
    );
}
