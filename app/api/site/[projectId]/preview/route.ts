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

    // 1. Process the HOMEPAGE first to get canonical nav/footer
    let homeHtml = project.generatedHtml;
    homeHtml = stripOldBlogLinks(homeHtml);
    homeHtml = injectSubpageNavLinks(homeHtml, project);
    const hasBlog = project.blogPosts && project.blogPosts.length > 0;
    if (hasBlog) homeHtml = injectBlogNavLink(homeHtml);
    homeHtml = normalizeMobileNav(homeHtml);

    if (pageSlug === 'home') {
        return new NextResponse(homeHtml, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    // 2. For subpages, use the subpage HTML but replace nav/footer with homepage's
    let html = (project.reactFiles as Record<string, string>)?.[pageSlug] || project.generatedHtml;
    html = replaceNavAndFooter(html, homeHtml);

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

/**
 * Replace the subpage's <header>/<nav> and <footer> with the homepage's canonical versions.
 * This ensures consistent navigation and footer across all pages.
 */
function replaceNavAndFooter(subpageHtml: string, homepageHtml: string): string {
    // Extract and replace <header> (or <nav> if no header)
    const homeHeader = homepageHtml.match(/<header[\s\S]*?<\/header>/i);
    const subHeader = subpageHtml.match(/<header[\s\S]*?<\/header>/i);
    if (homeHeader && subHeader) {
        subpageHtml = subpageHtml.replace(subHeader[0], homeHeader[0]);
    } else {
        // Try <nav> if no <header>
        const homeNav = homepageHtml.match(/<nav[\s\S]*?<\/nav>/i);
        const subNav = subpageHtml.match(/<nav[\s\S]*?<\/nav>/i);
        if (homeNav && subNav) {
            subpageHtml = subpageHtml.replace(subNav[0], homeNav[0]);
        }
    }

    // Extract and replace <footer>
    const homeFooter = homepageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    const subFooter = subpageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    if (homeFooter && subFooter) {
        subpageHtml = subpageHtml.replace(subFooter[0], homeFooter[0]);
    }

    return subpageHtml;
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
    const pocetnaLink = firstNav[0].match(/<a\s[^>]*href=["']\/["'][^>]*>[^<]*<\/a>/i);
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

    const linkClass = extractNavLinkClass(html);
    const buildLink = (slug: string) => {
        const cls = linkClass ? ` class="${linkClass}"` : '';
        return `<a href="/${slug}"${cls}>${labels[slug]}</a>`;
    };

    // Check which slugs are missing FROM THE NAV LINKS AREA (not CTA buttons)
    // Extract the desktop nav links container to check only there
    const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
    const desktopLinksDiv = navMatch?.[0]?.match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
    const navLinksArea = desktopLinksDiv?.[0] || '';

    const missingSlugs = allSlugs.filter(slug => {
        // Check if slug exists as a regular nav link (not a CTA button)
        return !navLinksArea.includes(`href="/${slug}"`) && !navLinksArea.includes(`href='/${slug}'`);
    });

    // Always replace marker placeholders even if missingSlugs is empty (markers should be cleaned)
    const navLinksHtml = missingSlugs.map(buildLink).join('\n                    ');

    // Desktop nav — replace only the FIRST <!-- NAV_LINKS -->
    if (html.includes('<!-- NAV_LINKS -->')) {
        html = html.replace('<!-- NAV_LINKS -->', navLinksHtml);
    } else if (missingSlugs.length > 0) {
        if (navMatch) {
            const pocetnaLink = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (pocetnaLink) {
                const updated = navMatch[0].replace(pocetnaLink[0], pocetnaLink[0] + '\n                    ' + navLinksHtml);
                html = html.replace(navMatch[0], updated);
            }
        }
    }

    // Mobile menu — replace remaining <!-- NAV_LINKS --> and <!-- NAV_LINKS_MOBILE --> with mobile-styled links
    if (html.includes('<!-- NAV_LINKS -->') || html.includes('<!-- NAV_LINKS_MOBILE -->')) {
        const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
        let mobileCls = '';
        if (mobileMenuMatch) {
            const mobilePocetna = mobileMenuMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mobilePocetna) {
                const c = mobilePocetna[0].match(/class="([^"]*)"/);
                if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim();
            }
        }
        const mobileLinks = missingSlugs.map(s => `<a href="/${s}"${mobileCls ? ` class="${mobileCls}"` : ''}>${labels[s]}</a>`).join('\n            ');
        html = html.replace(/<!-- NAV_LINKS -->/g, mobileLinks);
        html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, mobileLinks);
    }

    // Footer
    if (missingSlugs.length > 0) {
        if (html.includes('<!-- FOOTER_NAV_LINKS -->')) {
            const footerLinks = missingSlugs.map(s => `<li><a href="/${s}" class="text-textMuted hover:text-white transition-colors">${labels[s]}</a></li>`).join('\n                        ');
            html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, footerLinks);
        } else {
            const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
            if (footerMatch) {
                const footerHomeLi = footerMatch[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*>[^<]*<\/a>\s*<\/li>/i);
                if (footerHomeLi && !footerMatch[0].includes(`href="/${missingSlugs[0]}"`)) {
                    let footerLinkCls = 'hover:text-white transition-colors';
                    const fcMatch = footerHomeLi[0].match(/<a\s[^>]*class="([^"]*)"/);
                    if (fcMatch) footerLinkCls = fcMatch[1];
                    const footerLiLinks = missingSlugs.map(s => `<li><a href="/${s}" class="${footerLinkCls}">${labels[s]}</a></li>`).join('\n                        ');
                    const updatedFooter = footerMatch[0].replace(footerHomeLi[0], footerHomeLi[0] + '\n                        ' + footerLiLinks);
                    html = html.replace(footerMatch[0], updatedFooter);
                }
            }
        }
    }

    // Clean remaining markers
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
        const ctaInNav = navSection[0].match(/<a\s[^>]*class="[^"]*(?:bg-brand|bg-primary|rounded-full|rounded-lg[^"]*bg-)[^"]*"[^>]*>[\s\S]*?<\/a>/i);
        if (ctaInNav) {
            html = html.replace(navSection[0], navSection[0].replace(ctaInNav[0], blogLink + '\n                    ' + ctaInNav[0]));
        } else {
            const desktopLinks = navSection[0].match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
            const target = desktopLinks || navSection;
            const linkPattern = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
            const links = target[0].match(linkPattern);
            if (links && links.length > 0) {
                const lastLink = links[links.length - 1];
                html = html.replace(target[0], target[0].replace(lastLink, lastLink + '\n                    ' + blogLink));
            }
        }
    }

    // Mobile menu — insert before CTA div
    const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mobileMenuMatch && !mobileMenuMatch[0].includes('href="/blog"')) {
        const mobileHtml = mobileMenuMatch[0];
        const allMobileLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [];
        const regularNavLinks = allMobileLinks.filter(l => !l.match(/class="[^"]*(?:bg-brand|bg-primary|rounded-lg|w-full)[^"]*"/i));
        let mobileCls = '';
        if (regularNavLinks.length > 0) {
            const c = regularNavLinks[0].match(/class="([^"]*)"/);
            if (c) mobileCls = c[1];
        }
        if (!mobileCls) {
            const mobilePocetna = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mobilePocetna) { const c = mobilePocetna[0].match(/class="([^"]*)"/); if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim(); }
        }
        const mobileBlogLink = `<a href="/blog"${mobileCls ? ` class="${mobileCls}"` : ''}>Blog</a>`;
        if (regularNavLinks.length > 0) {
            const lastLink = regularNavLinks[regularNavLinks.length - 1];
            html = html.replace(mobileMenuMatch[0], mobileHtml.replace(lastLink, lastLink + '\n                ' + mobileBlogLink));
        }
    }

    // Footer
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
    if (footerMatch && !footerMatch[0].includes('href="/blog"')) {
        const footerNavItems = footerMatch[0].match(/<li>\s*<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[\s\S]*?<\/a>\s*<\/li>/gi);
        if (footerNavItems && footerNavItems.length > 0) {
            const lastItem = footerNavItems[footerNavItems.length - 1];
            let footerLinkCls = 'hover:text-white transition-colors';
            const fpc = footerMatch[0].match(/<li>\s*<a\s[^>]*class="([^"]*)"[^>]*href=["']\/["']/i) || footerMatch[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*class="([^"]*)"/i);
            if (fpc) footerLinkCls = fpc[1];
            const blogLi = `<li><a href="/blog" class="${footerLinkCls}">Blog</a></li>`;
            const updatedFooter = footerMatch[0].replace(lastItem, lastItem + '\n                        ' + blogLi);
            html = html.replace(footerMatch[0], updatedFooter);
        }
    }

    return html;
}

