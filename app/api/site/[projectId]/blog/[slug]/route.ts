import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractBlogColors } from '@/lib/blog-colors';

// ─── Nav injection helpers ──────────────────────────────────────────────────────

const PREDEFINED_LABELS: Record<string, string> = {
    'o-nama': 'O nama', 'usluge': 'Usluge', 'kontakt': 'Kontakt',
};

function getLabels(project: any): Record<string, string> {
    const labels = { ...PREDEFINED_LABELS };
    const custom = ((project.contentData || {}) as any)._customSubpages || {};
    for (const [slug, meta] of Object.entries(custom) as [string, any][]) {
        if (meta?.title) labels[slug] = meta.title;
    }
    return labels;
}

function extractNavLinkClass(html: string): string {
    const nav = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (!nav) return '';
    const poc = nav[0].match(/<a\s[^>]*href=["']\/["'][^>]*>[^<]*<\/a>/i);
    if (!poc) return '';
    const c = poc[0].match(/class="([^"]*)"/);
    return c ? c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\bpb-\d+/g, '').replace(/\s{2,}/g, ' ').trim() : '';
}

function injectNavLinksForBlog(html: string, project: any): string {
    if (!html || !project) return html;
    html = html.replace(/<a\s[^>]*href=["']\/api\/site\/[^"']*\/blog["'][^>]*>[\s\S]*?<\/a>\s*/gi, '');
    const reactFiles = (project.reactFiles || {}) as Record<string, string>;
    const labels = getLabels(project);
    const allSlugs = Object.keys(reactFiles).filter(k => labels[k]);
    const linkClass = extractNavLinkClass(html);
    const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
    const dld = navMatch?.[0]?.match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
    const navArea = dld?.[0] || '';
    const missing = allSlugs.filter(s => !navArea.includes(`href="/${s}"`) && !navArea.includes(`href='/${s}'`));
    if (missing.length > 0) {
        const nl = missing.map(s => `<a href="/${s}"${linkClass ? ` class="${linkClass}"` : ''}>${labels[s]}</a>`).join('\n                    ');
        if (html.includes('<!-- NAV_LINKS -->')) html = html.replace('<!-- NAV_LINKS -->', nl);
        else if (navMatch) { const poc = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i); if (poc) html = html.replace(navMatch[0], navMatch[0].replace(poc[0], poc[0] + '\n                    ' + nl)); }
        const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
        if (mm) { const mp = mm[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i); let mc = ''; if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim(); } const ml = missing.map(s => `<a href="/${s}"${mc ? ` class="${mc}"` : ''}>${labels[s]}</a>`).join('\n            '); if (html.includes('<!-- NAV_LINKS_MOBILE -->')) html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, ml); else if (mp) html = html.replace(mm[0], mm[0].replace(mp[0], mp[0] + '\n            ' + ml)); }
        if (html.includes('<!-- FOOTER_NAV_LINKS -->')) html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, missing.map(s => `<li><a href="/${s}" class="text-textMuted hover:text-white transition-colors">${labels[s]}</a></li>`).join('\n                        '));
        else { const fm = html.match(/<footer[\s\S]*?<\/footer>/i); if (fm) { const fh = fm[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*>[^<]*<\/a>\s*<\/li>/i); if (fh && !fm[0].includes(`href="/${missing[0]}"`)) { let fc = 'hover:text-white transition-colors'; const fcm = fh[0].match(/<a\s[^>]*class="([^"]*)"/); if (fcm) fc = fcm[1]; const fl = missing.map(s => `<li><a href="/${s}" class="${fc}">${labels[s]}</a></li>`).join('\n                        '); html = html.replace(fm[0], fm[0].replace(fh[0], fh[0] + '\n                        ' + fl)); } } }
    }
    html = html.replace(/<!-- NAV_LINKS -->/g, '').replace(/<!-- NAV_LINKS_MOBILE -->/g, '').replace(/<!-- FOOTER_NAV_LINKS -->/g, '');
    return html;
}

