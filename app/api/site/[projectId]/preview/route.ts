import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/site/[projectId]/preview — Serve the project's generated HTML with nav injection
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const pageSlug = req.nextUrl.searchParams.get('page') || 'home';

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
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

    // Strip old blog links, inject subpage nav, inject blog nav
    html = stripOldBlogLinks(html);
    html = injectSubpageNavLinks(html, project);
    const hasBlog = project.blogPosts && project.blogPosts.length > 0;
    if (hasBlog) html = injectBlogNavLink(html);

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// ─── Helpers ────────────────────────────────────────────────────────

const PREDEFINED_SUBPAGE_LABELS: Record<string, string> = {
    'o-nama': 'O nama',
    'usluge': 'Usluge',
    'kontakt': 'Kontakt',
};

function getSubpageLabels(project: any): Record<string, string> {
    const labels = { ...PREDEFINED_SUBPAGE_LABELS };
    const customMeta = (project.contentData || {} as any)._customSubpages || {};
    for (const [slug, meta] of Object.entries(customMeta) as [string, any][]) {
        if (meta && meta.title) labels[slug] = meta.title;
    }
    return labels;
}

function extractNavLinkClass(html: string): string {
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

function stripOldBlogLinks(html: string): string {
    return html.replace(/<a\s[^>]*href=["']\/api\/site\/[^"']*\/blog["'][^>]*>[\s\S]*?<\/a>\s*/gi, '');
}

function injectSubpageNavLinks(html: string, project: any): string {
    const reactFiles = (project.reactFiles || {}) as Record<string, string>;
    const labels = getSubpageLabels(project);
    const allSlugs = Object.keys(reactFiles).filter(k => labels[k]);
    if (allSlugs.length === 0) return html;

    const missingSlugs = allSlugs.filter(slug =>
        !html.includes(`href="/${slug}"`) && !html.includes(`href='/${slug}'`)
    );
    if (missingSlugs.length === 0) return html;

    const linkClass = extractNavLinkClass(html);
    const buildLink = (slug: string) => {
        const cls = linkClass ? ` class="${linkClass}"` : '';
        return `<a href="/${slug}"${cls}>${labels[slug]}</a>`;
    };

    const navLinksHtml = missingSlugs.map(buildLink).join('\n                    ');

    // Desktop nav
    if (html.includes('<!-- NAV_LINKS -->')) {
        html = html.replace(/<!-- NAV_LINKS -->/g, navLinksHtml);
    } else {
        const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
        if (navMatch) {
            const pocetnaLink = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (pocetnaLink) {
                const updated = navMatch[0].replace(pocetnaLink[0], pocetnaLink[0] + '\n                    ' + navLinksHtml);
                html = html.replace(navMatch[0], updated);
            }
        }
    }

    // Mobile menu
    if (html.includes('<!-- NAV_LINKS_MOBILE -->')) {
        const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
        let mobileCls = '';
        if (mobileMenuMatch) {
            const mp = mobileMenuMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mp) { const c = mp[0].match(/class="([^"]*)"/); if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim(); }
        }
        const mobileLinks = missingSlugs.map(s => `<a href="/${s}"${mobileCls ? ` class="${mobileCls}"` : ''}>${labels[s]}</a>`).join('\n            ');
        html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, mobileLinks);
    } else {
        const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
        if (mobileMenuMatch) {
            const mobileHtml = mobileMenuMatch[0];
            const mobilePocetna = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mobilePocetna && !mobileHtml.includes(`href="/${missingSlugs[0]}"`)) {
                let mobileCls = '';
                const c = mobilePocetna[0].match(/class="([^"]*)"/);
                if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim();
                const mobileLinks = missingSlugs.map(s => `<a href="/${s}"${mobileCls ? ` class="${mobileCls}"` : ''}>${labels[s]}</a>`).join('\n            ');
                const updatedMobile = mobileHtml.replace(mobilePocetna[0], mobilePocetna[0] + '\n            ' + mobileLinks);
                html = html.replace(mobileMenuMatch[0], updatedMobile);
            }
        }
    }

    // Footer
    if (html.includes('<!-- FOOTER_NAV_LINKS -->')) {
        const footerLinks = missingSlugs.map(s => `<a href="/${s}">${labels[s]}</a>`).join('\n');
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

    // Clean markers
    html = html.replace(/<!-- NAV_LINKS -->/g, '');
    html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, '');
    html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, '');

    return html;
}

function injectBlogNavLink(html: string): string {
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
                const updatedDesktop = desktopLinks[0].replace(lastLink, lastLink + '\n                    ' + blogLink);
                html = html.replace(desktopLinks[0], updatedDesktop);
            }
        } else {
            const linkPattern = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
            const links = navSection[0].match(linkPattern);
            if (links && links.length > 0) {
                const lastLink = links[links.length - 1];
                const updatedNav = navSection[0].replace(lastLink, lastLink + '\n                    ' + blogLink);
                html = html.replace(navSection[0], updatedNav);
            }
        }
    }

    // Mobile menu
    const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mobileMenuMatch && !mobileMenuMatch[0].includes('href="/blog"')) {
        const ctaButton = mobileMenuMatch[0].match(/<a\s[^>]*class="[^"]*bg-primary[^"]*"[^>]*>[\s\S]*?<\/a>/i);
        if (ctaButton) {
            const mobilePocetna = mobileMenuMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            let mobileCls = '';
            if (mobilePocetna) { const c = mobilePocetna[0].match(/class="([^"]*)"/); if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim(); }
            const mobileBlogLink = `<a href="/blog"${mobileCls ? ` class="${mobileCls}"` : ''}>Blog</a>`;
            const updatedMobile = mobileMenuMatch[0].replace(ctaButton[0], mobileBlogLink + '\n            ' + ctaButton[0]);
            html = html.replace(mobileMenuMatch[0], updatedMobile);
        }
    }

    // Footer
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
    if (footerMatch && !footerMatch[0].includes('href="/blog"')) {
        const footerNavItems = footerMatch[0].match(/<li>\s*<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[\s\S]*?<\/a>\s*<\/li>/gi);
        if (footerNavItems && footerNavItems.length > 0) {
            const lastItem = footerNavItems[footerNavItems.length - 1];
            const blogLi = `<li><a href="/blog" class="hover:text-white transition-colors">Blog</a></li>`;
            const updatedFooter = footerMatch[0].replace(lastItem, lastItem + '\n                        ' + blogLi);
            html = html.replace(footerMatch[0], updatedFooter);
        }
    }

    return html;
}
