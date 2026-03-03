/**
 * sanitize-html.ts
 * Post-processing utility that fixes common AI generation issues:
 * - Fixes double-quoted/escaped URLs (src="\"https://...\"")
 * - Removes rogue "hidden" classes from visible elements
 * - Detects and removes duplicate page content
 * - Fixes horizontal overflow issues
 * - Ensures valid HTML structure (single DOCTYPE, html, body)
 * - Ensures hero/first section has padding-top for fixed navbars
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

    // 5. Remove rogue "hidden" classes from elements that contain visible content
    result = result.replace(
        /(<(?:section|div|header|footer|main|nav|article|aside|ul|ol|form|figure)[^>]*\sclass="[^"]*)\bhidden\b([^"]*")/gi,
        (fullMatch, before, after) => {
            // Don't remove hidden if it's part of overflow-hidden, sr-hidden, etc.
            const precedingChars = before.slice(-1);
            if (precedingChars === '-') return fullMatch;
            return before + after;
        }
    );
    // Single-class hidden: class="hidden"
    result = result.replace(
        /(<(?:section|div|header|footer|main|nav|article|aside)[^>]*)\sclass="hidden"([^>]*>)/gi,
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

    // 10. Clean stray whitespace / newlines
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