function injectBlogNavForPost(html: string): string {
    if (html.includes('href="/blog"') || html.includes("href='/blog'")) return html;
    const lc = extractNavLinkClass(html);
    const bl = `<a href="/blog"${lc ? ` class="${lc}"` : ''}>Blog</a>`;
    const ns = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (ns) { const dl = ns[0].match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i); const t = dl || ns; const lp = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi; const links = t[0].match(lp); if (links?.length) { const last = links[links.length - 1]; html = html.replace(t[0], t[0].replace(last, last + '\n                    ' + bl)); } }
    const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mm && !mm[0].includes('href="/blog"')) { const mh = mm[0]; const cta = mh.match(/<a\s[^>]*class="[^"]*(?:bg-(?:primary|brand)[^"]*|inline-flex[^"]*rounded-full)"[^>]*>[\s\S]*?<\/a>/i); const mnl = mh.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi); let mc = ''; if (mnl?.length) { const c = mnl[0].match(/class="([^"]*)"/); if (c) mc = c[1]; } const mbl = `<a href="/blog"${mc ? ` class="${mc}"` : ''}>Blog</a>`; if (cta) html = html.replace(mm[0], mh.replace(cta[0], mbl + '\n            ' + cta[0])); else { const all = mh.match(/<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi); if (all?.length) html = html.replace(mm[0], mh.replace(all[all.length - 1], all[all.length - 1] + '\n            ' + mbl)); } }
    const fm = html.match(/<footer[\s\S]*?<\/footer>/i);
    if (fm && !fm[0].includes('href="/blog"')) { const items = fm[0].match(/<li>\s*<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[\s\S]*?<\/a>\s*<\/li>/gi); if (items?.length) { const last = items[items.length - 1]; let fc = 'hover:text-white transition-colors'; const fpc = fm[0].match(/<li>\s*<a\s[^>]*class="([^"]*)"[^>]*href=["']\/["']/i) || fm[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*class="([^"]*)"/i); if (fpc) fc = fpc[1]; html = html.replace(fm[0], fm[0].replace(last, last + `\n                        <li><a href="/blog" class="${fc}">Blog</a></li>`)); } }
    return html;
}

function normalizeMobileNavForPost(html: string): string {
    const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (!mm) return html;
    const mh = mm[0];
    const other = mh.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi);
    if (!other?.length) return html;
    const sc = other[0].match(/class="([^"]*)"/);
    if (!sc) return html;
    const poc = mh.match(/<a\s([^>]*)href=["']\/["']([^>]*)>\s*Početna\s*<\/a>/i);
    if (!poc) return html;
    const pc = poc[0].match(/class="([^"]*)"/);
    if (!pc || pc[1] === sc[1]) return html;
    return html.replace(mm[0], mh.replace(poc[0], poc[0].replace(`class="${pc[1]}"`, `class="${sc[1]}"`)));
}

function rewriteLinksForPreview(html: string, projectId: string): string {
    html = html.replace(/href="\/blog"/gi, `href="/api/site/${projectId}/blog"`);
    html = html.replace(/href='\/blog'/gi, `href='/api/site/${projectId}/blog'`);
    html = html.replace(/href="\/([a-z][a-z0-9-]*)"/gi, (match, slug) => {
        if (slug === 'blog') return match;
        return `href="/api/site/${projectId}/preview?page=${slug}"`;
    });
    html = html.replace(/href="\/"/g, `href="/api/site/${projectId}/preview"`);
    html = html.replace(/href='\/'/g, `href='/api/site/${projectId}/preview'`);
    html = html.replace(/href="#([^"]*)"/g, `href="/api/site/${projectId}/preview#$1"`);
    return html;
}

