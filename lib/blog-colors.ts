/**
 * Extract blog-relevant color tokens from the generated homepage HTML.
 * Returns CSS variables that match the homepage's actual palette.
 */
export function extractBlogColors(html: string): {
    bg: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    heading: string;
    cardBg: string;
    cardBorder: string;
    footerBg: string;
    footerBorder: string;
    codeBg: string;
    blockquoteBg: string;
} {
    // Default dark theme colors (fallback)
    const colors = {
        bg: '#0a0a0a',
        surface: '#18181b',
        surfaceHover: '#27272a',
        border: '#27272a',
        text: '#e4e4e7',
        textSecondary: '#a1a1aa',
        textMuted: '#71717a',
        heading: '#ffffff',
        cardBg: '#18181b',
        cardBorder: '#27272a',
        footerBg: '#111113',
        footerBorder: '#18181b',
        codeBg: '#18181b',
        blockquoteBg: '#18181b',
    };

    if (!html) return colors;

    // --- Try to extract background color from body/html styles or Tailwind classes ---
    let mainBg = '';

    // 1. Check for background in <style> body { background: ... }
    const bodyBgMatch = html.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*([^;}\s]+)/i);
    if (bodyBgMatch) mainBg = bodyBgMatch[1].trim();

    // 2. Check for Tailwind bg class on body
    if (!mainBg) {
        const bodyClassMatch = html.match(/<body[^>]*class="([^"]*)"/i);
        if (bodyClassMatch) {
            const bgClass = bodyClassMatch[1].match(/bg-\[(#[0-9a-fA-F]{3,8})\]/);
            if (bgClass) mainBg = bgClass[1];
            // Check for bg-slate-900 etc
            const namedBg = bodyClassMatch[1].match(/bg-(slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)/);
            if (namedBg && !mainBg) {
                const shade = parseInt(namedBg[2]);
                if (shade >= 800) mainBg = shade >= 950 ? '#030712' : shade >= 900 ? '#0f172a' : '#1e293b';
            }
        }
    }

    // 3. Check for bg color in Tailwind config
    if (!mainBg) {
        const twConfig = html.match(/tailwind\.config\s*=\s*\{[\s\S]*?\}\s*\}/);
        if (twConfig) {
            const bgMatch = twConfig[0].match(/(?:background|dark|bg)\s*:\s*['"]?(#[0-9a-fA-F]{3,8})['"]?/i);
            if (bgMatch) mainBg = bgMatch[1];
        }
    }

    // 4. Extract from inline styles on first major container
    if (!mainBg) {
        const inlineMatch = html.match(/style="[^"]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/i);
        if (inlineMatch) mainBg = inlineMatch[1];
    }

    if (!mainBg) return colors; // Can't determine, use defaults

    // Determine if the site is dark or light
    const isDark = isColorDark(mainBg);

    if (isDark) {
        // Use the actual bg color and derive surface/border from it
        colors.bg = mainBg;
        colors.surface = lightenHex(mainBg, 8);
        colors.surfaceHover = lightenHex(mainBg, 16);
        colors.border = lightenHex(mainBg, 16);
        colors.cardBg = lightenHex(mainBg, 8);
        colors.cardBorder = lightenHex(mainBg, 16);
        colors.footerBg = lightenHex(mainBg, 4);
        colors.footerBorder = lightenHex(mainBg, 8);
        colors.codeBg = lightenHex(mainBg, 8);
        colors.blockquoteBg = lightenHex(mainBg, 6);
        colors.heading = '#ffffff';
        colors.text = '#e4e4e7';
        colors.textSecondary = '#a1a1aa';
        colors.textMuted = '#71717a';
    } else {
        colors.bg = mainBg;
        colors.surface = darkenHex(mainBg, 4);
        colors.surfaceHover = darkenHex(mainBg, 10);
        colors.border = darkenHex(mainBg, 10);
        colors.cardBg = mainBg;
        colors.cardBorder = darkenHex(mainBg, 10);
        colors.footerBg = darkenHex(mainBg, 4);
        colors.footerBorder = darkenHex(mainBg, 8);
        colors.codeBg = darkenHex(mainBg, 4);
        colors.blockquoteBg = darkenHex(mainBg, 3);
        colors.heading = '#09090b';
        colors.text = '#18181b';
        colors.textSecondary = '#52525b';
        colors.textMuted = '#a1a1aa';
    }

    return colors;
}

// --- Helper functions ---

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
    };
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isColorDark(hex: string): boolean {
    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
}

function lightenHex(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r + amount, g + amount, b + amount);
}

function darkenHex(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r - amount, g - amount, b - amount);
}
