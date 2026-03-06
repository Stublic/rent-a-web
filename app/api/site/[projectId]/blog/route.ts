import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractBlogColors } from '@/lib/blog-colors';

// ─── Nav injection helpers (same logic as preview route) ──────────────────────

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
    // Strip old blog links
    html = html.replace(/<a\s[^>]*href=["']\/api\/site\/[^"']*\/blog["'][^>]*>[\s\S]*?<\/a>\s*/gi, '');
    const reactFiles = (project.reactFiles || {}) as Record<string, string>;
    const labels = getLabels(project);
    const allSlugs = Object.keys(reactFiles).filter(k => labels[k]);
    const linkClass = extractNavLinkClass(html);
    // Check desktop nav area only
    const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
    const dld = navMatch?.[0]?.match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
    const navArea = dld?.[0] || '';
    const missing = allSlugs.filter(s => !navArea.includes(`href="/${s}"`) && !navArea.includes(`href='/${s}'`));
    if (missing.length > 0) {
        const nl = missing.map(s => `<a href="/${s}"${linkClass ? ` class="${linkClass}"` : ''}>${labels[s]}</a>`).join('\n                    ');
        if (html.includes('<!-- NAV_LINKS -->')) { html = html.replace('<!-- NAV_LINKS -->', nl); }
        else if (navMatch) { const poc = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i); if (poc) html = html.replace(navMatch[0], navMatch[0].replace(poc[0], poc[0] + '\n                    ' + nl)); }
        // Mobile
        const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
        if (mm) { const mp = mm[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i); let mc = ''; if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim(); } const ml = missing.map(s => `<a href="/${s}"${mc ? ` class="${mc}"` : ''}>${labels[s]}</a>`).join('\n            '); if (html.includes('<!-- NAV_LINKS_MOBILE -->')) html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, ml); else if (mp) html = html.replace(mm[0], mm[0].replace(mp[0], mp[0] + '\n            ' + ml)); }
        // Footer
        if (html.includes('<!-- FOOTER_NAV_LINKS -->')) { html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, missing.map(s => `<li><a href="/${s}" class="text-textMuted hover:text-white transition-colors">${labels[s]}</a></li>`).join('\n                        ')); }
        else { const fm = html.match(/<footer[\s\S]*?<\/footer>/i); if (fm) { const fh = fm[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*>[^<]*<\/a>\s*<\/li>/i); if (fh && !fm[0].includes(`href="/${missing[0]}"`)) { let fc = 'hover:text-white transition-colors'; const fcm = fh[0].match(/<a\s[^>]*class="([^"]*)"/); if (fcm) fc = fcm[1]; const fl = missing.map(s => `<li><a href="/${s}" class="${fc}">${labels[s]}</a></li>`).join('\n                        '); html = html.replace(fm[0], fm[0].replace(fh[0], fh[0] + '\n                        ' + fl)); } } }
    }
    html = html.replace(/<!-- NAV_LINKS -->/g, '').replace(/<!-- NAV_LINKS_MOBILE -->/g, '').replace(/<!-- FOOTER_NAV_LINKS -->/g, '');
    return html;
}

