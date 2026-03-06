/**
 * Client-side visibility fix — no server needed.
 * Removes opacity:0, visibility:hidden, display:none from inline styles,
 * and injects a fallback script.
 */

export function fixVisibilityClient(html) {
    let result = html;

    // 1. Remove inline opacity: 0
    result = result.replace(
        /(<(?:section|div|header|footer|main|nav|article|aside|ul|ol|figure|h[1-6]|p|span|a|img|button)[^>]*\sstyle="[^"]*?)opacity\s*:\s*0\s*;?\s*([^"]*")/gi,
        '$1$2'
    );

    // 2. Remove inline visibility: hidden
    result = result.replace(
        /(<(?:section|div|header|footer|main|nav|article|aside|ul|ol|figure|h[1-6]|p|span|a|img|button)[^>]*\sstyle="[^"]*?)visibility\s*:\s*hidden\s*;?\s*([^"]*")/gi,
        '$1$2'
    );

    // 3. Remove inline display: none from section-level elements
    result = result.replace(
        /(<(?:section|header|footer|main|article)[^>]*\sstyle="[^"]*?)display\s*:\s*none\s*;?\s*([^"]*")/gi,
        '$1$2'
    );

    // 4. Remove inline transform that hides
    result = result.replace(
        /(<(?:section|div|header|footer|main|nav|article|aside|figure|h[1-6]|p|span)[^>]*\sstyle="[^"]*?)transform\s*:\s*(?:translateY\([^)]*\)|translate\([^)]*\)|scale\(0[^)]*\))\s*;?\s*([^"]*")/gi,
        '$1$2'
    );

    // 5. Clean up empty style attributes
    result = result.replace(/\sstyle="\s*"/gi, '');

    // 6. Remove "hidden" class from SECTION-LEVEL elements only (not divs/navs — those are mobile menus)
    result = result.replace(
        /(<(?:section|main|article|footer)[^>]*\sclass="[^"]*)\bhidden\b\s*([^"]*")/gi,
        (full, before, after) => {
            if (before.slice(-1) === '-') return full;
            return before + after;
        }
    );

    // 7. Remove "invisible" Tailwind class from section-level elements only
    result = result.replace(
        /(<(?:section|main|article|footer)[^>]*\sclass="[^"]*)\binvisible\b\s*([^"]*")/gi,
        '$1$2'
    );

    // 8. Remove will-change for GSAP stuck states
    result = result.replace(
        /will-change\s*:\s*(?:transform|opacity|transform,\s*opacity|opacity,\s*transform)\s*;?\s*/gi,
        ''
    );

    // 8.5. Remove duplicate navigation links (within individual <nav> and mobile menu divs)
    // Do NOT process <header> as a whole — desktop and mobile nav are supposed to mirror each other
    result = result.replace(
        /(<nav(?:\s[^>]*)?>)([\s\S]*?)(<\/nav>)/gi,
        (fullMatch, openTag, innerContent, closeTag) => {
            const seenTexts = new Set();
            const cleaned = innerContent.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, (linkMatch, linkContent) => {
                const visibleText = linkContent.replace(/<[^>]*>/g, '').trim().toLowerCase();
                if (!visibleText || visibleText.length < 2) return linkMatch;
                if (linkMatch.includes('btn') || linkMatch.includes('button') || linkMatch.includes('cta') || linkMatch.includes('rounded-full')) return linkMatch;
                if (seenTexts.has(visibleText)) return '';
                seenTexts.add(visibleText);
                return linkMatch;
            });
            return openTag + cleaned.replace(/<li[^>]*>\s*<\/li>/gi, '') + closeTag;
        }
    );
    // Also process <div> elements that look like mobile menus
    result = result.replace(
        /(<div[^>]*(?:class|id)="[^"]*(?:menu|mobile|nav-|navigation|sidebar)[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/gi,
        (fullMatch, openTag, innerContent, closeTag) => {
            const seenTexts = new Set();
            const cleaned = innerContent.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, (linkMatch, linkContent) => {
                const visibleText = linkContent.replace(/<[^>]*>/g, '').trim().toLowerCase();
                if (!visibleText || visibleText.length < 2) return linkMatch;
                if (linkMatch.includes('btn') || linkMatch.includes('button') || linkMatch.includes('cta') || linkMatch.includes('rounded-full')) return linkMatch;
                if (seenTexts.has(visibleText)) return '';
                seenTexts.add(visibleText);
                return linkMatch;
            });
            return openTag + cleaned.replace(/<li[^>]*>\s*<\/li>/gi, '') + closeTag;
        }
    );
    // 3. Global pass: find ALL <a> tags, detect duplicates by text in proximity
    const linkRegex2 = /<a\s[^>]*>[\s\S]*?<\/a>/gi;
    const allLinks = [];
    let lm;
    while ((lm = linkRegex2.exec(result)) !== null) {
        const text = lm[0].replace(/<[^>]*>/g, '').trim().toLowerCase();
        allLinks.push({ match: lm[0], text, index: lm.index });
    }
    const toRemove = [];
    const seenInProx = new Map();
    for (const link of allLinks) {
        if (link.text.length < 2) continue;
        if (link.match.includes('btn') || link.match.includes('button') || link.match.includes('cta') || link.match.includes('rounded-full')) continue;
        const lastIdx = seenInProx.get(link.text);
        if (lastIdx !== undefined && (link.index - lastIdx) < 500) {
            toRemove.push(link.match);
        } else {
            seenInProx.set(link.text, link.index);
        }
    }
    for (const dup of toRemove) { result = result.replace(dup, ''); }
    result = result.replace(/<li[^>]*>\s*<\/li>/gi, '');

    if (!result.includes('data-webica-visibility-fix')) {
        const fallback = `
<script data-webica-visibility-fix>
(function() {
  function fixHidden() {
    document.querySelectorAll('section, header, footer, main, nav, article, [class*="container"], [class*="wrapper"], [class*="hero"]').forEach(function(el) {
      var s = getComputedStyle(el);
      if (s.opacity === '0' || parseFloat(s.opacity) < 0.1) { el.style.opacity = '1'; el.style.transition = 'opacity 0.4s ease'; }
      if (s.visibility === 'hidden') { el.style.visibility = 'visible'; }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(fixHidden, 3000); });
  } else { setTimeout(fixHidden, 3000); }
})();
</script>`;
        if (result.includes('</body>')) {
            result = result.replace('</body>', fallback + '\n</body>');
        }
    }

    return result;
}
