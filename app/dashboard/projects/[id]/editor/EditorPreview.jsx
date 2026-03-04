"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ExternalLink, RefreshCw, Pencil, Save, Loader2, Check, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import MediaPickerPopup from "./MediaPickerPopup";
import InfoTooltip from "@/components/InfoTooltip";
import VisualEditorHelp from "./VisualEditorHelp";

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

    const linkClass = extractNavLinkClass(html);

    // Check which slugs are missing FROM THE NAV LINKS AREA (not CTA buttons)
    const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
    const desktopLinksDiv = navMatch?.[0]?.match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
    const navLinksArea = desktopLinksDiv?.[0] || '';

    const missingSlugs = allSlugs.filter(s => !navLinksArea.includes(`href="/${s}"`) && !navLinksArea.includes(`href='/${s}'`));

    if (missingSlugs.length > 0) {
        const navLinksHtml = missingSlugs.map(s => `<a href="/${s}"${linkClass ? ` class="${linkClass}"` : ''}>${labels[s]}</a>`).join('\n                    ');

        // Desktop nav
        if (html.includes('<!-- NAV_LINKS -->')) {
            html = html.replace(/<!-- NAV_LINKS -->/g, navLinksHtml);
        } else if (navMatch) {
            const poc = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (poc) html = html.replace(navMatch[0], navMatch[0].replace(poc[0], poc[0] + '\n                    ' + navLinksHtml));
        }

        // Mobile menu
        const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
        if (mm) {
            const mobileHtml = mm[0];
            const mobileMissing = missingSlugs.filter(slug =>
                !mobileHtml.match(new RegExp(`<a\\\\s[^>]*href=["']\\\\/${slug}["'][^>]*>\\\\s*${labels[slug]}\\\\s*<\\\\/a>`, 'i'))
            );
            if (mobileMissing.length > 0) {
                let mc = '';
                const mp = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
                if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1].replace(/\bborder-b[-\w]*/g,'').replace(/\bborder-primary\b/g,'').replace(/\s{2,}/g,' ').trim(); }
                const ml = mobileMissing.map(s => `<a href="/${s}"${mc ? ` class="${mc}"` : ''}>${labels[s]}</a>`).join('\n            ');
                if (html.includes('<!-- NAV_LINKS_MOBILE -->')) {
                    html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, ml);
                } else if (mp) {
                    html = html.replace(mm[0], mobileHtml.replace(mp[0], mp[0] + '\n            ' + ml));
                }
            }
        }

        // Footer
        if (html.includes('<!-- FOOTER_NAV_LINKS -->')) {
            html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, missingSlugs.map(s => `<li><a href="/${s}" class="text-textMuted hover:text-white transition-colors">${labels[s]}</a></li>`).join('\n                        '));
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
            const mobileHtml = mm[0];
            const cta = mobileHtml.match(/<a\s[^>]*class="[^"]*(?:bg-(?:primary|brand)[^"]*|inline-flex[^"]*rounded-full)"[^>]*>[\s\S]*?<\/a>/i);
            const mobileNavLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi);
            let mc = '';
            if (mobileNavLinks && mobileNavLinks.length > 0) {
                const c = mobileNavLinks[0].match(/class="([^"]*)"/);
                if (c) mc = c[1];
            }
            if (!mc) {
                const mp = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
                if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1].replace(/\bborder-b[-\w]*/g,'').replace(/\bborder-primary\b/g,'').replace(/\s{2,}/g,' ').trim(); }
            }
            const mbl = `<a href="/blog"${mc ? ` class="${mc}"` : ''}>Blog</a>`;
            if (cta) {
                html = html.replace(mm[0], mobileHtml.replace(cta[0], mbl + '\n            ' + cta[0]));
            } else {
                const allLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi);
                if (allLinks && allLinks.length > 0) {
                    const last = allLinks[allLinks.length - 1];
                    html = html.replace(mm[0], mobileHtml.replace(last, last + '\n            ' + mbl));
                }
            }
        }
    }

    return html;
}

/**
 * Replace a subpage's <header>/<nav> and <footer> with the homepage's canonical versions.
 */
function replaceNavAndFooterEditor(subpageHtml, homepageHtml) {
    if (!subpageHtml || !homepageHtml) return subpageHtml;

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

    const homeFooter = homepageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    const subFooter = subpageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    if (homeFooter && subFooter) {
        subpageHtml = subpageHtml.replace(subFooter[0], homeFooter[0]);
    }

    return subpageHtml;
}

