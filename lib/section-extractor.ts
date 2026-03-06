/**
 * Extracts a targeted section from full HTML based on user's edit request.
 * Returns { section, sectionHtml, startMarker, endMarker } or null if no section match.
 * 
 * When a targeted section is found, only that section is sent to the AI,
 * dramatically reducing token usage and generation time.
 */

// Section patterns: keyword → CSS selector / tag-based extraction
const SECTION_KEYWORDS: Array<{
    keywords: string[];
    section: string;
    extract: (html: string) => { sectionHtml: string; before: string; after: string } | null;
}> = [
        {
            keywords: ['footer', 'podnožje', 'podnožju', 'footeru'],
            section: 'footer',
            extract: (html) => extractByTag(html, 'footer'),
        },
        {
            keywords: ['header', 'navigacij', 'nav', 'navbar', 'izbornik', 'menu', 'menij', 'logo'],
            section: 'header/nav',
            extract: (html) => extractByTag(html, 'header') || extractByTag(html, 'nav'),
        },
        {
            keywords: ['hero', 'naslov', 'naslovn', 'prvi ekran', 'banner', 'početn', 'landing'],
            section: 'hero',
            extract: (html) => extractFirstSection(html),
        },
        {
            keywords: ['kontakt', 'contact', 'form', 'obrazac', 'email sekcij'],
            section: 'contact',
            extract: (html) => extractByIdOrClass(html, ['contact', 'kontakt', 'contact-form']),
        },
        {
            keywords: ['uslug', 'servic', 'services', 'proizvod'],
            section: 'services',
            extract: (html) => extractByIdOrClass(html, ['services', 'usluge', 'products', 'proizvodi']),
        },
        {
            keywords: ['galerij', 'gallery', 'portfolio', 'referenc'],
            section: 'gallery',
            extract: (html) => extractByIdOrClass(html, ['gallery', 'galerija', 'portfolio', 'reference']),
        },
        {
            keywords: ['cjenik', 'pricing', 'cijena', 'paket'],
            section: 'pricing',
            extract: (html) => extractByIdOrClass(html, ['pricing', 'cjenik', 'paketi', 'cijene']),
        },
        {
            keywords: ['faq', 'pitanja', 'čest'],
            section: 'faq',
            extract: (html) => extractByIdOrClass(html, ['faq', 'pitanja']),
        },
        {
            keywords: ['testimonial', 'recenzij', 'iskustv', 'review'],
            section: 'testimonials',
            extract: (html) => extractByIdOrClass(html, ['testimonials', 'recenzije', 'reviews', 'iskustva']),
        },
        {
            keywords: ['about', 'o nama', 'tko smo', 'about-us'],
            section: 'about',
            extract: (html) => extractByIdOrClass(html, ['about', 'o-nama', 'about-us']),
        },
    ];

/**
 * Try to detect which section the user wants to edit.
 */
export function detectTargetSection(editRequest: string, html: string): {
    section: string;
    sectionHtml: string;
    before: string;
    after: string;
} | null {
    const lower = editRequest.toLowerCase();

    for (const { keywords, section, extract } of SECTION_KEYWORDS) {
        if (keywords.some(kw => lower.includes(kw))) {
            const result = extract(html);
            if (result && result.sectionHtml.length > 50 && result.sectionHtml.length < html.length * 0.8) {
                // Only use partial if section is reasonable size (not almost the full page)
                console.log(`🎯 Detected section: "${section}" (${result.sectionHtml.length} chars vs ${html.length} total)`);
                return { section, ...result };
            }
        }
    }

    return null;
}

/**
 * Reconstruct full HTML by replacing the section.
 */
export function replaceSectionInHtml(before: string, newSectionHtml: string, after: string): string {
    return before + newSectionHtml + after;
}

// ─── Extraction helpers ─────────────────────────────────────────────

function extractByTag(html: string, tag: string): { sectionHtml: string; before: string; after: string } | null {
    // Find the LAST occurrence for footer, FIRST for others
    const openTag = `<${tag}`;
    const closeTag = `</${tag}>`;

    let startIdx: number;
    if (tag === 'footer') {
        startIdx = html.lastIndexOf(openTag);
    } else {
        startIdx = html.indexOf(openTag);
    }

    if (startIdx === -1) return null;

    const closeIdx = html.indexOf(closeTag, startIdx);
    if (closeIdx === -1) return null;

    const endIdx = closeIdx + closeTag.length;

    return {
        sectionHtml: html.substring(startIdx, endIdx),
        before: html.substring(0, startIdx),
        after: html.substring(endIdx),
    };
}

function extractFirstSection(html: string): { sectionHtml: string; before: string; after: string } | null {
    // Hero is typically the first <section> after </header> or </nav>
    const headerEnd = html.indexOf('</header>');
    const navEnd = html.indexOf('</nav>');
    const searchFrom = Math.max(headerEnd, navEnd);
    if (searchFrom === -1) return null;

    const sectionStart = html.indexOf('<section', searchFrom);
    if (sectionStart === -1) return null;

    const sectionClose = html.indexOf('</section>', sectionStart);
    if (sectionClose === -1) return null;

    const endIdx = sectionClose + '</section>'.length;

    return {
        sectionHtml: html.substring(sectionStart, endIdx),
        before: html.substring(0, sectionStart),
        after: html.substring(endIdx),
    };
}

function extractByIdOrClass(html: string, identifiers: string[]): { sectionHtml: string; before: string; after: string } | null {
    for (const id of identifiers) {
        // Try finding a section/div with this id or class
        const patterns = [
            `id="${id}"`,
            `id='${id}'`,
            `class="${id}`,
            `class='${id}`,
        ];

        for (const pattern of patterns) {
            const idx = html.toLowerCase().indexOf(pattern);
            if (idx === -1) continue;

            // Walk back to find the opening tag
            let tagStart = idx;
            while (tagStart > 0 && html[tagStart] !== '<') tagStart--;

            // Determine the tag name
            const tagMatch = html.substring(tagStart).match(/^<(\w+)/);
            if (!tagMatch) continue;
            const tagName = tagMatch[1];

            // Find the corresponding closing tag (handle nesting)
            const closeTag = `</${tagName}>`;
            let depth = 1;
            let searchPos = html.indexOf('>', tagStart) + 1;

            while (depth > 0 && searchPos < html.length) {
                const nextOpen = html.indexOf(`<${tagName}`, searchPos);
                const nextClose = html.indexOf(closeTag, searchPos);

                if (nextClose === -1) break;

                if (nextOpen !== -1 && nextOpen < nextClose) {
                    depth++;
                    searchPos = html.indexOf('>', nextOpen) + 1;
                } else {
                    depth--;
                    if (depth === 0) {
                        const endIdx = nextClose + closeTag.length;
                        return {
                            sectionHtml: html.substring(tagStart, endIdx),
                            before: html.substring(0, tagStart),
                            after: html.substring(endIdx),
                        };
                    }
                    searchPos = nextClose + closeTag.length;
                }
            }
        }
    }

    return null;
}
