import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { injectContactFormScript } from '@/lib/contact-form-script';

// ─── Helpers ────────────────────────────────────────────────────────

function extractSiteChrome(html) {
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

function detectDarkTheme(html) {
    const bgMatch = html.match(/(?:body|html)\s*\{[^}]*background(?:-color)?\s*:\s*([^;}\s]+)/i);
    if (bgMatch) {
        const bg = bgMatch[1].toLowerCase();
        if (bg.match(/^#[0-3]/i)) return true;
        if (['black', '#000', '#0a0a0a', '#111', '#18181b', '#1a1a1a', '#0d0d0d'].includes(bg)) return true;
    }
    if (html.match(/class="[^"]*dark/i) || html.match(/data-theme="dark"/i)) return true;
    return false;
}

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Domain lookup ──────────────────────────────────────────────────

async function getProjectByDomain(domain) {
    let project = await prisma.project.findFirst({
        where: { subdomain: domain, publishedAt: { not: null } },
        select: {
            id: true, name: true, contentData: true, generatedHtml: true, reactFiles: true, planName: true, cancelledAt: true,
            blogPosts: {
                where: { status: 'PUBLISHED' },
                orderBy: { publishedAt: 'desc' },
                include: { category: true }
            },
            blogCategories: {
                include: { _count: { select: { posts: { where: { status: 'PUBLISHED' } } } } }
            }
        }
    });

    if (!project) {
        project = await prisma.project.findFirst({
            where: { customDomain: domain, publishedAt: { not: null } },
            select: {
                id: true, name: true, contentData: true, generatedHtml: true, reactFiles: true, planName: true, cancelledAt: true,
                blogPosts: {
                    where: { status: 'PUBLISHED' },
                    orderBy: { publishedAt: 'desc' },
                    include: { category: true }
                },
                blogCategories: {
                    include: { _count: { select: { posts: { where: { status: 'PUBLISHED' } } } } }
                }
            }
        });
    }

    return project;
}

// ─── HTML Response helper ───────────────────────────────────────────

function htmlResponse(html, status = 200) {
    return new NextResponse(html, {
        status,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
    });
}

/**
 * Inject favicon and custom SEO meta into page HTML.
 * @param {string} html - The page HTML
 * @param {object} project - The project object with contentData
 * @param {string} pageKey - The page key (e.g. 'home', 'o-nama', 'usluge', 'kontakt')
 */
function injectSiteExtras(html, project, pageKey = 'home') {
    const seoSettings = (project.contentData || {}).seoSettings || {};
    const favicon = seoSettings.favicon;
    const pageSeo = seoSettings.pages?.[pageKey] || {};

    let injections = '';
    if (favicon) {
        injections += `<link rel="icon" href="${favicon}">\n`;
    }
    if (pageSeo.title) {
        // Replace existing <title> or inject new one
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${pageSeo.title}</title>`);
    }
    if (pageSeo.description) {
        if (html.includes('<meta name="description"')) {
            html = html.replace(/<meta\s+name="description"\s+content="[^"]*"/i, `<meta name="description" content="${pageSeo.description}"`);
        } else {
            injections += `<meta name="description" content="${pageSeo.description}">\n`;
        }
    }
    if (pageSeo.ogImage) {
        if (html.includes('property="og:image"')) {
            html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"/i, `<meta property="og:image" content="${pageSeo.ogImage}"`);
        } else {
            injections += `<meta property="og:image" content="${pageSeo.ogImage}">\n`;
        }
    }

    if (injections && html.includes('</head>')) {
        html = html.replace('</head>', injections + '</head>');
    }
    return html;
}

// ─── Dynamic subpage nav link injection ─────────────────────────────

const PREDEFINED_SUBPAGE_LABELS = {
    'o-nama': 'O nama',
    'usluge': 'Usluge',
    'kontakt': 'Kontakt',
};

/**
 * Build a slug→label map for ALL subpages (predefined + custom).
 */
function getSubpageLabels(project) {
    const labels = { ...PREDEFINED_SUBPAGE_LABELS };
    const customMeta = (project.contentData || {})._customSubpages || {};
    for (const [slug, meta] of Object.entries(customMeta)) {
        if (meta && meta.title) {
            labels[slug] = meta.title;
        }
    }
    return labels;
}

/**
 * Strip "active" modifiers from a Tailwind class string so that injected links
 * look like normal (inactive) navigation items rather than highlighted ones.
 */
function stripActiveClasses(cls) {
    return cls
        .replace(/\bborder-b[-\w]*/g, '')   // border-b-2, border-primary etc.
        .replace(/\bpb-\d+/g, '')            // pb-1 etc.
        .replace(/\btext-primary\b/g, '')
        .replace(/\btext-white\b/g, 'text-gray-300')
        .replace(/\bfont-medium\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Extract "Početna" nav link class (not logo) for consistent injection styling.
 */
function extractNavLinkClass(html) {
    const firstNav = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (!firstNav) return '';
    const pocetnaLink = firstNav[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
    if (!pocetnaLink) return '';
    const clsMatch = pocetnaLink[0].match(/class="([^"]*)"/);
    if (!clsMatch) return '';
    return clsMatch[1]
        .replace(/\bborder-b[-\w]*/g, '')
        .replace(/\bborder-primary\b/g, '')
        .replace(/\bpb-\d+/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Strip old blog links that use /api/site/.../blog format (baked into old generatedHtml).
 */
function stripOldBlogLinks(html) {
    return html.replace(/<a\s[^>]*href=["']\/api\/site\/[^"']*\/blog["'][^>]*>[\s\S]*?<\/a>\s*/gi, '');
}

/**
 * Inject navigation links for existing subpages into the HTML.
 * Handles: <!-- NAV_LINKS -->, <!-- NAV_LINKS_MOBILE -->, <!-- FOOTER_NAV_LINKS --> markers.
 * Fallback: injects into <nav>, #mobile-menu div, and footer <ul> navigation.
 */
function injectSubpageNavLinks(html, project) {
    const reactFiles = project.reactFiles || {};
    const subpageLabels = getSubpageLabels(project);
    const existingSlugs = Object.keys(reactFiles).filter(k => subpageLabels[k]);
    if (existingSlugs.length === 0) return html;

    const linkClass = extractNavLinkClass(html);
    const buildLink = (slug, label) => {
        const cls = linkClass ? ` class="${linkClass}"` : '';
        return `<a href="/${slug}"${cls}>${label}</a>`;
    };

    // Check which slugs are missing FROM THE NAV LINKS AREA (not CTA buttons)
    const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
    const desktopLinksDiv = navMatch?.[0]?.match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
    const navLinksArea = desktopLinksDiv?.[0] || '';

    const missingSlugs = existingSlugs.filter(slug =>
        !navLinksArea.includes(`href="/${slug}"`) && !navLinksArea.includes(`href='/${slug}'`)
    );

    const navLinksHtml = missingSlugs.map(slug => buildLink(slug, subpageLabels[slug])).join('\n                    ');

    // ── Desktop Nav — replace marker or inject after Početna ──
    if (html.includes('<!-- NAV_LINKS -->')) {
        html = html.replace(/<!-- NAV_LINKS -->/g, navLinksHtml);
    } else if (missingSlugs.length > 0 && navMatch) {
        const pocetnaLink = navMatch[0].match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
        if (pocetnaLink) {
            const updated = navMatch[0].replace(pocetnaLink[0], pocetnaLink[0] + '\n                    ' + navLinksHtml);
            html = html.replace(navMatch[0], updated);
        }
    }

    // ── Mobile Menu — replace marker or inject after Početna (before CTA) ──
    const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mobileMenuMatch && missingSlugs.length > 0) {
        const mobileHtml = mobileMenuMatch[0];
        const mobileMissing = missingSlugs.filter(slug =>
            !mobileHtml.match(new RegExp(`<a\\s[^>]*href=["']\\/${slug}["'][^>]*>\\s*${subpageLabels[slug]}\\s*<\\/a>`, 'i'))
        );
        if (mobileMissing.length > 0) {
            let mobileCls = '';
            const mobilePocetna = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mobilePocetna) {
                const c = mobilePocetna[0].match(/class="([^"]*)"/);
                if (c) mobileCls = c[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim();
            }
            const mobileLinks = mobileMissing.map(s => `<a href="/${s}"${mobileCls ? ` class="${mobileCls}"` : ''}>${subpageLabels[s]}</a>`).join('\n            ');
            if (html.includes('<!-- NAV_LINKS_MOBILE -->')) {
                html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, mobileLinks);
            } else if (mobilePocetna) {
                const updatedMobile = mobileHtml.replace(mobilePocetna[0], mobilePocetna[0] + '\n            ' + mobileLinks);
                html = html.replace(mobileMenuMatch[0], updatedMobile);
            }
        }
    }

    // ── Footer Nav ──
    if (missingSlugs.length > 0) {
        if (html.includes('<!-- FOOTER_NAV_LINKS -->')) {
            const footerLinks = missingSlugs.map(slug => `<li><a href="/${slug}" class="text-textMuted hover:text-white transition-colors">${subpageLabels[slug]}</a></li>`).join('\n                        ');
            html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, footerLinks);
        } else {
            const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
            if (footerMatch) {
                const footerHomeLi = footerMatch[0].match(/<li>\s*<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>\s*<\/li>/i);
                if (footerHomeLi && !footerMatch[0].includes(`href="/${missingSlugs[0]}"`)) {
                    const footerLiLinks = missingSlugs.map(slug =>
                        `<li><a href="/${slug}" class="hover:text-white transition-colors">${subpageLabels[slug]}</a></li>`
                    ).join('\n                        ');
                    const updatedFooter = footerMatch[0].replace(
                        footerHomeLi[0],
                        footerHomeLi[0] + '\n                        ' + footerLiLinks
                    );
                    html = html.replace(footerMatch[0], updatedFooter);
                }
            }
        }
    }

    // Clean up any remaining markers
    html = html.replace(/<!-- NAV_LINKS -->/g, '');
    html = html.replace(/<!-- NAV_LINKS_MOBILE -->/g, '');
    html = html.replace(/<!-- FOOTER_NAV_LINKS -->/g, '');

    return html;
}

