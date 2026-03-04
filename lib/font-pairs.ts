/**
 * Font pair definitions — shared between the UI and generators.
 * Each pair maps to Google Fonts families.
 */

export const FONT_PAIR_MAP: Record<string, { heading: string; body: string }> = {
    'inter-inter': { heading: 'Inter', body: 'Inter' },
    'poppins-inter': { heading: 'Poppins', body: 'Inter' },
    'playfair-lato': { heading: 'Playfair Display', body: 'Lato' },
    'montserrat-opensans': { heading: 'Montserrat', body: 'Open Sans' },
    'raleway-roboto': { heading: 'Raleway', body: 'Roboto' },
    'dmserif-dmsans': { heading: 'DM Serif Display', body: 'DM Sans' },
    'outfit-outfit': { heading: 'Outfit', body: 'Outfit' },
    'spacegrotesk-inter': { heading: 'Space Grotesk', body: 'Inter' },
    'cormorant-mulish': { heading: 'Cormorant Garamond', body: 'Mulish' },
    'bebas-roboto': { heading: 'Bebas Neue', body: 'Roboto' },
    'sora-inter': { heading: 'Sora', body: 'Inter' },
};

/**
 * Resolve a fontPair ID to heading/body font names.
 * Returns null if fontPair is empty or 'auto' (let AI decide).
 */
export function resolveFontPair(fontPairId: string | undefined | null): { heading: string; body: string } | null {
    if (!fontPairId || fontPairId === 'auto') return null;
    return FONT_PAIR_MAP[fontPairId] || null;
}

/**
 * Build the font instruction string for the AI prompt.
 */
export function buildFontInstruction(fontPairId: string | undefined | null): string {
    const pair = resolveFontPair(fontPairId);
    if (!pair) {
        return 'Choose fonts that fit the industry and design perfectly. Use Google Fonts.';
    }

    const googleFonts: string[] = [];
    googleFonts.push(pair.heading.replace(/ /g, '+') + ':wght@400;600;700;800');
    if (pair.body !== pair.heading) {
        googleFonts.push(pair.body.replace(/ /g, '+') + ':wght@300;400;500;600');
    }

    const linkTag = `<link href="https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f}`).join('&')}&display=swap" rel="stylesheet">`;

    return `TYPOGRAPHY — MANDATORY:
- Include this Google Fonts link in <head>: ${linkTag}
- Headings (h1-h6): font-family: '${pair.heading}', sans-serif;
- Body text (p, li, span, etc.): font-family: '${pair.body}', sans-serif;
- Set these fonts in the Tailwind config: tailwind.config = { theme: { extend: { fontFamily: { heading: ['${pair.heading}', 'sans-serif'], body: ['${pair.body}', 'sans-serif'] } } } }
- Apply class="font-heading" on all heading elements and class="font-body" on the <body> tag.`;
}