function injectBlogNavForBlog(html: string): string {
    if (html.includes('href="/blog"') || html.includes("href='/blog'")) return html;
    const lc = extractNavLinkClass(html);
    const bl = `<a href="/blog"${lc ? ` class="${lc}"` : ''}>Blog</a>`;
    const ns = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (ns) { const dl = ns[0].match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i); const t = dl || ns; const lp = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi; const links = t[0].match(lp); if (links?.length) { const last = links[links.length - 1]; html = html.replace(t[0], t[0].replace(last, last + '\n                    ' + bl)); } }
    // Mobile
    const mm = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mm && !mm[0].includes('href="/blog"')) { const mh = mm[0]; const cta = mh.match(/<a\s[^>]*class="[^"]*(?:bg-(?:primary|brand)[^"]*|inline-flex[^"]*rounded-full)"[^>]*>[\s\S]*?<\/a>/i); const mnl = mh.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi); let mc = ''; if (mnl?.length) { const c = mnl[0].match(/class="([^"]*)"/); if (c) mc = c[1]; } if (!mc) { const mp = mh.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i); if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mc = c[1]; } } const mbl = `<a href="/blog"${mc ? ` class="${mc}"` : ''}>Blog</a>`; if (cta) html = html.replace(mm[0], mh.replace(cta[0], mbl + '\n            ' + cta[0])); else { const all = mh.match(/<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi); if (all?.length) html = html.replace(mm[0], mh.replace(all[all.length - 1], all[all.length - 1] + '\n            ' + mbl)); } }
    // Footer
    const fm = html.match(/<footer[\s\S]*?<\/footer>/i);
    if (fm && !fm[0].includes('href="/blog"')) { const items = fm[0].match(/<li>\s*<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[\s\S]*?<\/a>\s*<\/li>/gi); if (items?.length) { const last = items[items.length - 1]; let fc = 'hover:text-white transition-colors'; const fpc = fm[0].match(/<li>\s*<a\s[^>]*class="([^"]*)"[^>]*href=["']\/["']/i) || fm[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*class="([^"]*)"/i); if (fpc) fc = fpc[1]; html = html.replace(fm[0], fm[0].replace(last, last + `\n                        <li><a href="/blog" class="${fc}">Blog</a></li>`)); } }
    return html;
}