// ─── Blog nav link injection ────────────────────────────────────────

function injectBlogNavLink(html) {
    // Strip old /api/site/.../blog links first
    html = stripOldBlogLinks(html);

    // Skip if /blog link already present
    if (html.includes('href="/blog"') || html.includes("href='/blog'")) return html;

    const linkClass = extractNavLinkClass(html);
    const blogLink = `<a href="/blog"${linkClass ? ` class="${linkClass}"` : ''}>Blog</a>`;

    // ── Desktop Nav ──
    const navSection = html.match(/<nav[\s\S]*?<\/nav>/i);
    if (navSection) {
        const navHtml = navSection[0];
        // Find last regular nav link (href="/something") in the nav's link container
        const desktopLinks = navHtml.match(/<div[^>]*class="[^"]*hidden\s+md:flex[^"]*"[^>]*>[\s\S]*?<\/div>/i);
        if (desktopLinks) {
            const linkPattern = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
            const links = desktopLinks[0].match(linkPattern);
            if (links && links.length > 0) {
                const lastLink = links[links.length - 1];
                const updatedDesktop = desktopLinks[0].replace(lastLink, lastLink + '\n                    ' + blogLink);
                html = html.replace(desktopLinks[0], updatedDesktop);
            }
        } else {
            // Fallback: inject after last nav link in <nav>
            const linkPattern = /<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi;
            const links = navHtml.match(linkPattern);
            if (links && links.length > 0) {
                const lastLink = links[links.length - 1];
                const updatedNav = navHtml.replace(lastLink, lastLink + '\n                    ' + blogLink);
                html = html.replace(navSection[0], updatedNav);
            }
        }
    }

    // ── Mobile Menu ──
    const mobileMenuMatch = html.match(/<div[^>]*id=["']mobile-menu["'][^>]*>[\s\S]*?<\/div>/i);
    if (mobileMenuMatch && !mobileMenuMatch[0].includes('href="/blog"')) {
        const mobileHtml = mobileMenuMatch[0];
        // Find CTA button (matches bg-primary, bg-brand-*, inline-flex rounded-full)
        const ctaButton = mobileHtml.match(/<a\s[^>]*class="[^"]*(?:bg-(?:primary|brand)[^"]*|inline-flex[^"]*rounded-full)"[^>]*>[\s\S]*?<\/a>/i);
        // Get mobile link class from a non-Početna nav link (to match existing styling)
        const mobileNavLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z][a-z-]*["'][^>]*>[^<]*<\/a>/gi);
        let mobileCls = '';
        if (mobileNavLinks && mobileNavLinks.length > 0) {
            const c = mobileNavLinks[0].match(/class="([^"]*)"/);
            if (c) mobileCls = c[1];
        }
        if (!mobileCls) {
            const mobilePocetna = mobileHtml.match(/<a\s[^>]*href=["']\/["'][^>]*>\s*Početna\s*<\/a>/i);
            if (mobilePocetna) {
                const cls = mobilePocetna[0].match(/class="([^"]*)"/);
                if (cls) mobileCls = cls[1].replace(/\bborder-b[-\w]*/g, '').replace(/\bborder-primary\b/g, '').replace(/\s{2,}/g, ' ').trim();
            }
        }
        const mobileBlogLink = `<a href="/blog"${mobileCls ? ` class="${mobileCls}"` : ''}>Blog</a>`;
        if (ctaButton) {
            const updatedMobile = mobileHtml.replace(ctaButton[0], mobileBlogLink + '\n            ' + ctaButton[0]);
            html = html.replace(mobileMenuMatch[0], updatedMobile);
        } else {
            const allLinks = mobileHtml.match(/<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[^<]*<\/a>/gi);
            if (allLinks && allLinks.length > 0) {
                const lastLink = allLinks[allLinks.length - 1];
                const updatedMobile = mobileHtml.replace(lastLink, lastLink + '\n            ' + mobileBlogLink);
                html = html.replace(mobileMenuMatch[0], updatedMobile);
            }
        }
    }

    // ── Footer ──
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
    if (footerMatch && !footerMatch[0].includes('href="/blog"')) {
        const footerHtml = footerMatch[0];
        // Look for last <li> in footer nav and inject blog after it
        const footerNavItems = footerHtml.match(/<li>\s*<a\s[^>]*href=["']\/[a-z-]*["'][^>]*>[\s\S]*?<\/a>\s*<\/li>/gi);
        if (footerNavItems && footerNavItems.length > 0) {
            const lastItem = footerNavItems[footerNavItems.length - 1];
            const blogLi = `<li><a href="/blog" class="hover:text-white transition-colors">Blog</a></li>`;
            const updatedFooter = footerHtml.replace(lastItem, lastItem + '\n                        ' + blogLi);
            html = html.replace(footerMatch[0], updatedFooter);
        }
    }

    return html;
}

/**
 * Process homepage: inject contact form, subpage nav links, blog link.
 * Returns "canonical" HTML with consistent nav/footer for all pages.
 */
function serveHomepage(project) {
    let html = project.generatedHtml || '';
    // Re-inject latest contact form script (fixes CORS from old absolute URLs)
    html = injectContactFormScript(html, project.id);
    // Inject nav links for existing subpages
    html = injectSubpageNavLinks(html, project);
    const hasBlog = project.blogPosts && project.blogPosts.length > 0;
    if (hasBlog && html) html = injectBlogNavLink(html);
    html = normalizeMobileNav(html);
    return html;
}

/**
 * Normalize mobile nav so ALL links (including Početna) share the same class.
 */
function normalizeMobileNav(html) {
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
    const updatedMobile = mobileHtml.replace(fullPocetna, updatedPocetna);
    return html.replace(mobileMenuMatch[0], updatedMobile);
}

/**
 * Replace the subpage's <header>/<nav> and <footer> with the homepage's canonical versions.
 * This ensures consistent navigation and footer across all pages.
 */
function replaceNavAndFooter(subpageHtml, homepageHtml) {
    // Extract and replace <header> (or <nav> if no header)
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

    // Extract and replace <footer>
    const homeFooter = homepageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    const subFooter = subpageHtml.match(/<footer[\s\S]*?<\/footer>/i);
    if (homeFooter && subFooter) {
        subpageHtml = subpageHtml.replace(subFooter[0], homeFooter[0]);
    }

    return subpageHtml;
}

/**
 * Extract the site's color palette from designTokens for blog styling.
 * Falls back to generic dark/light palette if tokens are not available.
 */
function extractSiteColors(project) {
    const contentData = project.contentData || {};
    const designTokens = contentData.designTokens;
    const primary = contentData.primaryColor || '#22c55e';

    if (designTokens && designTokens.colors) {
        const c = designTokens.colors;
        return {
            primary: c.primary || primary,
            bg: c.background || '#0a0a0a',
            surface: c.surface || c.cardBg || '#18181b',
            surfaceHover: c.surfaceHover || '#27272a',
            border: c.border || '#27272a',
            text: c.text || '#e4e4e7',
            textSecondary: c.textSecondary || '#a1a1aa',
            textMuted: c.textMuted || '#52525b',
            heading: c.heading || '#fff',
            cardBg: c.cardBg || c.surface || '#18181b',
            cardBorder: c.cardBorder || c.border || '#27272a',
        };
    }

    // Fallback: detect from HTML
    const isDark = project.generatedHtml ? detectDarkTheme(project.generatedHtml) : true;
    if (isDark) {
        return {
            primary,
            bg: '#0a0a0a', surface: '#18181b', surfaceHover: '#27272a', border: '#27272a',
            text: '#e4e4e7', textSecondary: '#a1a1aa', textMuted: '#52525b',
            heading: '#fff', cardBg: '#18181b', cardBorder: '#27272a',
        };
    }
    return {
        primary,
        bg: '#fff', surface: '#f4f4f5', surfaceHover: '#e4e4e7', border: '#e4e4e7',
        text: '#18181b', textSecondary: '#52525b', textMuted: '#a1a1aa',
        heading: '#09090b', cardBg: '#fff', cardBorder: '#e4e4e7',
    };
}


function renderBlogListing(project, searchParams) {
    const searchQuery = searchParams.get('q') || '';
    const categoryFilter = searchParams.get('category') || '';
    const tagFilter = searchParams.get('tag') || '';

    const content = project.contentData || {};
    const bizName = content.businessName || project.name;

    // Extract site colors for consistent blog styling
    const sc = extractSiteColors(project);
    const primary = sc.primary;

    const chrome = project.generatedHtml ? extractSiteChrome(injectBlogNavLink(injectSubpageNavLinks(project.generatedHtml, project))) : null;
    const isDark = project.generatedHtml ? detectDarkTheme(project.generatedHtml) : true;
    // Inject favicon into blog head
    const faviconUrl = (project.contentData || {}).seoSettings?.favicon;
    if (chrome && faviconUrl) {
        chrome.headContent = (chrome.headContent || '') + `\n<link rel="icon" href="${faviconUrl}">`;
    }

    let filteredPosts = project.blogPosts || [];
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
            p.content.toLowerCase().includes(q)
        );
    }
    if (categoryFilter) {
        filteredPosts = filteredPosts.filter(p => p.category?.slug === categoryFilter);
    }
    if (tagFilter) {
        filteredPosts = filteredPosts.filter(p =>
            p.tags && p.tags.split(',').map(t => t.trim()).includes(tagFilter)
        );
    }

    const categories = project.blogCategories || [];
    const allTags = [...new Set(
        (project.blogPosts || []).flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
    )].sort();

    const activeFilter = categoryFilter
        ? categories.find(c => c.slug === categoryFilter)?.name || categoryFilter
        : tagFilter ? `#${tagFilter}` : '';

    const postsHtml = filteredPosts.length > 0
        ? filteredPosts.map(p => {
            const postTags = p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            return `
            <a href="/blog/${p.slug}" class="post-card">
                ${p.coverImage ? `<div class="post-cover"><img src="${p.coverImage}" alt="${p.title}" loading="lazy" /></div>` : ''}
                <div class="post-info">
                    ${p.category ? `<span class="post-category">${p.category.name}</span>` : ''}
                    <h2>${p.title}</h2>
                    ${p.excerpt ? `<p class="excerpt">${p.excerpt}</p>` : ''}
                    <div class="post-meta-row">
                        <span class="date">${formatDate(p.publishedAt)}</span>
                        ${postTags.length > 0 ? `<div class="post-tags">${postTags.slice(0, 3).map(t => `<span class="post-tag">#${t}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
            </a>`;
        }).join('')
        : `<div class="empty"><p>${searchQuery || categoryFilter || tagFilter ? 'Nema rezultata za zadani filter.' : 'Još nema objavljenih članaka.'}</p>${searchQuery || categoryFilter || tagFilter ? '<a href="/blog" class="clear-filter">Prikaži sve članke</a>' : ''}</div>`;

    const categoriesHtml = categories.length > 0 ? `
        <div class="filter-chips">
            <a href="/blog" class="filter-chip ${!categoryFilter && !tagFilter && !searchQuery ? 'active' : ''}">Sve</a>
            ${categories.filter(c => c._count.posts > 0).map(c => `
                <a href="/blog?category=${c.slug}" class="filter-chip ${categoryFilter === c.slug ? 'active' : ''}">${c.name} <span class="chip-count">${c._count.posts}</span></a>
            `).join('')}
        </div>` : '';

    const tagsHtml = allTags.length > 0 ? `
        <div class="tag-cloud">
            ${allTags.map(t => `<a href="/blog?tag=${encodeURIComponent(t)}" class="tag-link ${tagFilter === t ? 'active' : ''}">#${t}</a>`).join('')}
        </div>` : '';

    let headerHtml = chrome?.header || `<header style="border-bottom:1px solid var(--blog-border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto"><a href="/" style="font-weight:800;font-size:1.25rem;color:${primary};text-decoration:none">${bizName}</a><a href="/" style="color:var(--blog-text-muted);text-decoration:none;font-size:0.875rem">← Početna</a></header>`;
    headerHtml = headerHtml.replace(/href="#/g, 'href="/#');

    return `<!DOCTYPE html>
<html lang="hr" data-theme="${isDark ? 'dark' : 'light'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | ${bizName}</title>
    <meta name="description" content="Blog - ${bizName}. Najnoviji članci i vijesti.">
    <link rel="canonical" href="/blog">
    ${chrome?.headContent || '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">'}
    <style>
        :root{--blog-bg:${sc.bg};--blog-surface:${sc.surface};--blog-surface-hover:${sc.surfaceHover};--blog-border:${sc.border};--blog-text:${sc.text};--blog-text-secondary:${sc.textSecondary};--blog-text-muted:${sc.textMuted};--blog-heading:${sc.heading};--blog-card-bg:${sc.cardBg};--blog-card-border:${sc.cardBorder};--blog-footer-border:${sc.border}}
        body{background:var(--blog-bg)!important;color:var(--blog-text)!important;font-family:Inter,-apple-system,sans-serif;margin:0}
        .blog-hero{text-align:center;padding:7rem 2rem 1.5rem;max-width:800px;margin:0 auto}
        .blog-hero h1{font-size:2.5rem;font-weight:800;color:var(--blog-heading);margin-bottom:.75rem}
        nav{position:relative !important}
        .blog-hero p{color:var(--blog-text-muted);font-size:1.125rem}
        .search-bar{max-width:600px;margin:1.5rem auto 0;position:relative}
        .search-bar input{width:100%;padding:.85rem 1.25rem .85rem 3rem;background:var(--blog-surface);border:1px solid var(--blog-border);border-radius:.75rem;color:var(--blog-heading);font-size:.95rem;outline:none;box-sizing:border-box}
        .search-bar input:focus{border-color:${primary}}
        .search-bar input::placeholder{color:var(--blog-text-muted)}
        .search-icon{position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:var(--blog-text-muted);pointer-events:none}
        .filter-section{max-width:900px;margin:1.5rem auto 0;padding:0 2rem}
        .filter-chips{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center}
        .filter-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.5rem 1rem;background:var(--blog-surface);border:1px solid var(--blog-border);border-radius:2rem;color:var(--blog-text-secondary);font-size:.85rem;font-weight:500;text-decoration:none;transition:all .2s}
        .filter-chip:hover{background:var(--blog-surface-hover);border-color:${primary}44;color:var(--blog-heading)}
        .filter-chip.active{background:${primary}18;border-color:${primary}44;color:${primary};font-weight:600}
        .chip-count{font-size:.7rem;background:var(--blog-border);padding:.1rem .4rem;border-radius:1rem;color:var(--blog-text-muted)}
        .filter-chip.active .chip-count{background:${primary}25;color:${primary}}
        .tag-cloud{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;margin-top:.75rem}
        .tag-link{padding:.3rem .7rem;font-size:.8rem;color:var(--blog-text-muted);text-decoration:none;border-radius:.4rem;transition:all .2s}
        .tag-link:hover{color:${primary};background:${primary}10}
        .tag-link.active{color:${primary};font-weight:600;background:${primary}15}
        .active-filter-banner{max-width:900px;margin:1rem auto 0;padding:0 2rem;text-align:center}
        .active-filter-label{display:inline-flex;align-items:center;gap:.5rem;background:${primary}15;color:${primary};padding:.5rem 1rem;border-radius:.5rem;font-size:.85rem;font-weight:500}
        .active-filter-label a{color:var(--blog-text-muted);text-decoration:none;font-size:1.1rem}
        .posts{max-width:900px;margin:0 auto;padding:2rem;display:grid;gap:1.5rem}
        .post-card{display:grid;grid-template-columns:1fr;background:var(--blog-card-bg);border:1px solid var(--blog-card-border);border-radius:1rem;overflow:hidden;text-decoration:none;color:inherit;transition:border-color .3s,transform .2s}
        .post-card:hover{border-color:${primary}66;transform:translateY(-2px)}
        .post-cover{width:100%;height:220px;overflow:hidden}
        .post-cover img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
        .post-card:hover .post-cover img{transform:scale(1.03)}
        .post-info{padding:1.5rem}
        .post-category{display:inline-block;font-size:.75rem;font-weight:600;color:${primary};text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem}
        .post-info h2{font-size:1.25rem;font-weight:700;color:var(--blog-heading);margin-bottom:.5rem;line-height:1.4}
        .excerpt{color:var(--blog-text-secondary);font-size:.9rem;line-height:1.6;margin-bottom:.75rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .post-meta-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem}
        .date{color:var(--blog-text-muted);font-size:.8rem}
        .post-tags{display:flex;gap:.35rem}
        .post-tag{font-size:.75rem;color:var(--blog-text-muted);background:var(--blog-surface);padding:.15rem .5rem;border-radius:.3rem}
        .empty{text-align:center;padding:4rem 2rem;color:var(--blog-text-muted)}
        .clear-filter{display:inline-block;margin-top:1rem;color:${primary};text-decoration:none;font-weight:500;font-size:.9rem}
        .theme-toggle{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:48px;height:48px;border-radius:50%;border:1px solid var(--blog-border);background:var(--blog-surface);color:var(--blog-heading);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.25rem;box-shadow:0 4px 12px rgba(0,0,0,.15)}
        .theme-toggle:hover{transform:scale(1.1);background:var(--blog-surface-hover)}
        @media(min-width:640px){.post-card{grid-template-columns:280px 1fr}.post-cover{height:100%;min-height:180px}}
        @media(max-width:640px){.blog-hero h1{font-size:1.75rem}.blog-hero{padding:5.5rem 1.5rem 1rem}.posts{padding:1rem}.filter-section{padding:0 1rem}}
    </style>
</head>
<body>
    ${headerHtml}
    <div class="blog-hero">
        <h1>Blog</h1>
        <p>Najnoviji članci i vijesti</p>
        <div class="search-bar">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="blogSearch" placeholder="Pretraži članke..." value="${searchQuery.replace(/"/g, '&quot;')}" />
        </div>
    </div>
    <div class="filter-section">${categoriesHtml}${tagsHtml}</div>
    ${activeFilter ? `<div class="active-filter-banner"><span class="active-filter-label">Filtrirano: <strong>${activeFilter}</strong> <a href="/blog" title="Očisti filter">✕</a></span></div>` : ''}
    <div class="posts">${postsHtml}</div>
    ${chrome?.footer || `<footer style="text-align:center;padding:3rem 2rem;color:var(--blog-text-muted);font-size:.8rem;border-top:1px solid var(--blog-footer-border);margin-top:2rem">&copy; ${new Date().getFullYear()} ${bizName}. Sva prava pridržana.</footer>`}
    <button class="theme-toggle" id="themeToggle" title="Promijeni temu"><span class="icon" id="themeIcon"></span></button>
    <script>
        (function(){var i=document.getElementById('blogSearch'),d;i.addEventListener('input',function(){clearTimeout(d);d=setTimeout(function(){var q=i.value.trim(),u=new URL(window.location.href);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');u.searchParams.delete('category');u.searchParams.delete('tag');window.location.href=u.toString()},500)});i.addEventListener('keydown',function(e){if(e.key==='Enter'){clearTimeout(d);var q=i.value.trim(),u=new URL(window.location.href);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');u.searchParams.delete('category');u.searchParams.delete('tag');window.location.href=u.toString()}})})();
        (function(){var K='blog-theme',h=document.documentElement,ic=document.getElementById('themeIcon'),sun='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',moon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';function s(t){h.setAttribute('data-theme',t);ic.innerHTML=t==='dark'?sun:moon;try{localStorage.setItem(K,t)}catch(e){}}var sv=(function(){try{return localStorage.getItem(K)}catch(e){return null}})();s(sv||'${isDark ? 'dark' : 'light'}');document.getElementById('themeToggle').addEventListener('click',function(){s(h.getAttribute('data-theme')==='dark'?'light':'dark')})})();
    </script>
</body>
</html>`;
}

// ─── Blog post ──────────────────────────────────────────────────────

async function renderBlogPost(project, slug) {
    const post = await prisma.blogPost.findFirst({
        where: { projectId: project.id, slug, status: 'PUBLISHED' },
        include: { category: true }
    });

    if (!post) return null;

    const content = project.contentData || {};
    const bizName = content.businessName || project.name;
    // Extract site colors for consistent blog styling
    const sc = extractSiteColors(project);
    const primary = sc.primary;
    const chrome = project.generatedHtml ? extractSiteChrome(injectBlogNavLink(injectSubpageNavLinks(project.generatedHtml, project))) : null;
    const isDark = project.generatedHtml ? detectDarkTheme(project.generatedHtml) : true;
    // Inject favicon into blog post head
    const faviconUrl2 = (project.contentData || {}).seoSettings?.favicon;
    if (chrome && faviconUrl2) {
        chrome.headContent = (chrome.headContent || '') + `\n<link rel="icon" href="${faviconUrl2}">`;
    }
    const postTags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    let headerHtml = chrome?.header || `<header style="border-bottom:1px solid var(--blog-border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto"><a href="/" style="font-weight:800;font-size:1.25rem;color:${primary};text-decoration:none">${bizName}</a><a href="/blog" style="color:var(--blog-text-muted);text-decoration:none;font-size:0.875rem">← Blog</a></header>`;
    headerHtml = headerHtml.replace(/href="#/g, 'href="/#');

    const relatedPosts = (project.blogPosts || []).filter(p => p.slug !== slug).slice(0, 3);
    const relatedHtml = relatedPosts.length > 0 ? `
        <section style="max-width:700px;margin:3rem auto;padding:0 2rem">
            <h3 style="font-size:1.25rem;font-weight:700;color:var(--blog-heading);margin-bottom:1rem">Povezani članci</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">
                ${relatedPosts.map(rp => `<a href="/blog/${rp.slug}" style="background:var(--blog-card-bg);border:1px solid var(--blog-card-border);border-radius:.75rem;overflow:hidden;text-decoration:none;color:var(--blog-heading);font-weight:600;font-size:.9rem;transition:border-color .3s">${rp.coverImage ? `<img src="${rp.coverImage}" alt="${rp.title}" style="width:100%;height:120px;object-fit:cover"/>` : ''}<span style="display:block;padding:.75rem">${rp.title}</span></a>`).join('')}
            </div>
        </section>` : '';

    return `<!DOCTYPE html>
<html lang="hr" data-theme="${isDark ? 'dark' : 'light'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.metaTitle || post.title} | ${bizName}</title>
    <meta name="description" content="${(post.metaDescription || post.excerpt || '').replace(/"/g, '&quot;')}">
    <link rel="canonical" href="/blog/${post.slug}">
    ${chrome?.headContent || '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">'}
    <style>
        :root{--blog-bg:${sc.bg};--blog-surface:${sc.surface};--blog-border:${sc.border};--blog-text:${sc.text};--blog-text-secondary:${sc.textSecondary};--blog-text-muted:${sc.textMuted};--blog-heading:${sc.heading};--blog-card-bg:${sc.cardBg};--blog-card-border:${sc.cardBorder}}
        body{background:var(--blog-bg)!important;color:var(--blog-text)!important;font-family:Inter,-apple-system,sans-serif;margin:0;line-height:1.8}
        .post-hero{max-width:800px;margin:0 auto;padding:7rem 2rem 1rem}
        .post-hero .category{font-size:.75rem;font-weight:600;color:${primary};text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem;display:inline-block}
        .post-hero h1{font-size:2.5rem;font-weight:800;color:var(--blog-heading);margin-bottom:1rem;line-height:1.3}
        .post-hero .meta{color:var(--blog-text-muted);font-size:.85rem;margin-bottom:1.5rem}
        .post-cover-full{max-width:900px;margin:0 auto;border-radius:1rem;overflow:hidden}
        .post-cover-full img{width:100%;height:auto;display:block}
        .post-content{max-width:700px;margin:2rem auto;padding:0 2rem;font-size:1.05rem}
        .post-content h2{font-size:1.5rem;font-weight:700;color:var(--blog-heading);margin:2rem 0 1rem}
        .post-content h3{font-size:1.25rem;font-weight:600;color:var(--blog-heading);margin:1.5rem 0 .75rem}
        .post-content p{margin-bottom:1.25rem;color:var(--blog-text)}
        .post-content img{max-width:100%;border-radius:.75rem;margin:1.5rem 0}
        .post-content a{color:${primary};text-decoration:underline}
        .post-content blockquote{border-left:3px solid ${primary};padding:.75rem 1.5rem;margin:1.5rem 0;background:var(--blog-surface);border-radius:0 .5rem .5rem 0;color:var(--blog-text-secondary);font-style:italic}
        .post-content ul,.post-content ol{margin-bottom:1.25rem;padding-left:1.5rem}
        .post-content li{margin-bottom:.35rem}
        .post-content pre{background:var(--blog-surface);border:1px solid var(--blog-border);border-radius:.75rem;padding:1rem 1.25rem;overflow-x:auto;font-size:.9rem;margin:1.5rem 0}
        .post-content code{background:var(--blog-surface);padding:.15rem .4rem;border-radius:.3rem;font-size:.9em}
        .post-content pre code{background:none;padding:0}
        .post-tags-section{max-width:700px;margin:1rem auto;padding:0 2rem;display:flex;gap:.4rem;flex-wrap:wrap}
        .post-tag-link{padding:.3rem .7rem;font-size:.8rem;color:var(--blog-text-muted);background:var(--blog-surface);border-radius:.4rem;text-decoration:none}
        .post-tag-link:hover{color:${primary}}
        .back-link{display:inline-flex;align-items:center;gap:.3rem;color:var(--blog-text-muted);text-decoration:none;font-size:.85rem;margin-bottom:1rem}
        .back-link:hover{color:${primary}}
        .theme-toggle{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:48px;height:48px;border-radius:50%;border:1px solid var(--blog-border);background:var(--blog-surface);color:var(--blog-heading);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.25rem;box-shadow:0 4px 12px rgba(0,0,0,.15)}
        .theme-toggle:hover{transform:scale(1.1)}
        @media(max-width:640px){.post-hero h1{font-size:1.75rem}.post-hero{padding:2rem 1.5rem .5rem}}
    </style>
</head>
<body>
    ${headerHtml}
    <article>
        <div class="post-hero">
            <a href="/blog" class="back-link">← Povratak na blog</a>
            ${post.category ? `<span class="category">${post.category.name}</span>` : ''}
            <h1>${post.title}</h1>
            <div class="meta">${formatDate(post.publishedAt)}</div>
        </div>
        ${post.coverImage ? `<div class="post-cover-full"><img src="${post.coverImage}" alt="${post.title}" /></div>` : ''}
        <div class="post-content">${post.content}</div>
        ${postTags.length > 0 ? `<div class="post-tags-section">${postTags.map(t => `<a href="/blog?tag=${encodeURIComponent(t)}" class="post-tag-link">#${t}</a>`).join('')}</div>` : ''}
    </article>
    ${relatedHtml}
    ${chrome?.footer || `<footer style="text-align:center;padding:3rem 2rem;color:var(--blog-text-muted);font-size:.8rem;border-top:1px solid var(--blog-border);margin-top:3rem">&copy; ${new Date().getFullYear()} ${bizName}. Sva prava pridržana.</footer>`}
    <button class="theme-toggle" id="themeToggle" title="Promijeni temu"><span class="icon" id="themeIcon"></span></button>
    <script>
        (function(){var K='blog-theme',h=document.documentElement,ic=document.getElementById('themeIcon'),sun='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',moon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';function s(t){h.setAttribute('data-theme',t);ic.innerHTML=t==='dark'?sun:moon;try{localStorage.setItem(K,t)}catch(e){}}var sv=(function(){try{return localStorage.getItem(K)}catch(e){return null}})();s(sv||'${isDark ? 'dark' : 'light'}');document.getElementById('themeToggle').addEventListener('click',function(){s(h.getAttribute('data-theme')==='dark'?'light':'dark')})})();
    </script>
</body>
</html>`;
}

// ─── Route Handler ──────────────────────────────────────────────────

export async function GET(req, { params }) {
    const { domain, path: pathSegments } = await params;

    const project = await getProjectByDomain(domain);
    if (!project || !project.generatedHtml) {
        return new NextResponse(
            `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff"><div style="text-align:center"><h1 style="font-size:4rem;margin:0">404</h1><p style="color:#a1a1aa">Stranica nije pronađena</p></div></body></html>`,
            { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }

    // Block cancelled projects
    if (project.cancelledAt) {
        return new NextResponse(
            `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff"><div style="text-align:center"><h1 style="font-size:2rem;margin:0 0 0.5rem">Web stranica nije dostupna</h1><p style="color:#a1a1aa;max-width:400px">Pretplata za ovu web stranicu je istekla. Kontaktirajte vlasnika stranice za više informacija.</p></div></body></html>`,
            { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }

    const segments = pathSegments || [];

    if (segments.length === 0) {
        // Homepage
        return htmlResponse(injectSiteExtras(serveHomepage(project), project, 'home'));
    }

    // Subpages (Advanced multi-page HTML)
    if (segments.length === 1 && segments[0] !== 'blog') {
        const htmlPages = project.reactFiles || {};
        const pageSlug = segments[0];
        if (htmlPages[pageSlug]) {
            let pageHtml = htmlPages[pageSlug];
            // Re-inject latest contact form script
            pageHtml = injectContactFormScript(pageHtml, project.id);
            // Use homepage's canonical nav/footer for consistent navigation
            const canonicalHome = serveHomepage(project);
            pageHtml = replaceNavAndFooter(pageHtml, canonicalHome);
            return htmlResponse(injectSiteExtras(pageHtml, project, pageSlug));
        }
    }

    if (segments[0] === 'blog') {
        if (segments.length === 1) {
            // Blog listing
            return htmlResponse(renderBlogListing(project, req.nextUrl.searchParams));
        }
        if (segments.length === 2) {
            // Blog post
            const postHtml = await renderBlogPost(project, segments[1]);
            if (!postHtml) {
                return new NextResponse('Članak nije pronađen', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
            }
            return htmlResponse(postHtml);
        }
    }

    // Unknown path - return 404 (don't serve homepage for missing subpages)
    return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff"><div style="text-align:center"><h1 style="font-size:4rem;margin:0">404</h1><p style="color:#a1a1aa">Stranica nije pronađena</p><a href="/" style="color:#22c55e;text-decoration:none;margin-top:1rem;display:inline-block">← Povratak na početnu</a></div></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}