// Extract header/nav and footer from the project's generated HTML
function extractSiteChrome(html: string) {
    let header = '';
    let footer = '';
    let headContent = '';

    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) headContent = headMatch[1];

    const headerMatch = html.match(/<header[^>]*>[\s\S]*?<\/header>/i);
    if (headerMatch) {
        header = headerMatch[0];
    } else {
        const navMatch = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/i);
        if (navMatch) header = navMatch[0];
    }

    const footerMatch = html.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);
    if (footerMatch) footer = footerMatch[0];

    return { header, footer, headContent };
}

function detectDarkTheme(html: string): boolean {
    const bgMatch = html.match(/(?:body|html)\s*\{[^}]*background(?:-color)?\s*:\s*([^;}\s]+)/i);
    if (bgMatch) {
        const bg = bgMatch[1].toLowerCase();
        if (bg.match(/^#[0-3]/i)) return true;
        if (['black', '#000', '#0a0a0a', '#111', '#18181b', '#1a1a1a', '#0d0d0d'].includes(bg)) return true;
    }
    if (html.match(/class="[^"]*dark/i) || html.match(/data-theme="dark"/i)) return true;
    if (html.match(/bg-(?:zinc|gray|slate|neutral)-(?:9[0-9][0-9]|800|850)/)) return true;
    return false;
}