function normalizeMobileNavForBlog(html: string): string {
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

/**
 * Rewrite nav/footer links from relative paths to preview API paths.
 * e.g. href="/o-nama" → href="/api/site/[id]/preview?page=o-nama"
 *      href="/blog"   → href="/api/site/[id]/blog"
 *      href="/"       → href="/api/site/[id]/preview"
 */
function rewriteLinksForPreview(html: string, projectId: string): string {
    // Rewrite /blog links
    html = html.replace(/href="\/blog"/gi, `href="/api/site/${projectId}/blog"`);
    html = html.replace(/href='\/blog'/gi, `href='/api/site/${projectId}/blog'`);
    // Rewrite subpage links (e.g. /o-nama, /usluge, /kontakt)
    html = html.replace(/href="\/([a-z][a-z0-9-]*)"/gi, (match, slug) => {
        if (slug === 'blog') return match; // already handled
        return `href="/api/site/${projectId}/preview?page=${slug}"`;
    });
    // Rewrite home link
    html = html.replace(/href="\/"/g, `href="/api/site/${projectId}/preview"`);
    html = html.replace(/href='\/'/g, `href='/api/site/${projectId}/preview'`);
    // Fix hash links
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

    // Check both <header> and <nav> tags
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

// Detect if the main site uses a dark theme
function detectDarkTheme(html: string): boolean {
    const bgMatch = html.match(/(?:body|html)\s*\{[^}]*background(?:-color)?\s*:\s*([^;}\s]+)/i);
    if (bgMatch) {
        const bg = bgMatch[1].toLowerCase();
        if (bg.match(/^#[0-3]/i) || bg.match(/^#(?:[0-9a-f]){3}$/i) && bg < '#888') return true;
        if (bg.includes('rgb') && bg.match(/\d+/g)?.every(v => parseInt(v) < 80)) return true;
        if (['black', '#000', '#0a0a0a', '#111', '#18181b', '#1a1a1a', '#0d0d0d'].includes(bg)) return true;
    }
    if (html.match(/class="[^"]*dark/i) || html.match(/data-theme="dark"/i)) return true;
    if (html.match(/bg-(?:zinc|gray|slate|neutral)-(?:9[0-9][0-9]|800|850)/)) return true;
    return false;
}

// GET /api/site/[projectId]/blog — Public blog listing page
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;

    // Parse query params for search/filter
    const searchQuery = req.nextUrl.searchParams.get('q') || '';
    const categoryFilter = req.nextUrl.searchParams.get('category') || '';
    const tagFilter = req.nextUrl.searchParams.get('tag') || '';

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, contentData: true, planName: true, generatedHtml: true, reactFiles: true }
    });

    if (!project) {
        return new NextResponse('Stranica nije pronađena', { status: 404 });
    }

    // Build filter conditions
    const where: any = { projectId, status: 'PUBLISHED' };

    if (searchQuery) {
        where.OR = [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { excerpt: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } },
        ];
    }

    if (categoryFilter) {
        where.category = { slug: categoryFilter };
    }

    if (tagFilter) {
        where.tags = { contains: tagFilter, mode: 'insensitive' };
    }

    const posts = await prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        select: {
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
            tags: true,
            category: { select: { name: true, slug: true } },
        }
    });

    // Fetch all categories for filter UI
    const categories = await prisma.blogCategory.findMany({
        where: { projectId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: { where: { status: 'PUBLISHED' } } } } }
    });

    // Collect all unique tags across all published posts for filter UI
    const allPosts = await prisma.blogPost.findMany({
        where: { projectId, status: 'PUBLISHED', tags: { not: null } },
        select: { tags: true }
    });
    const allTags = [...new Set(
        allPosts.flatMap(p => p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])
    )].sort();

    const content = project.contentData as any;
    const primary = content?.primaryColor || '#22c55e';
    const bizName = content?.businessName || project.name;
    const baseUrl = `/api/site/${projectId}/blog`;
    const homeUrl = `/api/site/${projectId}/preview`;

    // Process homepage through full nav injection before extracting chrome
    let processedHtml = project.generatedHtml || '';
    processedHtml = injectNavLinksForBlog(processedHtml, project);
    processedHtml = injectBlogNavForBlog(processedHtml);
    processedHtml = normalizeMobileNavForBlog(processedHtml);
    processedHtml = rewriteLinksForPreview(processedHtml, projectId);

    const chrome = processedHtml ? extractSiteChrome(processedHtml) : null;
    const isDark = project.generatedHtml ? detectDarkTheme(project.generatedHtml) : true;
    const blogColors = extractBlogColors(project.generatedHtml || '');

    const formatDate = (d: Date | null) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Active filter label
    const activeFilter = categoryFilter
        ? categories.find(c => c.slug === categoryFilter)?.name || categoryFilter
        : tagFilter ? `#${tagFilter}` : '';

    const postsHtml = posts.length > 0
        ? posts.map(p => {
            const postTags = p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
            return `
            <a href="${baseUrl}/${p.slug}" class="post-card">
                ${p.coverImage ? `<div class="post-cover"><img src="${p.coverImage}" alt="${p.title}" loading="lazy" /></div>` : ''}
                <div class="post-info">
                    ${p.category ? `<span class="post-category">${p.category.name}</span>` : ''}
                    <h2>${p.title}</h2>
                    ${p.excerpt ? `<p class="excerpt">${p.excerpt}</p>` : ''}
                    <div class="post-meta-row">
                        <span class="date">${formatDate(p.publishedAt)}</span>
                        ${postTags.length > 0 ? `<div class="post-tags">${postTags.slice(0, 3).map((t: string) => `<span class="post-tag">#${t}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
            </a>
        `}).join('')
        : `<div class="empty"><p>${searchQuery || categoryFilter || tagFilter ? 'Nema rezultata za zadani filter.' : 'Još nema objavljenih članaka.'}</p>${searchQuery || categoryFilter || tagFilter ? `<a href="${baseUrl}" class="clear-filter">Prikaži sve članke</a>` : ''}</div>`;

    // Categories filter chips
    const categoriesHtml = categories.length > 0 ? `
        <div class="filter-chips">
            <a href="${baseUrl}" class="filter-chip ${!categoryFilter && !tagFilter && !searchQuery ? 'active' : ''}">Sve</a>
            ${categories.filter(c => c._count.posts > 0).map(c => `
                <a href="${baseUrl}?category=${c.slug}" class="filter-chip ${categoryFilter === c.slug ? 'active' : ''}">${c.name} <span class="chip-count">${c._count.posts}</span></a>
            `).join('')}
        </div>
    ` : '';

    // Tags cloud
    const tagsHtml = allTags.length > 0 ? `
        <div class="tag-cloud">
            ${allTags.map(t => `
                <a href="${baseUrl}?tag=${encodeURIComponent(t)}" class="tag-link ${tagFilter === t ? 'active' : ''}">#${t}</a>
            `).join('')}
        </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | ${bizName}</title>
    <meta name="description" content="Blog - ${bizName}. Najnoviji članci i vijesti.">
    <meta property="og:title" content="Blog | ${bizName}">
    <meta property="og:description" content="Najnoviji članci i vijesti - ${bizName}">
    <meta property="og:type" content="website">
    <link rel="canonical" href="${baseUrl}">
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
            --blog-footer-bg: ${blogColors.footerBg};
            --blog-footer-border: ${blogColors.footerBorder};
        }

        /* ===== Blog Layout ===== */
        .blog-content-area {
            background: var(--blog-bg);
            color: var(--blog-text);
            min-height: 60vh;
        }

        .blog-hero {
            text-align: center;
            padding: 6rem 2rem 1.5rem;
            max-width: 800px;
            margin: 0 auto;
        }
        .blog-hero h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--blog-heading);
            margin-bottom: 0.75rem;
        }
        .blog-hero p {
            color: var(--blog-text-muted);
            font-size: 1.125rem;
        }

        /* ===== Search Bar ===== */
        .search-bar {
            max-width: 600px;
            margin: 1.5rem auto 0;
            position: relative;
        }
        .search-bar input {
            width: 100%;
            padding: 0.85rem 1.25rem 0.85rem 3rem;
            background: var(--blog-surface);
            border: 1px solid var(--blog-border);
            border-radius: 0.75rem;
            color: var(--blog-heading);
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s, background 0.3s;
            box-sizing: border-box;
        }
        .search-bar input:focus {
            border-color: ${primary};
            background: var(--blog-card-bg);
        }
        .search-bar input::placeholder { color: var(--blog-text-muted); }
        .search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--blog-text-muted);
            pointer-events: none;
        }

        /* ===== Filter Chips (Categories) ===== */
        .filter-section {
            max-width: 900px;
            margin: 1.5rem auto 0;
            padding: 0 2rem;
        }
        .filter-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
        }
        .filter-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.5rem 1rem;
            background: var(--blog-surface);
            border: 1px solid var(--blog-border);
            border-radius: 2rem;
            color: var(--blog-text-secondary);
            font-size: 0.85rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.2s;
        }
        .filter-chip:hover {
            background: var(--blog-surface-hover);
            border-color: ${primary}44;
            color: var(--blog-heading);
        }
        .filter-chip.active {
            background: ${primary}18;
            border-color: ${primary}44;
            color: ${primary};
            font-weight: 600;
        }
        .chip-count {
            font-size: 0.7rem;
            background: var(--blog-border);
            padding: 0.1rem 0.4rem;
            border-radius: 1rem;
            color: var(--blog-text-muted);
        }
        .filter-chip.active .chip-count {
            background: ${primary}25;
            color: ${primary};
        }

        /* ===== Tag Cloud ===== */
        .tag-cloud {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            justify-content: center;
            margin-top: 0.75rem;
        }
        .tag-link {
            padding: 0.3rem 0.7rem;
            font-size: 0.8rem;
            color: var(--blog-text-muted);
            text-decoration: none;
            transition: all 0.2s;
            border-radius: 0.4rem;
        }
        .tag-link:hover {
            color: ${primary};
            background: ${primary}10;
        }
        .tag-link.active {
            color: ${primary};
            font-weight: 600;
            background: ${primary}15;
        }

        /* ===== Active Filter Banner ===== */
        .active-filter-banner {
            max-width: 900px;
            margin: 1rem auto 0;
            padding: 0 2rem;
            text-align: center;
        }
        .active-filter-label {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: ${primary}15;
            color: ${primary};
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.85rem;
            font-weight: 500;
        }
        .active-filter-label a {
            color: var(--blog-text-muted);
            text-decoration: none;
            font-size: 1.1rem;
            line-height: 1;
            transition: color 0.2s;
        }
        .active-filter-label a:hover { color: var(--blog-heading); }

        /* ===== Posts ===== */
        .posts {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            display: grid;
            gap: 1.5rem;
        }
        .post-card {
            display: grid;
            grid-template-columns: 1fr;
            background: var(--blog-card-bg);
            border: 1px solid var(--blog-card-border);
            border-radius: 1rem;
            overflow: hidden;
            text-decoration: none;
            color: inherit;
            transition: border-color 0.3s, transform 0.2s, background 0.3s;
        }
        .post-card:hover {
            border-color: ${primary}66;
            transform: translateY(-2px);
        }
        .post-cover {
            width: 100%;
            height: 220px;
            overflow: hidden;
        }
        .post-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
        }
        .post-card:hover .post-cover img {
            transform: scale(1.03);
        }
        .post-info {
            padding: 1.5rem;
        }
        .post-category {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            color: ${primary};
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.4rem;
        }
        .post-info h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--blog-heading);
            margin-bottom: 0.5rem;
            line-height: 1.4;
        }
        .excerpt {
            color: var(--blog-text-secondary);
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 0.75rem;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .post-meta-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .date {
            color: var(--blog-text-muted);
            font-size: 0.8rem;
        }
        .post-tags {
            display: flex;
            gap: 0.35rem;
        }
        .post-tag {
            font-size: 0.75rem;
            color: var(--blog-text-muted);
            background: var(--blog-surface);
            padding: 0.15rem 0.5rem;
            border-radius: 0.3rem;
        }
        .empty {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--blog-text-muted);
        }
        .clear-filter {
            display: inline-block;
            margin-top: 1rem;
            color: ${primary};
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .clear-filter:hover { text-decoration: underline; }

        /* ===== Responsive ===== */
        @media (min-width: 640px) {
            .post-card {
                grid-template-columns: 280px 1fr;
            }
            .post-cover { height: 100%; min-height: 180px; }
        }
        @media (max-width: 640px) {
            .blog-hero h1 { font-size: 1.75rem; }
            .blog-hero { padding: 3rem 1.5rem 1rem; }
            .posts { padding: 1rem; }
            .filter-section { padding: 0 1rem; }
        }
    </style>
</head>
<body>
    ${chrome?.header || `<header style="border-bottom:1px solid var(--blog-border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto"><a href="${homeUrl}" style="font-weight:800;font-size:1.25rem;color:${primary};text-decoration:none">${bizName}</a><a href="${homeUrl}" style="color:var(--blog-text-muted);text-decoration:none;font-size:0.875rem">← Početna</a></header>`}

    <div class="blog-content-area">
    <div class="blog-hero">
        <h1>Blog</h1>
        <p>Najnoviji članci i vijesti</p>
        <div class="search-bar">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="blogSearch" placeholder="Pretraži članke..." value="${searchQuery.replace(/"/g, '&quot;')}" />
        </div>
    </div>

    <div class="filter-section">
        ${categoriesHtml}
        ${tagsHtml}
    </div>

    ${activeFilter ? `
        <div class="active-filter-banner">
            <span class="active-filter-label">
                Filtrirano: <strong>${activeFilter}</strong>
                <a href="${baseUrl}" title="Očisti filter">✕</a>
            </span>
        </div>
    ` : ''}

    <div class="posts">
        ${postsHtml}
    </div>
    </div>

    ${chrome?.footer || `<footer style="text-align:center;padding:3rem 2rem;color:var(--blog-text-muted);font-size:0.8rem;border-top:1px solid var(--blog-footer-border);margin-top:2rem">&copy; ${new Date().getFullYear()} ${bizName}. Sva prava pridržana.</footer>`}

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
                // Close when clicking a link
                menu.querySelectorAll('a').forEach(function(a) {
                    a.addEventListener('click', function() {
                        menu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                        menu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
                    });
                });
            }
        })();

        // Search functionality
        (function() {
            const input = document.getElementById('blogSearch');
            let debounce;
            input.addEventListener('input', function() {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    const q = input.value.trim();
                    const url = new URL(window.location.href);
                    if (q) {
                        url.searchParams.set('q', q);
                    } else {
                        url.searchParams.delete('q');
                    }
                    // Remove category/tag filters when searching
                    url.searchParams.delete('category');
                    url.searchParams.delete('tag');
                    window.location.href = url.toString();
                }, 500);
            });
            // Allow Enter key for immediate search
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    clearTimeout(debounce);
                    const q = input.value.trim();
                    const url = new URL(window.location.href);
                    if (q) {
                        url.searchParams.set('q', q);
                    } else {
                        url.searchParams.delete('q');
                    }
                    url.searchParams.delete('category');
                    url.searchParams.delete('tag');
                    window.location.href = url.toString();
                }
            });
        })();
    </script>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
