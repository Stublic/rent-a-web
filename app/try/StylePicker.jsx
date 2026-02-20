'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

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
};

const CATEGORIES = ['Moderno & Tehnološki', 'Kreativno & Odvažno', 'Elegantno & Premium', 'Specifične niše'];

export default function StylePicker({ selected, onSelect }) {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

    const stylesInCategory = Object.entries(STYLES).filter(
        ([, s]) => s.category === activeCategory
    );

    return (
        <div className="w-full">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            activeCategory === cat
                                ? 'bg-white text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Style grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* "Let AI decide" option */}
                {activeCategory === CATEGORIES[0] && (
                    <button
                        onClick={() => onSelect(null)}
                        className={`relative flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all ${
                            selected === null
                                ? 'border-white bg-white/8'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                        }`}
                    >
                        {selected === null && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                <Check size={10} className="text-black" />
                            </span>
                        )}
                        <span className="text-xl">🤖</span>
                        <span className="text-xs font-bold text-white">AI odabir</span>
                        <span className="text-[10px] text-zinc-500 leading-tight">AI sam bira najbolji stil</span>
                    </button>
                )}

                {stylesInCategory.map(([key, style]) => (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`relative flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all ${
                            selected === key
                                ? 'border-white bg-white/8'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                        }`}
                    >
                        {selected === key && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                <Check size={10} className="text-black" />
                            </span>
                        )}
                        <span className="text-xl leading-none">{style.emoji}</span>
                        <span className="text-xs font-bold text-white leading-tight">{style.label}</span>
                        <span className="text-[10px] text-zinc-500 leading-tight">{style.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