/**
 * Normalize mobile nav so ALL links (including Početna) share the same class.
 * The AI often generates Početna with text-base/p-2 while other links use text-sm.
 */
function normalizeMobileNav(html: string): string {
    const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (!mobileMenuMatch) return html;

    const mobileHtml = mobileMenuMatch[0];
    // Find non-CTA, non-Početna nav links to determine the "standard" class
    const otherLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi);
    if (!otherLinks || otherLinks.length === 0) return html;

    const standardCls = otherLinks[0].match(/class="([^"]*)"/);
    if (!standardCls) return html;

    // Find Početna link
    const pocetnaMatch = mobileHtml.match(/<a\s([^>]*)href=["']\/["']([^>]*)>\s*Početna\s*<\/a>/i);
    if (!pocetnaMatch) return html;

    const fullPocetna = pocetnaMatch[0];
    const pocetnaCls = fullPocetna.match(/class="([^"]*)"/);
    if (!pocetnaCls || pocetnaCls[1] === standardCls[1]) return html; // Already matching

    const updatedPocetna = fullPocetna.replace(`class="${pocetnaCls[1]}"`, `class="${standardCls[1]}"`);
    const updatedMobile = mobileHtml.replace(fullPocetna, updatedPocetna);
    return html.replace(mobileMenuMatch[0], updatedMobile);
}
