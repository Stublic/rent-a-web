/**
 * sanitize-html.ts
 * Post-processing utility that fixes common AI generation issues:
 * - Fixes double-quoted/escaped URLs (src="\"https://...\"")
 * - Removes rogue "hidden" classes from visible elements
 * - Detects and removes duplicate page content
 * - Fixes horizontal overflow issues
 * - Ensures valid HTML structure (single DOCTYPE, html, body)
 * - Ensures hero/first section has padding-top for fixed navbars
 * - Removes stuck opacity:0 / visibility:hidden on sections
 * - Strips leftover GSAP CDN scripts
 * - Removes duplicate navigation links
 * - Injects reveal animation CSS/JS safety net
 */

export function sanitizeHtml(html: string): string {
    let result = html;

    // 0. Fix double-quoted/escaped URLs — AI often outputs src="\"https://...\""
    // which browsers interpret as relative paths with %22
    result = result.replace(
        /((?:src|href|action|poster|data-src)\s*=\s*)"\\?"([^"]*?)\\?"(\s*)/gi,
        '$1"$2"$3'
    );
    // Also catch the pattern: ="\"url\""
    result = result.replace(
        /((?:src|href|action|poster|data-src)\s*=\s*)"\\"([^"\\]+)\\""/gi,
        '$1"$2"'
    );
    // And: src=""https://... ""
    result = result.replace(
        /((?:src|href|action|poster|data-src)\s*=\s*)""(https?:\/\/[^"]+)""/gi,
        '$1"$2"'
    );
    // Fix src='\"url\"' style
    result = result.replace(
        /((?:src|href|action|poster|data-src)\s*=\s*)'?\\"(https?:\/\/[^\\]+)\\"'?/gi,
        '$1"$2"'
    );

    // 1. Ensure single DOCTYPE
    const doctypeCount = (result.match(/<!DOCTYPE\s+html>/gi) || []).length;
    if (doctypeCount > 1) {
        let found = false;
        result = result.replace(/<!DOCTYPE\s+html>/gi, (match) => {
            if (!found) { found = true; return match; }
            return '';
        });
    }

    // 2. Remove duplicate <body> blocks — keep content of first only
    const bodyOpenCount = (result.match(/<body[^>]*>/gi) || []).length;
    if (bodyOpenCount > 1) {
        const firstBodyStart = result.search(/<body[^>]*>/i);
        const firstBodyOpenEnd = result.indexOf('>', firstBodyStart) + 1;
        const lastBodyClose = result.lastIndexOf('</body>');

        if (firstBodyStart !== -1 && lastBodyClose !== -1) {
            const bodyContent = result.substring(firstBodyOpenEnd, lastBodyClose);
            const beforeBody = result.substring(0, firstBodyOpenEnd);
            const afterBody = result.substring(lastBodyClose);
            const cleanedContent = bodyContent
                .replace(/<body[^>]*>/gi, '')
                .replace(/<\/body>/gi, '');
            result = beforeBody + cleanedContent + afterBody;
        }
    }

    // 3. Remove duplicate <html> tags (keep first)
    const htmlOpenCount = (result.match(/<html[^>]*>/gi) || []).length;
    if (htmlOpenCount > 1) {
        let found = false;
        result = result.replace(/<html[^>]*>/gi, (match) => {
            if (!found) { found = true; return match; }
            return '';
        });
        const htmlCloseCount = (result.match(/<\/html>/gi) || []).length;
        if (htmlCloseCount > 1) {
            let closeFound = 0;
            result = result.replace(/<\/html>/gi, (match) => {
                closeFound++;
                return closeFound === htmlCloseCount ? match : '';
            });
        }
    }

    // 4. Remove duplicate <head> blocks (keep first)
    const headMatches = result.match(/<head[^>]*>[\s\S]*?<\/head>/gi);
    if (headMatches && headMatches.length > 1) {
        let found = false;
        result = result.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, (match) => {
            if (!found) { found = true; return match; }
            return '';
        });
    }

    // 5. Remove rogue "hidden" classes from SECTION-LEVEL elements only
    //    Do NOT remove hidden from div, nav, ul, aside — those are often mobile menus/dropdowns
    result = result.replace(
        /(<(?:section|main|article|footer)[^>]*\sclass="[^"]*)\bhidden\b([^"]*")/gi,
        (fullMatch, before, after) => {
            const precedingChars = before.slice(-1);
            if (precedingChars === '-') return fullMatch;
            return before + after;
        }
    );
    // Single-class hidden on section-level: class="hidden"
    result = result.replace(
        /(<(?:section|main|article|footer)[^>]*)\sclass="hidden"([^>]*>)/gi,
        '$1$2'
    );

    // 6. Fix horizontal overflow — inject overflow-x: hidden if not present
    if (!result.includes('overflow-x') || !result.includes('overflow-x: hidden')) {
        const overflowFix = `
    <style data-sanitize="overflow-fix">
      html, body { overflow-x: hidden; max-width: 100vw; }
      *, *::before, *::after { box-sizing: border-box; }
    </style>`;
        if (result.includes('</head>')) {
            result = result.replace('</head>', overflowFix + '\n</head>');
        } else if (result.includes('<body')) {
            result = result.replace(/<body/, overflowFix + '\n<body');
        }
    }

    // 7. Ensure first section after fixed/sticky nav has a padding-top
    // Check if there's a fixed/sticky nav without body padding
    if (/(position\s*:\s*fixed|position\s*:\s*sticky|class="[^"]*fixed[^"]*")/i.test(result)) {
        // If body doesn't already have padding-top
        if (!result.includes('data-sanitize="nav-fix"')) {
            const navFix = `
    <style data-sanitize="nav-fix">
      body > section:first-of-type,
      body > main:first-of-type,
      body > div:first-of-type > section:first-child {
        scroll-margin-top: 80px;
      }
    </style>`;
            if (result.includes('</head>')) {
                result = result.replace('</head>', navFix + '\n</head>');
            }
        }
    }

    // 8. Remove any inline widths greater than 100vw on major containers
    result = result.replace(
        /width\s*:\s*(\d+)(vw|px)/gi,
        (match, value, unit) => {
            const numVal = parseInt(value, 10);
            if (unit.toLowerCase() === 'vw' && numVal > 100) return 'width: 100vw';
            if (unit.toLowerCase() === 'px' && numVal > 2000) return 'width: 100%';
            return match;
        }
    );

    // 9. Detect fully duplicated page sections
    result = removeDuplicateSections(result);

    // 9.5. Remove duplicate navigation links (e.g. two "Kontakt" links)
    result = removeDuplicateNavLinks(result);

    // 10. Remove opacity:0 from section-level inline styles (common GSAP initial state stuck)
    result = result.replace(
        /(<(?:section|header|footer|main|article|div)[^>]*\sstyle="[^"]*?)opacity\s*:\s*0\s*;?\s*([^"]*")/gi,
        (match, before, after) => {
            // Only fix if this looks like a major container (has class or id)
            if (match.includes('class=') || match.includes('id=') || /<(?:section|header|footer|main|article)/i.test(match)) {
                return before + after;
            }
            return match;
        }
    );

    // 11. Remove visibility:hidden from section-level inline styles
    result = result.replace(
        /(<(?:section|header|footer|main|article)[^>]*\sstyle="[^"]*?)visibility\s*:\s*hidden\s*;?\s*([^"]*")/gi,
        '$1$2'
    );

    // 12. Strip leftover GSAP CDN scripts (legacy pages or AI adding them despite prompt)
    result = result.replace(
        /<script[^>]*src="[^"]*cdnjs\.cloudflare\.com\/ajax\/libs\/gsap[^"]*"[^>]*><\/script>\s*/gi,
        ''
    );

    // 13. Inject reveal animation CSS + IntersectionObserver if not already present
    if (!result.includes('data-webica-reveal') && !result.includes('.reveal.visible')) {
        const revealCSS = `
    <style data-webica-reveal>
      .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
      .reveal.visible { opacity: 1; transform: none; }
      .reveal-delay-1 { transition-delay: 0.1s; } .reveal-delay-2 { transition-delay: 0.2s; }
      .reveal-delay-3 { transition-delay: 0.3s; } .reveal-delay-4 { transition-delay: 0.4s; }
    </style>`;
        if (result.includes('</head>')) {
            result = result.replace('</head>', revealCSS + '\n</head>');
        }
    }

    // 14. Inject reveal observer script if not already present
    if (!result.includes('data-webica-reveal-observer') && !result.includes('data-webica-visibility-fix')) {
        const revealScript = `
<script data-webica-reveal-observer>
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
  // Safety net: after 4s force all .reveal elements visible (in case observer missed)
  setTimeout(function() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) { el.classList.add('visible'); });
  }, 4000);
  // Also fix any non-reveal elements with stuck opacity
  setTimeout(function() {
    document.querySelectorAll('section, header, footer, main').forEach(function(el) {
      var s = getComputedStyle(el);
      if (s.opacity === '0' || parseFloat(s.opacity) < 0.1) { el.style.opacity = '1'; el.style.transition = 'opacity 0.4s ease'; }
      if (s.visibility === 'hidden') el.style.visibility = 'visible';
    });
  }, 3000);
})();
</script>`;
        if (result.includes('</body>')) {
            result = result.replace('</body>', revealScript + '\n</body>');
        }
    }

    // 13. Clean stray whitespace / newlines
    result = result.replace(/\n{4,}/g, '\n\n');

    return result.trim();
}

/**
 * Detects and removes duplicate major sections (e.g. two identical hero sections)
 */
function removeDuplicateSections(html: string): string {
    const sectionPattern = /<(section|main|header|footer)([^>]*)>([\s\S]*?)<\/\1>/gi;
    const sections: { tag: string; full: string; content: string; index: number }[] = [];

    let match;
    while ((match = sectionPattern.exec(html)) !== null) {
        sections.push({
            tag: match[1],
            full: match[0],
            content: match[3].trim(),
            index: match.index,
        });
    }

    const toRemove: number[] = [];
    for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
            if (sections[i].tag === sections[j].tag && sections[i].content.length > 200) {
                const a = sections[i].content.replace(/\s+/g, '');
                const b = sections[j].content.replace(/\s+/g, '');
                const similarity = stringSimilarity(a, b);
                if (similarity > 0.9) {
                    toRemove.push(j);
                }
            }
        }
    }

    let result = html;
    const uniqueRemovals = [...new Set(toRemove)].sort((a, b) => b - a);
    for (const idx of uniqueRemovals) {
        result = result.replace(sections[idx].full, '');
    }

    return result;
}

/**
 * Removes duplicate <a> links within each individual <nav> element,
 * within <div> elements that look like mobile menus,
 * and catches any consecutive duplicate <a> tags globally.
 */
function removeDuplicateNavLinks(html: string): string {
    let result = html;

    // 1. Process individual <nav>...</nav> blocks
    result = result.replace(
        /(<nav(?:\s[^>]*)?>)([\s\S]*?)(<\/nav>)/gi,
        (fullMatch, openTag: string, innerContent: string, closeTag: string) => {
            return openTag + deduplicateLinksInBlock(innerContent) + closeTag;
        }
    );

    // 2. Process <div> elements that look like mobile menus
    //    (class or id containing "menu", "mobile", "nav-", "navigation", "sidebar")
    result = result.replace(
        /(<div[^>]*(?:class|id)="[^"]*(?:menu|mobile|nav-|navigation|sidebar)[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/gi,
        (fullMatch, openTag: string, innerContent: string, closeTag: string) => {
            return openTag + deduplicateLinksInBlock(innerContent) + closeTag;
        }
    );

    // 3. Global pass: find ALL <a> tags, detect duplicates by text, remove from HTML
    //    Works on any container regardless of class/id
    const linkRegex = /<a\s[^>]*>[\s\S]*?<\/a>/gi;
    const allLinks: { match: string; text: string; index: number }[] = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(result)) !== null) {
        const text = linkMatch[0].replace(/<[^>]*>/g, '').trim().toLowerCase();
        allLinks.push({ match: linkMatch[0], text, index: linkMatch.index });
    }

    // Find duplicates: same text, close proximity (within 500 chars = same nav block)
    const toRemove: string[] = [];
    const seenInProximity = new Map<string, number>(); // text -> last index
    for (const link of allLinks) {
        if (link.text.length < 2) continue;
        // Skip CTA buttons
        if (link.match.includes('btn') || link.match.includes('button') ||
            link.match.includes('cta') || link.match.includes('rounded-full')) continue;

        const lastIndex = seenInProximity.get(link.text);
        if (lastIndex !== undefined && (link.index - lastIndex) < 500) {
            // This is a duplicate within close proximity — mark for removal
            toRemove.push(link.match);
        } else {
            seenInProximity.set(link.text, link.index);
        }
    }

    // Remove marked duplicates (replace first occurrence of each)
    for (const dup of toRemove) {
        result = result.replace(dup, '');
    }
    // Clean up empty <li> tags
    result = result.replace(/<li[^>]*>\s*<\/li>/gi, '');

    return result;
}

/**
 * Deduplicates <a> links within a block of HTML.
 * Removes subsequent <a> tags with the same visible text, keeping the first.
 */
function deduplicateLinksInBlock(html: string): string {
    const seenTexts = new Set<string>();

    const cleaned = html.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, (linkMatch, linkContent: string) => {
        // Extract visible text (strip HTML tags)
        const visibleText = linkContent.replace(/<[^>]*>/g, '').trim().toLowerCase();

        // Skip empty links, icon-only links, or very short content
        if (!visibleText || visibleText.length < 2) return linkMatch;

        // Skip CTA buttons (they often have the same text intentionally)
        if (linkMatch.includes('btn') || linkMatch.includes('button') ||
            linkMatch.includes('cta') || linkMatch.includes('rounded-full')) {
            return linkMatch;
        }

        if (seenTexts.has(visibleText)) {
            return ''; // Duplicate — remove
        }

        seenTexts.add(visibleText);
        return linkMatch;
    });

    // Clean up empty <li> tags left behind
    return cleaned.replace(/<li[^>]*>\s*<\/li>/gi, '');
}

/**
 * Quick similarity check between two strings (0-1 scale)
 */
function stringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length > 1000) {
        const chunkSize = 200;
        let matches = 0;
        const steps = Math.min(5, Math.floor(shorter.length / chunkSize));
        for (let i = 0; i < steps; i++) {
            const chunk = shorter.substring(i * chunkSize, (i + 1) * chunkSize);
            if (longer.includes(chunk)) matches++;
        }
        return matches / steps;
    }

    const lengthRatio = shorter.length / longer.length;
    if (lengthRatio < 0.8) return lengthRatio;

    return a.substring(0, 500) === b.substring(0, 500) ? 0.95 : lengthRatio * 0.5;
}
