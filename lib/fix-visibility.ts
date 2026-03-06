/**
 * fix-visibility.ts
 * 
 * Deterministic (no AI) fix for invisible elements.
 * Removes opacity:0, visibility:hidden, display:none from inline styles,
 * removes GSAP-set initial states, and injects a fallback script.
 * 
 * Used by:
 *  - "Popravi vidljivost" button in EditorChat (no tokens consumed)
 *  - Auto-detection when user describes invisible elements
 */

/**
 * Fix all visibility issues in HTML without AI.
 * Returns the fixed HTML string.
 */
export function fixVisibility(html: string): string {
  let result = html;

  // 1. Remove inline opacity: 0 from section-level elements
  //    Matches style="...opacity: 0..." or style="...opacity:0..."
  //    Preserves other inline styles
  result = result.replace(
    /(<(?:section|div|header|footer|main|nav|article|aside|ul|ol|figure|h[1-6]|p|span|a|img|button)[^>]*\sstyle="[^"]*?)opacity\s*:\s*0\s*;?\s*([^"]*")/gi,
    '$1$2'
  );

  // 2. Remove inline visibility: hidden
  result = result.replace(
    /(<(?:section|div|header|footer|main|nav|article|aside|ul|ol|figure|h[1-6]|p|span|a|img|button)[^>]*\sstyle="[^"]*?)visibility\s*:\s*hidden\s*;?\s*([^"]*")/gi,
    '$1$2'
  );

  // 3. Remove inline display: none from major containers (not modals/dropdowns)
  //    Only removes from section-level elements, not from small utility elements
  result = result.replace(
    /(<(?:section|header|footer|main|article)[^>]*\sstyle="[^"]*?)display\s*:\s*none\s*;?\s*([^"]*")/gi,
    '$1$2'
  );

  // 4. Remove inline transform that hides elements (translateY(50px), translate(0, 50px), scale(0))
  result = result.replace(
    /(<(?:section|div|header|footer|main|nav|article|aside|figure|h[1-6]|p|span)[^>]*\sstyle="[^"]*?)transform\s*:\s*(?:translateY\([^)]*\)|translate\([^)]*\)|scale\(0[^)]*\))\s*;?\s*([^"]*")/gi,
    '$1$2'
  );

  // 5. Clean up empty style attributes left behind
  result = result.replace(/\sstyle="\s*"/gi, '');

  // 6. Remove "hidden" class from SECTION-LEVEL elements only
  //    Do NOT remove from div, nav, aside — those are mobile menus/dropdowns
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

  // 8. Fix GSAP inline styles set by gsap.set() — common pattern: 
  //    style="opacity: 0; transform: translateY(40px); will-change: transform, opacity;"
  result = result.replace(
    /will-change\s*:\s*(?:transform|opacity|transform,\s*opacity|opacity,\s*transform)\s*;?\s*/gi,
    ''
  );

  // 9. Remove <style> blocks that contain .gsap-hidden or initial-state selectors
  result = result.replace(
    /<style[^>]*>[^<]*\.gsap-hidden[^<]*<\/style>/gi,
    ''
  );

  // 9.5. Remove duplicate navigation links (within individual <nav> and mobile menu divs)
  result = result.replace(
    /(<nav(?:\s[^>]*)?>)([\s\S]*?)(<\/nav>)/gi,
    (fullMatch, openTag: string, innerContent: string, closeTag: string) => {
      const seenTexts = new Set<string>();
      const cleaned = innerContent.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, (linkMatch, linkContent: string) => {
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
    (fullMatch, openTag: string, innerContent: string, closeTag: string) => {
      const seenTexts = new Set<string>();
      const cleaned = innerContent.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, (linkMatch, linkContent: string) => {
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
  const linkRegex = /<a\s[^>]*>[\s\S]*?<\/a>/gi;
  const allLinks: { match: string; text: string; index: number }[] = [];
  let lm;
  while ((lm = linkRegex.exec(result)) !== null) {
    const text = lm[0].replace(/<[^>]*>/g, '').trim().toLowerCase();
    allLinks.push({ match: lm[0], text, index: lm.index });
  }
  const toRemove: string[] = [];
  const seenInProx = new Map<string, number>();
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
    const fallbackScript = getVisibilityFallbackScript();
    if (result.includes('</body>')) {
      result = result.replace('</body>', fallbackScript + '\n</body>');
    } else {
      result += '\n' + fallbackScript;
    }
  }

  return result;
}

/**
 * Returns a <script> tag that acts as a safety net:
 * After DOM load + 2 seconds, checks all major elements and forces
 * any hidden ones to become visible.
 */
export function getVisibilityFallbackScript(): string {
  return `
<script data-webica-visibility-fix>
// Webica Visibility Safety Net — ensures no elements stay invisible
(function() {
  function fixHidden() {
    var selectors = 'section, header, footer, main, nav, article, [class*="container"], [class*="wrapper"], [class*="hero"], [class*="about"], [class*="service"], [class*="contact"], [class*="testimonial"], [class*="faq"], [class*="pricing"], [class*="team"], [class*="gallery"], [class*="footer"], [class*="cta"]';
    document.querySelectorAll(selectors).forEach(function(el) {
      var s = getComputedStyle(el);
      if (s.opacity === '0' || parseFloat(s.opacity) < 0.1) {
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.4s ease';
      }
      if (s.visibility === 'hidden') {
        el.style.visibility = 'visible';
      }
      if (s.display === 'none' && !el.closest('[role="dialog"]') && !el.closest('.modal')) {
        el.style.display = '';
      }
      // Fix stuck transforms (common GSAP initial state)
      var transform = s.transform;
      if (transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
        // Check if element is off-screen due to transform
        var rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight + 100 || rect.bottom < -100 || rect.left > window.innerWidth + 100) {
          el.style.transform = 'none';
          el.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        }
      }
    });
  }
  // Run after GSAP has had a chance to initialize (3s)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(fixHidden, 3000); });
  } else {
    setTimeout(fixHidden, 3000);
  }
})();
</script>`;
}