function normalizeMobileNavEditor(html) {
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

// ─── Visual Editor Injection Script (inlined) ───────────────────────
// We read the injection script as a string and inject it into the iframe
import { VISUAL_EDITOR_SCRIPT } from "@/lib/visual-editor-injection";

// ─── Component ──────────────────────────────────────────────────────

export default function EditorPreview({ html, projectId, project, hasBlog = false, activePage = 'home' }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const iframeRef = useRef(null);
    const router = useRouter();

    // Visual editor state
    const [isVisualEditMode, setIsVisualEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const pendingImgIdRef = useRef(null);

    const handleRefresh = () => {
        setIsVisualEditMode(false);
        setHasChanges(false);
        setRefreshKey(prev => prev + 1);
    };

    // Build canonical homepage HTML with all nav links first
    const canonicalHomeHtml = useMemo(() => {
        let h = injectNavLinks(project?.generatedHtml || '', project, hasBlog);
        return normalizeMobileNavEditor(h);
    }, [project?.generatedHtml, project, hasBlog]);

    // For subpages, replace nav/footer with homepage's canonical versions
    const injectedHtml = useMemo(() => {
        if (activePage === 'home') return normalizeMobileNavEditor(injectNavLinks(html, project, hasBlog));
        return replaceNavAndFooterEditor(html, canonicalHomeHtml);
    }, [html, project, hasBlog, activePage, canonicalHomeHtml]);

    const openInNewTab = () => {
        const newWindow = window.open();
        if (newWindow && injectedHtml) { newWindow.document.write(injectedHtml); newWindow.document.close(); }
    };

    // ── Turn visual edit mode OFF when switching pages ───────────────
    useEffect(() => {
        setIsVisualEditMode(false);
        setHasChanges(false);
    }, [activePage]);

    // ── Inject editor script into iframe on load ────────────────────
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const handleIframeLoad = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) return;

                // Default link behavior (when NOT in visual edit mode)
                iframeDoc.addEventListener('click', (e) => {
                    // If visual editor is active, let the injection script handle clicks
                    if (iframe.contentWindow?.__visualEditorActive) return;
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

                // Inject the visual editor script
                const script = iframeDoc.createElement('script');
                script.setAttribute('data-ve-script', 'true');
                script.textContent = VISUAL_EDITOR_SCRIPT;
                iframeDoc.body.appendChild(script);
            } catch (error) { console.warn('Cannot access iframe content (cross-origin)'); }
        };
        iframe.addEventListener('load', handleIframeLoad);
        if (iframe.contentDocument?.readyState === 'complete') handleIframeLoad();
        return () => iframe.removeEventListener('load', handleIframeLoad);
    }, [refreshKey]);

    // ── Toggle visual edit mode ─────────────────────────────────────
    const toggleVisualEdit = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return;

        if (isVisualEditMode) {
            // Turning OFF — discard changes (user didn't click save)
            iframe.contentWindow.postMessage({ type: 'disable-visual-edit' }, '*');
            setIsVisualEditMode(false);
            setHasChanges(false);
        } else {
            // Turning ON
            iframe.contentWindow.postMessage({ type: 'enable-visual-edit' }, '*');
            setIsVisualEditMode(true);
            setHasChanges(false);
        }
    }, [isVisualEditMode]);

    // ── Save changes ────────────────────────────────────────────────
    const handleSave = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) return;
        setIsSaving(true);
        iframe.contentWindow.postMessage({ type: 'get-clean-html' }, '*');
    }, []);

    // ── Listen for messages from iframe ─────────────────────────────
    useEffect(() => {
        const handleMessage = async (e) => {
            if (!e.data || typeof e.data.type !== 'string') return;

            switch (e.data.type) {
                case 'visual-edit-change':
                    setHasChanges(true);
                    break;

                case 'image-upload-request': {
                    pendingImgIdRef.current = e.data.imgId;
                    setShowImagePicker(true);
                    break;
                }

                case 'clean-html': {
                    const cleanHtml = e.data.html;
                    if (!cleanHtml) {
                        setIsSaving(false);
                        return;
                    }
                    try {
                        const res = await fetch(`/api/project/${projectId}/html`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ html: cleanHtml, pageSlug: activePage }),
                        });
                        if (res.ok) {
                            // Disable edit mode in iframe
                            const iframe = iframeRef.current;
                            if (iframe?.contentWindow) {
                                iframe.contentWindow.postMessage({ type: 'disable-visual-edit' }, '*');
                            }
                            setIsVisualEditMode(false);
                            setHasChanges(false);
                            setSaveSuccess(true);
                            setTimeout(() => setSaveSuccess(false), 2000);
                            // Notify the PublishIndicator that HTML was saved
                            window.dispatchEvent(new Event('project-html-saved'));
                            router.refresh();
                        } else {
                            console.error('Save failed:', await res.text());
                            alert('Greška pri spremanju. Pokušajte ponovno.');
                        }
                    } catch (err) {
                        console.error('Save error:', err);
                        alert('Greška pri spremanju. Pokušajte ponovno.');
                    } finally {
                        setIsSaving(false);
                    }
                    break;
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [projectId, activePage, router]);

    // ── Handle image selected from MediaPickerPopup ─────────────────
    const handleImageFromPicker = useCallback((mediaItem) => {
        const imgId = pendingImgIdRef.current;
        if (!imgId || !mediaItem?.url) return;
        pendingImgIdRef.current = null;

        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'image-uploaded',
                imgId,
                newSrc: mediaItem.url,
            }, '*');
        }
    }, []);

    return (
        <div className="h-full flex flex-col" style={{ background: 'var(--lp-bg)' }}>
            {/* Header */}
            <div className="px-4 py-2.5 flex items-center justify-between gap-2" style={{ background: 'var(--lp-bg-alt)', borderBottom: '1px solid var(--lp-border)' }}>
                <h2 className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--lp-heading)' }}>Live Preview</h2>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Visual Edit Toggle */}
                    <button
                        onClick={toggleVisualEdit}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                        style={isVisualEditMode
                            ? { background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }
                            : { color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }
                        }
                        title={isVisualEditMode ? 'Isključi vizualno uređivanje' : 'Uključi vizualno uređivanje'}
                    >
                        <Pencil size={13} />
                        <span className="hidden sm:inline">{isVisualEditMode ? 'Uređivanje ON' : 'Vizualno uređivanje'}</span>
                    </button>
                    <span className="hidden sm:inline"><InfoTooltip text="Besplatno uređivanje teksta i slika direktno na stranici. Kliknite na bilo koji element da ga promijenite. Ne troši tokene!" side="bottom" /></span>

                    {/* Help Button */}
                    <button
                        onClick={() => setShowHelp(true)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all hover:bg-white/5"
                        style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }}
                        title="Kako koristiti vizualno uređivanje"
                    >
                        <HelpCircle size={13} /><span className="hidden sm:inline">Pomoć</span>
                    </button>

                    {/* Save Button — only visible when edit mode is on */}
                    {isVisualEditMode && (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
                                style={{
                                    background: saveSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                                    color: saveSuccess ? '#22c55e' : '#3b82f6',
                                    border: saveSuccess ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(59,130,246,0.3)',
                                }}
                                title="Spremi promjene"
                            >
                                {isSaving ? <Loader2 size={13} className="animate-spin" /> : saveSuccess ? <Check size={13} /> : <Save size={13} />}
                                <span className="hidden sm:inline">{isSaving ? 'Spremam...' : saveSuccess ? 'Spremljeno!' : 'Spremi promjene'}</span>
                            </button>
                            <span className="hidden sm:inline"><InfoTooltip text="Sprema vaše vizualne izmjene na server. Promjene odmah postaju vidljive." side="bottom" /></span>
                        </>
                    )}

                    {/* Refresh */}
                    <button onClick={handleRefresh} className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/5" style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }} title="Osvježi preview">
                        <RefreshCw size={13} /><span className="hidden sm:inline">Osvježi</span>
                    </button>
                    {/* New Tab */}
                    <button onClick={openInNewTab} className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/5" style={{ color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }} title="Otvori u novom tabu">
                        <ExternalLink size={13} /><span className="hidden sm:inline">Novi Tab</span>
                    </button>
                </div>
            </div>

            {/* Image Picker Popup (opened when clicking an image in visual edit mode) */}
            {showImagePicker && (
                <MediaPickerPopup
                    projectId={projectId}
                    onClose={() => { setShowImagePicker(false); pendingImgIdRef.current = null; }}
                    onMediaSelected={handleImageFromPicker}
                    imagesOnly={true}
                />
            )}

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

            {/* Visual Editor Help Modal */}
            <VisualEditorHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
}
