import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        select: { name: true, contentData: true, planName: true, generatedHtml: true }
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

    const chrome = project.generatedHtml ? extractSiteChrome(project.generatedHtml) : null;
    const isDark = project.generatedHtml ? detectDarkTheme(project.generatedHtml) : true;

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
<html lang="hr" data-theme="${isDark ? 'dark' : 'light'}">
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
        :root, [data-theme="light"] {
            --blog-bg: #ffffff;
            --blog-surface: #f4f4f5;
            --blog-surface-hover: #e4e4e7;
            --blog-border: #e4e4e7;
            --blog-text: #18181b;
            --blog-text-secondary: #52525b;
            --blog-text-muted: #a1a1aa;
            --blog-heading: #09090b;
            --blog-card-bg: #ffffff;
            --blog-card-border: #e4e4e7;
            --blog-footer-bg: #f4f4f5;
            --blog-footer-border: #e4e4e7;
        }
        [data-theme="dark"] {
            --blog-bg: #0a0a0a;
            --blog-surface: #18181b;
            --blog-surface-hover: #27272a;
            --blog-border: #27272a;
            --blog-text: #e4e4e7;
            --blog-text-secondary: #a1a1aa;
            --blog-text-muted: #52525b;
            --blog-heading: #ffffff;
            --blog-card-bg: #18181b;
            --blog-card-border: #27272a;
            --blog-footer-bg: #111113;
            --blog-footer-border: #18181b;
        }

        /* ===== Blog Layout ===== */
        body {
            background: var(--blog-bg) !important;
            color: var(--blog-text) !important;
            transition: background 0.3s ease, color 0.3s ease;
        }

        .blog-hero {
            text-align: center;
            padding: 4rem 2rem 1.5rem;
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

        /* ===== Theme Toggle ===== */
        .theme-toggle {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            z-index: 9999;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 1px solid var(--blog-border);
            background: var(--blog-surface);
            color: var(--blog-heading);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            backdrop-filter: blur(8px);
        }
        .theme-toggle:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            background: var(--blog-surface-hover);
        }
        .theme-toggle .icon { transition: transform 0.3s ease; display: flex; }
        .theme-toggle:active .icon { transform: rotate(30deg); }

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
            .theme-toggle { bottom: 1rem; right: 1rem; width: 42px; height: 42px; font-size: 1.1rem; }
        }
    </style>
</head>
<body>
    ${chrome?.header || `<header style="border-bottom:1px solid var(--blog-border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto"><a href="${homeUrl}" style="font-weight:800;font-size:1.25rem;color:${primary};text-decoration:none">${bizName}</a><a href="${homeUrl}" style="color:var(--blog-text-muted);text-decoration:none;font-size:0.875rem">← Početna</a></header>`}

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

    ${chrome?.footer || `<footer style="text-align:center;padding:3rem 2rem;color:var(--blog-text-muted);font-size:0.8rem;border-top:1px solid var(--blog-footer-border);margin-top:2rem">&copy; ${new Date().getFullYear()} ${bizName}. Sva prava pridržana.</footer>`}

    <!-- Theme Toggle Button -->
    <button class="theme-toggle" id="themeToggle" title="Promijeni temu" aria-label="Promijeni temu">
        <span class="icon" id="themeIcon"></span>
    </button>

    <script>
        // Fix hash links to point back to the home page
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            const hash = a.getAttribute('href');
            a.href = '${homeUrl}' + hash;
        });

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

        // Theme toggle logic
        (function() {
            const KEY = 'blog-theme-${projectId}';
            const html = document.documentElement;
            const icon = document.getElementById('themeIcon');
            const sunSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
            const moonSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

            function setTheme(theme) {
                html.setAttribute('data-theme', theme);
                icon.innerHTML = theme === 'dark' ? sunSVG : moonSVG;
                try { localStorage.setItem(KEY, theme); } catch(e) {}
            }

            // Load saved preference or use site default
            const saved = (() => { try { return localStorage.getItem(KEY); } catch(e) { return null; } })();
            setTheme(saved || '${isDark ? 'dark' : 'light'}');

            document.getElementById('themeToggle').addEventListener('click', function() {
                const current = html.getAttribute('data-theme');
                setTheme(current === 'dark' ? 'light' : 'dark');
            });
        })();
    </script>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