// GET /api/site/[projectId]/blog/[slug] — Public individual blog post
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string; slug: string }> }) {
    const { projectId, slug } = await params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, contentData: true, generatedHtml: true, reactFiles: true }
    });

    if (!project) {
        return new NextResponse('Stranica nije pronađena', { status: 404 });
    }

    const post = await prisma.blogPost.findFirst({
        where: { projectId, slug, status: 'PUBLISHED' },
        include: { category: { select: { name: true, slug: true } } }
    });

    if (!post) {
        return new NextResponse('Članak nije pronađen', { status: 404 });
    }

    // Fetch other published posts for sidebar & related section
    const otherPosts = await prisma.blogPost.findMany({
        where: { projectId, status: 'PUBLISHED', slug: { not: slug } },
        orderBy: { publishedAt: 'desc' },
        take: 4,
        select: {
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
        }
    });

    const sidebarPosts = otherPosts.slice(0, 2);
    const relatedPosts = otherPosts;

    const content = project.contentData as any;
    const primary = content?.primaryColor || '#22c55e';
    const bizName = content?.businessName || project.name;
    const blogUrl = `/api/site/${projectId}/blog`;
    const homeUrl = `/api/site/${projectId}/preview`;
    const postUrl = `/api/site/${projectId}/blog/${slug}`;

    // Process homepage through full nav injection before extracting chrome
    let processedHtml = project.generatedHtml || '';
    processedHtml = injectNavLinksForBlog(processedHtml, project);
    processedHtml = injectBlogNavForPost(processedHtml);
    processedHtml = normalizeMobileNavForPost(processedHtml);
    processedHtml = rewriteLinksForPreview(processedHtml, projectId);

    const chrome = processedHtml ? extractSiteChrome(processedHtml) : null;
    const isDark = project.generatedHtml ? detectDarkTheme(project.generatedHtml) : true;
    const blogColors = extractBlogColors(project.generatedHtml || '');

    const publishDate = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    const formatDate = (d: Date | null) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Sidebar HTML
    const sidebarHtml = sidebarPosts.length > 0 ? `
        <aside class="sidebar">
            <div class="sidebar-sticky">
                <h3 class="sidebar-title">Najnoviji članci</h3>
                ${sidebarPosts.map(p => `
                    <a href="${blogUrl}/${p.slug}" class="sidebar-card">
                        ${p.coverImage ? `<img src="${p.coverImage}" alt="${p.title}" class="sidebar-img" loading="lazy" />` : ''}
                        <div class="sidebar-card-content">
                            <span class="sidebar-card-title">${p.title}</span>
                            <span class="sidebar-card-date">${formatDate(p.publishedAt)}</span>
                        </div>
                    </a>
                `).join('')}
                <a href="${blogUrl}" class="sidebar-all-link">Svi članci →</a>
            </div>
        </aside>
    ` : '';

    // Social share HTML
    const shareTitle = encodeURIComponent(post.title);
    const shareExcerpt = encodeURIComponent(post.excerpt || '');

    // Related posts HTML
    const relatedHtml = relatedPosts.length > 0 ? `
        <section class="related-section">
            <h2 class="related-title">Pročitajte još</h2>
            <div class="related-grid">
                ${relatedPosts.map(p => `
                    <a href="${blogUrl}/${p.slug}" class="related-card">
                        ${p.coverImage ? `<div class="related-cover"><img src="${p.coverImage}" alt="${p.title}" loading="lazy" /></div>` : `<div class="related-cover related-cover-empty"></div>`}
                        <div class="related-info">
                            <h3>${p.title}</h3>
                            ${p.excerpt ? `<p>${p.excerpt}</p>` : ''}
                            <span class="related-date">${formatDate(p.publishedAt)}</span>
                        </div>
                    </a>
                `).join('')}
            </div>
        </section>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.metaTitle || post.title} | ${bizName}</title>
    <meta name="description" content="${post.metaDescription || post.excerpt || ''}">
    <meta property="og:title" content="${post.metaTitle || post.title}">
    <meta property="og:description" content="${post.metaDescription || post.excerpt || ''}">
    ${post.coverImage ? `<meta property="og:image" content="${post.coverImage}">` : ''}
    <meta property="og:type" content="article">
    <link rel="canonical" href="${blogUrl}/${post.slug}">
    ${chrome?.headContent || `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">`}
    <style>
        /* ===== Theme Variables ===== */
        :root {
            --blog-bg: ${blogColors.bg};
            --blog-surface: ${blogColors.surface};
            --blog-surface-hover: ${blogColors.surfaceHover};
            --blog-border: ${blogColors.border};
            --blog-text: ${blogColors.text};
            --blog-text-secondary: ${blogColors.textSecondary};
            --blog-text-muted: ${blogColors.textMuted};
            --blog-heading: ${blogColors.heading};
            --blog-card-bg: ${blogColors.cardBg};
            --blog-card-border: ${blogColors.cardBorder};
            --blog-code-bg: ${blogColors.codeBg};
            --blog-blockquote-bg: ${blogColors.blockquoteBg};
        }

        .blog-content-area {
            background: var(--blog-bg);
            color: var(--blog-text);
            min-height: 60vh;
        }

        /* ===== Spacer for fixed nav ===== */
        .nav-spacer { height: 80px; }

        /* ===== Cover Image ===== */
        .cover-wrap {
            max-width: 1100px;
            margin: 1.5rem auto 0;
            padding: 0 2rem;
        }
        .cover-img {
            width: 100%;
            height: 420px;
            object-fit: cover;
            border-radius: 1rem;
            display: block;
        }

        /* ===== Main Layout ===== */
        .article-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2.5rem;
            max-width: 1100px;
            margin: 0 auto;
            padding: 2rem;
        }
        @media (min-width: 1024px) {
            .article-layout {
                grid-template-columns: 1fr 300px;
            }
        }

        /* ===== Article ===== */
        .article-main { min-width: 0; }
        .article-meta {
            color: var(--blog-text-muted);
            font-size: 0.85rem;
            margin-bottom: 1rem;
        }
        .article-main h1 {
            font-size: 2.25rem;
            font-weight: 800;
            color: var(--blog-heading);
            line-height: 1.3;
            margin-bottom: 0.75rem;
        }
        .excerpt-text {
            font-size: 1.15rem;
            color: var(--blog-text-secondary);
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--blog-border);
            line-height: 1.7;
        }
        .article-content { line-height: 1.8; color: var(--blog-text); }
        .article-content h2 {
            font-size: 1.5rem; font-weight: 700;
            color: ${primary}; margin: 2rem 0 0.75rem;
        }
        .article-content h3 {
            font-size: 1.2rem; font-weight: 600;
            color: var(--blog-heading); margin: 1.5rem 0 0.5rem;
        }
        .article-content p { margin: 0.85rem 0; color: var(--blog-text); }
        .article-content strong { color: var(--blog-heading); font-weight: 600; }
        .article-content em { font-style: italic; }
        .article-content a {
            color: ${primary}; text-decoration: underline; text-underline-offset: 2px;
        }
        .article-content ul, .article-content ol { padding-left: 1.5rem; margin: 0.75rem 0; }
        .article-content li { margin: 0.35rem 0; color: var(--blog-text); }
        .article-content blockquote {
            border-left: 3px solid ${primary};
            padding: 1rem 1.25rem; margin: 1.5rem 0;
            background: var(--blog-blockquote-bg);
            border-radius: 0 0.75rem 0.75rem 0;
            color: var(--blog-text-secondary);
            font-style: italic; transition: background 0.3s ease;
        }
        .article-content img {
            max-width: 100%; height: auto;
            border-radius: 0.75rem; margin: 1.5rem 0;
        }
        .article-content code {
            background: var(--blog-code-bg);
            padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.9em;
        }

        /* ===== Tags ===== */
        .tags-section {
            display: flex; flex-wrap: wrap; gap: 0.5rem;
            margin-top: 1.5rem;
        }
        .tag-chip {
            display: inline-flex; align-items: center; gap: 0.3rem;
            background: ${primary}15; color: ${primary};
            border: 1px solid ${primary}30;
            padding: 0.4rem 0.85rem; border-radius: 2rem;
            font-size: 0.8rem; font-weight: 500;
            text-decoration: none; transition: all 0.2s;
        }
        .tag-chip:hover {
            background: ${primary}25; border-color: ${primary}50;
            transform: translateY(-1px);
        }
        .category-badge {
            display: inline-flex; align-items: center; gap: 0.4rem;
            color: ${primary}; font-size: 0.85rem; font-weight: 600;
            text-decoration: none;
            margin-bottom: 0.5rem;
        }
        .category-badge:hover { text-decoration: underline; }

        /* ===== Sidebar ===== */
        .sidebar { display: none; }
        @media (min-width: 1024px) {
            .sidebar { display: block; }
        }
        .sidebar-sticky {
            position: sticky;
            top: 100px;
        }
        .sidebar-title {
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--blog-text-muted);
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--blog-border);
        }
        .sidebar-card {
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
            padding: 0.75rem;
            border-radius: 0.75rem;
            text-decoration: none;
            color: inherit;
            transition: background 0.2s;
            margin-bottom: 0.5rem;
        }
        .sidebar-card:hover { background: var(--blog-surface); }
        .sidebar-img {
            width: 72px; height: 52px;
            object-fit: cover; border-radius: 0.5rem;
            flex-shrink: 0;
        }
        .sidebar-card-content { min-width: 0; }
        .sidebar-card-title {
            display: block; font-size: 0.85rem; font-weight: 600;
            color: var(--blog-heading); line-height: 1.4;
            display: -webkit-box; -webkit-line-clamp: 2;
            -webkit-box-orient: vertical; overflow: hidden;
        }
        .sidebar-card-date {
            display: block; font-size: 0.75rem;
            color: var(--blog-text-muted); margin-top: 0.25rem;
        }
        .sidebar-all-link {
            display: block; text-align: center;
            color: ${primary}; font-size: 0.85rem; font-weight: 600;
            text-decoration: none; padding: 0.75rem;
            border: 1px solid var(--blog-border); border-radius: 0.75rem;
            margin-top: 0.5rem; transition: all 0.2s;
        }
        .sidebar-all-link:hover {
            background: ${primary}12; border-color: ${primary}44;
        }

        /* ===== Social Share ===== */
        .share-section {
            margin-top: 3rem; padding-top: 2rem;
            border-top: 1px solid var(--blog-border);
        }
        .share-title {
            font-size: 0.8rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: var(--blog-text-muted); margin-bottom: 1rem;
        }
        .share-buttons {
            display: flex; flex-wrap: wrap; gap: 0.6rem;
        }
        .share-btn {
            display: inline-flex; align-items: center; gap: 0.5rem;
            padding: 0.6rem 1rem; border-radius: 0.6rem;
            text-decoration: none; font-size: 0.85rem; font-weight: 500;
            transition: all 0.2s; border: 1px solid var(--blog-border);
            background: var(--blog-surface); color: var(--blog-heading);
            cursor: pointer;
        }
        .share-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .share-btn.facebook:hover { background: #1877f2; color: white; border-color: #1877f2; }
        .share-btn.twitter:hover { background: #0f1419; color: white; border-color: #0f1419; }
        .share-btn.linkedin:hover { background: #0a66c2; color: white; border-color: #0a66c2; }
        .share-btn.whatsapp:hover { background: #25d366; color: white; border-color: #25d366; }
        .share-btn.copy:hover { background: ${primary}; color: white; border-color: ${primary}; }
        .share-btn svg { flex-shrink: 0; }
        .copy-feedback {
            font-size: 0.8rem; color: ${primary};
            margin-left: 0.5rem; opacity: 0;
            transition: opacity 0.3s;
        }
        .copy-feedback.show { opacity: 1; }

        /* ===== Related Posts ===== */
        .related-section {
            max-width: 1100px; margin: 0 auto;
            padding: 0 2rem 3rem;
        }
        .related-title {
            font-size: 1.5rem; font-weight: 800;
            color: var(--blog-heading); margin-bottom: 1.5rem;
            padding-top: 2rem; border-top: 1px solid var(--blog-border);
        }
        .related-grid {
            display: grid; gap: 1.25rem;
            grid-template-columns: repeat(1, 1fr);
        }
        @media (min-width: 640px) {
            .related-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
            .related-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .related-card {
            background: var(--blog-card-bg);
            border: 1px solid var(--blog-card-border);
            border-radius: 1rem; overflow: hidden;
            text-decoration: none; color: inherit;
            transition: border-color 0.3s, transform 0.2s, background 0.3s;
        }
        .related-card:hover {
            border-color: ${primary}44;
            transform: translateY(-3px);
        }
        .related-cover {
            width: 100%; height: 140px; overflow: hidden;
        }
        .related-cover-empty {
            background: var(--blog-surface);
        }
        .related-cover img {
            width: 100%; height: 100%; object-fit: cover;
            transition: transform 0.3s;
        }
        .related-card:hover .related-cover img { transform: scale(1.05); }
        .related-info { padding: 1rem; }
        .related-info h3 {
            font-size: 0.95rem; font-weight: 700;
            color: var(--blog-heading); margin-bottom: 0.4rem;
            line-height: 1.35;
            display: -webkit-box; -webkit-line-clamp: 2;
            -webkit-box-orient: vertical; overflow: hidden;
        }
        .related-info p {
            color: var(--blog-text-secondary); font-size: 0.8rem;
            line-height: 1.5; margin: 0;
            display: -webkit-box; -webkit-line-clamp: 2;
            -webkit-box-orient: vertical; overflow: hidden;
        }
        .related-date {
            display: block; font-size: 0.75rem;
            color: var(--blog-text-muted); margin-top: 0.5rem;
        }


        @media (max-width: 640px) {
            .article-main h1 { font-size: 1.5rem; }
            .cover-img { height: 220px; border-radius: 0.75rem; }
        }
        @media (max-width: 1023px) {
            .article-layout { max-width: 720px; }
        }
    </style>
</head>
<body>
    ${chrome?.header || `<header style="border-bottom:1px solid var(--blog-border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto"><a href="${homeUrl}" style="font-weight:800;font-size:1.25rem;color:${primary};text-decoration:none">${bizName}</a><a href="${blogUrl}" style="color:var(--blog-text-muted);text-decoration:none;font-size:0.875rem">← Svi članci</a></header>`}

    <div class="blog-content-area">
    <!-- Spacer for fixed nav -->
    <div class="nav-spacer"></div>

    ${post.coverImage ? `
        <div class="cover-wrap">
            <img src="${post.coverImage}" alt="${post.title}" class="cover-img" />
        </div>
    ` : ''}

    <div class="article-layout">
        <article class="article-main">
            ${post.category ? `<a href="${blogUrl}?category=${post.category.slug}" class="category-badge">${post.category.name}</a>` : ''}
            <div class="article-meta">${publishDate}</div>
            <h1>${post.title}</h1>
            ${post.excerpt ? `<p class="excerpt-text">${post.excerpt}</p>` : ''}
            <div class="article-content">
                ${post.content}
            </div>

            <!-- Social Share -->
            <div class="share-section">
                <h3 class="share-title">Podijeli članak</h3>
                <div class="share-buttons">
                    <a href="https://www.facebook.com/sharer/sharer.php?u=SHARE_URL" target="_blank" rel="noopener" class="share-btn facebook" data-share="facebook">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                    </a>
                    <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=SHARE_URL" target="_blank" rel="noopener" class="share-btn twitter" data-share="twitter">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X / Twitter
                    </a>
                    <a href="https://www.linkedin.com/shareArticle?mini=true&url=SHARE_URL&title=${shareTitle}" target="_blank" rel="noopener" class="share-btn linkedin" data-share="linkedin">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                    </a>
                    <a href="https://wa.me/?text=${shareTitle}%20SHARE_URL" target="_blank" rel="noopener" class="share-btn whatsapp" data-share="whatsapp">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                    </a>
                    <button class="share-btn copy" onclick="copyLink()" id="copyBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        Kopiraj link
                        <span class="copy-feedback" id="copyFeedback">✓ Kopirano!</span>
                    </button>
                </div>
            </div>

            ${(() => {
            const postTags = post.tags ? post.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
            if (postTags.length === 0) return '';
            return `<div class="tags-section">${postTags.map((tag: string) => `<a href="${blogUrl}?tag=${encodeURIComponent(tag)}" class="tag-chip">#${tag}</a>`).join('')}</div>`;
        })()}
        </article>

        ${sidebarHtml}
    </div>

    ${relatedHtml}
    </div>

    ${chrome?.footer || `<footer style="text-align:center;padding:3rem 2rem;color:var(--blog-text-muted);font-size:0.8rem;border-top:1px solid var(--blog-border)">&copy; ${new Date().getFullYear()} ${bizName}. Sva prava pridržana.</footer>`}

    <script>
        // Mobile menu toggle
        (function() {
            const btn = document.getElementById('mobile-menu-btn');
            const menu = document.getElementById('mobile-menu');
            if (btn && menu) {
                btn.addEventListener('click', function() {
                    const isOpen = menu.classList.contains('opacity-100');
                    if (isOpen) {
                        menu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                        menu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
                    } else {
                        menu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
                        menu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
                    }
                });
                menu.querySelectorAll('a').forEach(function(a) {
                    a.addEventListener('click', function() {
                        menu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                        menu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
                    });
                });
            }
        })();

        // Set share URLs dynamically (uses current page URL for correct domain)
        const shareUrl = encodeURIComponent(window.location.href);
        document.querySelectorAll('[data-share]').forEach(btn => {
            const href = btn.getAttribute('href');
            if (href) btn.setAttribute('href', href.replace('SHARE_URL', shareUrl));
        });

        // Copy link
        function copyLink() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const fb = document.getElementById('copyFeedback');
                fb.classList.add('show');
                setTimeout(() => fb.classList.remove('show'), 2000);
            });
        }
    </script>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
