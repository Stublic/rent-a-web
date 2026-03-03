import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/site/[projectId]/preview — Serve the project's generated HTML with nav injection
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const pageSlug = req.nextUrl.searchParams.get('page') || 'home';

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            generatedHtml: true,
            reactFiles: true,
            contentData: true,
            blogPosts: { select: { id: true }, where: { status: 'PUBLISHED' }, take: 1 }
        }
    });

    if (!project?.generatedHtml) {
        return new NextResponse('Stranica nije pronađena', { status: 404 });
    }

    let html = pageSlug === 'home'
        ? project.generatedHtml
        : (project.reactFiles as Record<string, string>)?.[pageSlug] || project.generatedHtml;

    // Inject nav links for subpages
    html = injectSubpageNavLinks(html, project);

    // Inject blog nav link if blog posts exist
    const hasBlog = project.blogPosts && project.blogPosts.length > 0;
    if (hasBlog) html = injectBlogNavLink(html);

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// ─── Nav injection (mirrors route.js logic) ────────────────────────

const PREDEFINED_SUBPAGE_LABELS: Record<string, string> = {
    'o-nama': 'O nama',
    'usluge': 'Usluge',
    'kontakt': 'Kontakt',
};

function getSubpageLabels(project: any): Record<string, string> {
    const labels = { ...PREDEFINED_SUBPAGE_LABELS };
    const customMeta = (project.contentData || {} as any)._customSubpages || {};
    for (const [slug, meta] of Object.entries(customMeta) as [string, any][]) {
        if (meta && meta.title) {
            labels[slug] = meta.title;
        }
    }
    return labels;
}

function stripActiveClasses(cls: string): string {
    return cls
        .replace(/\bborder-b[-\w]*/g, '')
        .replace(/\bpb-\d+/g, '')
        .replace(/\btext-primary\b/g, '')
        .replace(/\btext-white\b/g, 'text-gray-300')
        .replace(/\bfont-medium\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function injectSubpageNavLinks(html: string, project: any): string {
    const reactFiles = (project.reactFiles || {}) as Record<string, string>;
    const labels = getSubpageLabels(project);
    const allSlugs = Object.keys(reactFiles).filter(k => labels[k]);
    if (allSlugs.length === 0) return html;

    // Filter out slugs already present in the HTML
    const missingSlugs = allSlugs.filter(slug =>
        !html.includes(`href="/${slug}"`) && !html.includes(`href='/${slug}'`)
    );
    if (missingSlugs.length === 0) return html;

    // Find the "Početna" TEXT link (not logo) to extract its styling
    const firstNav = html.match(/<nav[\s\S]*?<\/nav>/i);
    let linkClass = '';
    if (firstNav) {
        const pocetnaLink = firstNav[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
        if (pocetnaLink) {
            const cls = pocetnaLink[0].match(/class="([^"]*)"/);
            if (cls) {
                linkClass = cls[1]
                    .replace(/\bborder-b[-\w]*/g, '')
                    .replace(/\bborder-primary\b/g, '')
                    .replace(/\bpb-\d+/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
            }
        }
    }

    const buildLink = (slug: string) => {
        const cls = linkClass ? ` class="${linkClass}"` : '';
        return `<a href="/${slug}"${cls}>${labels[slug]}</a>`;
    };

    const navLinksHtml = missingSlugs.map(buildLink).join('\n                    ');
    const footerLinksHtml = missingSlugs.map(s => `<a href="/${s}">${labels[s]}</a>`).join('\n');

    // Header injection
    if (html.includes('<!-- NAV_LINKS -->')) {
        html = html.replace(/<!-- NAV_LINKS -->/g, navLinksHtml);
    } else {
        const allNavs = html.match(/<nav[\s\S]*?<\/nav>/gi) || [];
        for (const navBlock of allNavs) {
            const homeLinkMatch = navBlock.match(/<a\s[^>]*href=["']\/["'][^>]*>[\s\S]*?<\/a>/i);
            if (homeLinkMatch) {
                const updated = navBlock.replace(
                    homeLinkMatch[0],
                    homeLinkMatch[0] + '\n                    ' + navLinksHtml
                );
                html = html.replace(navBlock, updated);
            }
        }
    }

    // Footer injection
    if (html.includes('<!-- FOOTER_NAV_LINKS -->')) {
        html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, footerLinksHtml);
    }

    return html;
}

function injectBlogNavLink(html: string): string {
    if (html.includes('href="/blog"') || html.includes("href='/blog'")) return html;

    const navSection = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (!navSection) return html;

    const navHtml = navSection[0];

    // Find the "Početna" text link to copy its style
    const pocetnaLink = navHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
    let linkClass = '';
    if (pocetnaLink) {
        const cls = pocetnaLink[0].match(/class="([^"]*)"/);
        if (cls) {
            linkClass = cls[1]
                .replace(/\bborder-b[-\w]*/g, '')
                .replace(/\bborder-primary\b/g, '')
                .replace(/\bpb-\d+/g, '')
                .replace(/\s{2,}/g, ' ')
                .trim();
        }
    }

    const blogLink = `<a href="/blog"${linkClass ? ` class="${linkClass}"` : ''}>Blog</a>`;

    // Find last regular nav link and inject after it
    const navLinkPattern = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
    const navLinks = navHtml.match(navLinkPattern);
    if (!navLinks || navLinks.length === 0) return html;

    const lastNavLink = navLinks[navLinks.length - 1];
    const updatedNav = navHtml.replace(lastNavLink, lastNavLink + '\n                    ' + blogLink);
    html = html.replace(navSection[0], updatedNav);

    return html;
}
