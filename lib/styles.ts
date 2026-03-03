/**
 * Shared style definitions used by both client components (StylePicker.jsx)
 * and server actions (change-style.ts).
 */
export const STYLES = {
    // Moderno & Tehnološki
    bento: {
        label: 'Bento / Apple',
        category: 'Moderno & Tehnološki',
        emoji: '⬜',
        desc: 'Čiste kartice, puno bijelog prostora, zaobljeni rubovi',
        prompt: 'Use a Bento grid layout, soft rounded corners (rounded-2xl), subtle drop shadows, glassmorphism effects (backdrop-blur), minimalist Apple-like aesthetic, lots of whitespace.',
    },
    dark_web3: {
        label: 'Dark / Web3',
        category: 'Moderno & Tehnološki',
        emoji: '🌑',
        desc: 'Tamna pozadina, neon akcenti, visoki kontrast',
        prompt: 'Strictly dark mode (bg-slate-950), glowing gradients (bg-gradient-to-r), neon accent colors (cyan or purple), tech-focused, high contrast.',
    },
    neo_brutalism: {
        label: 'Neo-Brutalism',
        category: 'Moderno & Tehnološki',
        emoji: '⚡',
        desc: 'Debeli obrubi, tvrde sjene, odvažne boje',
        prompt: 'Neo-brutalist style, hard black shadows (shadow-[4px_4px_0px_black]), thick solid borders (border-2 border-black), bold punchy colors (yellow, pink, blue), aggressive and playful.',
    },
    corporate: {
        label: 'Korporativno',
        category: 'Moderno & Tehnološki',
        emoji: '🏢',
        desc: 'Profesionalno, plava paleta, strukturirano',
        prompt: 'Highly professional, trustworthy corporate design, strictly blue and slate color palette, structured grid, crisp edges, no playful elements.',
    },
    glassmorphism: {
        label: 'Glassmorphism',
        category: 'Moderno & Tehnološki',
        emoji: '🔮',
        desc: 'Prozirne kartice, zamućena pozadina, blur efekti',
        prompt: 'Glassmorphism UI, frosted glass cards (bg-white/10 backdrop-blur-md), blurred colorful blobs in the background, semi-transparent borders.',
    },

    // Kreativno & Odvažno
    editorial: {
        label: 'Editorial',
        category: 'Kreativno & Odvažno',
        emoji: '📰',
        desc: 'Magazin layout, serif tipografija, asimetrični grid',
        prompt: 'Editorial magazine layout, elegant Serif typography (e.g., Playfair Display) for large headings, asymmetrical grids, prominent pull quotes.',
    },
    typography_first: {
        label: 'Tipografija',
        category: 'Kreativno & Odvažno',
        emoji: 'Aa',
        desc: 'Ogromni naslovi, minimalne slike, brutalistički font',
        prompt: 'Typography-centric design, massive oversized headings, minimal to zero images, brutalist font choices, tight tracking (tracking-tighter).',
    },
    playful: {
        label: 'Playful / App',
        category: 'Kreativno & Odvažno',
        emoji: '🎈',
        desc: 'Zaobljeni gumbi, žive boje, prijateljski UI',
        prompt: 'Playful and friendly app aesthetic, fully rounded buttons (rounded-full), vibrant primary colors, soft bouncy UI, minimal borders.',
    },
    cyberpunk: {
        label: 'Cyberpunk',
        category: 'Kreativno & Odvažno',
        emoji: '👾',
        desc: 'Crna pozadina, neon zelena, terminal estetika',
        prompt: 'Cyberpunk aesthetic, pitch black background, neon green or magenta text, monospaced typography (font-mono), grid lines, terminal-like UI.',
    },
    retro: {
        label: 'Retro / 90s',
        category: 'Kreativno & Odvažno',
        emoji: '📼',
        desc: 'Topli toni, vintage serif, granulirana tekstura',
        prompt: 'Retro 90s aesthetic, warm sepia undertones, classic serif fonts, slightly muted color palette, textured or grainy background feel.',
    },

    // Elegantno & Premium
    luxury: {
        label: 'Luxury',
        category: 'Elegantno & Premium',
        emoji: '✨',
        desc: 'Ultra minimalistično, crno-bijelo-zlatno, serif',
        prompt: 'Ultra-luxury high-end aesthetic, extremely minimalist, black, white, and gold/silver accents, elegant serif fonts, massive whitespace (p-24).',
    },
    organic: {
        label: 'Organic / Earthy',
        category: 'Elegantno & Premium',
        emoji: '🌿',
        desc: 'Pastelne boje, prirodno, zaobljeno, mirno',
        prompt: 'Organic and earthy vibe, soft pastel colors (sage green, sand, terracotta), heavily rounded image corners, nature-inspired, calm.',
    },
    monochrome: {
        label: 'Monochrome',
        category: 'Elegantno & Premium',
        emoji: '⬛',
        desc: 'Isključivo crno i bijelo, arhitektonski',
        prompt: 'Strictly monochromatic, black and white only, rely entirely on font weights and spacing for visual hierarchy, sharp and architectural.',
    },
    neumorphism: {
        label: 'Neumorphism',
        category: 'Elegantno & Premium',
        emoji: '🪨',
        desc: 'Meke sjene, elementi izlaze iz pozadine, blagi grey-blue',
        prompt: 'Neumorphic soft UI, very low contrast, elements look extruded from the background, inset shadows, soft gray-blue palette.',
    },
    scandinavian: {
        label: 'Skandinavski',
        category: 'Elegantno & Premium',
        emoji: '🏔',
        desc: 'Čisto, prozračno, off-white, funkcionalno',
        prompt: 'Scandinavian minimalism, extremely clean, off-white backgrounds (bg-stone-50), highly functional, sans-serif only, airy.',
    },

    // Specifične niše
    industrial: {
        label: 'Industrial',
        category: 'Specifične niše',
        emoji: '🔧',
        desc: 'Blueprint grid, monospaced, slate & steel blue',
        prompt: 'Industrial blueprint style, visible grid background, technical monospaced fonts, slate and steel blue colors.',
    },
    ecommerce: {
        label: 'E-commerce',
        category: 'Specifične niše',
        emoji: '🛒',
        desc: 'Jasne kartice, vidljivi CTA, tablice cijena',
        prompt: 'E-commerce focused, extremely clear product cards, highly visible and contrasting CTA buttons, urgency elements, clean pricing tables.',
    },
    portfolio: {
        label: 'Portfolio',
        category: 'Specifične niše',
        emoji: '🖼',
        desc: 'Vizualno-prvo, masonry grid, tamna pozadina',
        prompt: 'Visual-first portfolio, masonry image grid, hidden or minimal navigation, focus entirely on imagery, dark background to make photos pop.',
    },
    material: {
        label: 'Material / Google',
        category: 'Specifične niše',
        emoji: '🎨',
        desc: 'Slojeviti layout, sjene, flat žive boje',
        prompt: 'Material design principles, distinct overlapping layers with clear drop shadows (shadow-md, shadow-lg), flat vibrant accent colors.',
    },
    handmade: {
        label: 'Handmade',
        category: 'Specifične niše',
        emoji: '✂️',
        desc: 'Scrapbook osjećaj, zakrenute kartice, rukopisni font',
        prompt: 'Handmade scrapbook feel, slightly rotated images (-rotate-2), overlapping cards, playful handwritten-style fonts for accents, casual vibe.',
    },
} as const;

export type StyleKey = keyof typeof STYLES;
