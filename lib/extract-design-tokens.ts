/**
 * extractDesignTokens.ts
 * Extracts design tokens (colors, fonts, spacing) from generated HTML
 * to ensure consistent design across all subpages.
 */

export interface DesignTokens {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        heading: string;
        muted: string;
        [key: string]: string;
    };
    fonts: {
        heading: string;
        body: string;
        [key: string]: string;
    };
    borderRadius: string;
    navHtml: string;   // Full nav HTML to reuse verbatim
    footerHtml: string; // Full footer HTML to reuse verbatim
    tailwindConfig: string; // Tailwind config block if present
}

/**
 * Extract design tokens from generated homepage HTML.
 * Parses CSS, inline styles, Tailwind classes, and structural elements.
 */
export function extractDesignTokens(html: string): DesignTokens {
    const tokens: DesignTokens = {
        colors: {
            primary: '', secondary: '', accent: '',
            background: '', text: '', heading: '', muted: '',
        },
        fonts: { heading: '', body: '' },
        borderRadius: '',
        navHtml: '',
        footerHtml: '',
        tailwindConfig: '',
    };

    // ─── Extract Tailwind config ──────────────────────────────────────
    const twConfigMatch = html.match(/tailwind\.config\s*=\s*\{[\s\S]*?\}[\s\S]*?\}/);
    if (twConfigMatch) {
        tokens.tailwindConfig = twConfigMatch[0];
    }

    // ─── Extract colors from Tailwind config or CSS ───────────────────
    // Look for color definitions in tailwind.config
    const colorMatches = html.matchAll(/['"]?(primary|secondary|accent|background|dark|light|heading|muted)['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))['"]?/g);
    for (const match of colorMatches) {
        const key = match[1].toLowerCase();
        const value = match[2];
        if (key in tokens.colors) {
            tokens.colors[key] = value;
        }
    }

    // Extract from CSS custom properties (--color-primary: #xxx)
    const cssVarMatches = html.matchAll(/--(?:color-?)?(primary|secondary|accent|bg|background|text|heading|muted)\s*:\s*([^;]+)/g);
    for (const match of cssVarMatches) {
        const key = match[1] === 'bg' ? 'background' : match[1];
        if (key in tokens.colors && !tokens.colors[key]) {
            tokens.colors[key] = match[2].trim();
        }
    }

    // Extract from bg-[#xxx] or text-[#xxx] Tailwind classes
    const twColorMatches = html.matchAll(/(?:bg|text|border|from|to|via)-\[(#[0-9a-fA-F]{3,8})\]/g);
    const foundColors = new Set<string>();
    for (const match of twColorMatches) {
        foundColors.add(match[1]);
    }
    // Assign found colors to empty slots
    const colorArray = Array.from(foundColors);
    if (!tokens.colors.primary && colorArray[0]) tokens.colors.primary = colorArray[0];
    if (!tokens.colors.secondary && colorArray[1]) tokens.colors.secondary = colorArray[1];
    if (!tokens.colors.accent && colorArray[2]) tokens.colors.accent = colorArray[2];

    // ─── Extract fonts ────────────────────────────────────────────────
    // From Google Fonts link
    const fontLinkMatch = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"&]+)/);
    if (fontLinkMatch) {
        const families = decodeURIComponent(fontLinkMatch[1]).split('&family=');
        if (families[0]) tokens.fonts.heading = families[0].split(':')[0].replace(/\+/g, ' ');
        if (families[1]) tokens.fonts.body = families[1].split(':')[0].replace(/\+/g, ' ');
        else tokens.fonts.body = tokens.fonts.heading;
    }

    // From font-family CSS
    const fontFamilyMatches = html.matchAll(/font-family:\s*['"]?([^'";\}]+)/g);
    const fontFamilies: string[] = [];
    for (const match of fontFamilyMatches) {
        const font = match[1].split(',')[0].trim().replace(/['"]/g, '');
        if (!fontFamilies.includes(font) && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(font)) {
            fontFamilies.push(font);
        }
    }
    if (!tokens.fonts.heading && fontFamilies[0]) tokens.fonts.heading = fontFamilies[0];
    if (!tokens.fonts.body && fontFamilies[1]) tokens.fonts.body = fontFamilies[1] || fontFamilies[0];

    // ─── Extract border radius ────────────────────────────────────────
    const borderRadiusMatch = html.match(/border-radius:\s*([^;]+)/);
    if (borderRadiusMatch) {
        tokens.borderRadius = borderRadiusMatch[1].trim();
    }

    // ─── Extract Navigation HTML ──────────────────────────────────────
    // Match <nav>...</nav> or <header>...</header>
    const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i) || html.match(/<header[\s\S]*?<\/header>/i);
    if (navMatch) {
        tokens.navHtml = navMatch[0];
    }

    // ─── Extract Footer HTML ──────────────────────────────────────────
    const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
    if (footerMatch) {
        tokens.footerHtml = footerMatch[0];
    }

    return tokens;
}
