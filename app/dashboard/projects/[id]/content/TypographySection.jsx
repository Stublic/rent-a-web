'use client';

import { useMemo } from 'react';
import { Type, Sparkles, Check } from 'lucide-react';

// ─── Font pair definitions ──────────────────────────────────────────
// Each pair: heading font + body font, with a descriptive name and mood
const FONT_PAIRS = [
    {
        id: 'auto',
        name: 'AI odabire',
        heading: '',
        body: '',
        mood: 'AI bira idealne fontove za vašu industriju',
        isAuto: true,
    },
    {
        id: 'inter-inter',
        name: 'Moderna Čistoća',
        heading: 'Inter',
        body: 'Inter',
        mood: 'Čist, profesionalan, univerzalan',
        tags: ['saas', 'b2b', 'default'],
    },
    {
        id: 'poppins-inter',
        name: 'Prijateljski Profesional',
        heading: 'Poppins',
        body: 'Inter',
        mood: 'Pristupačan i moderan',
        tags: ['edukacija', 'salon', 'teretana'],
    },
    {
        id: 'playfair-lato',
        name: 'Elegantna Klasika',
        heading: 'Playfair Display',
        body: 'Lato',
        mood: 'Luksuzno i sofisticirano',
        tags: ['restoran', 'nekretnine', 'turizam'],
    },
    {
        id: 'montserrat-opensans',
        name: 'Čvrsti Temelji',
        heading: 'Montserrat',
        body: 'Open Sans',
        mood: 'Snažno i pouzdano',
        tags: ['majstor', 'auto', 'teretana'],
    },
    {
        id: 'raleway-roboto',
        name: 'Minimalistički',
        heading: 'Raleway',
        body: 'Roboto',
        mood: 'Elegantan minimalizam',
        tags: ['fotograf', 'saas', 'b2b'],
    },
    {
        id: 'dmserif-dmsans',
        name: 'Editorijal',
        heading: 'DM Serif Display',
        body: 'DM Sans',
        mood: 'Novinski, autoritativan',
        tags: ['b2b', 'nekretnine', 'default'],
    },
    {
        id: 'outfit-outfit',
        name: 'Geometrijski',
        heading: 'Outfit',
        body: 'Outfit',
        mood: 'Moderan i čist geometrijski stil',
        tags: ['saas', 'teretana', 'edukacija'],
    },
    {
        id: 'spacegrotesk-inter',
        name: 'Tech Startup',
        heading: 'Space Grotesk',
        body: 'Inter',
        mood: 'Futuristički, inovativan',
        tags: ['saas', 'auto', 'default'],
    },
    {
        id: 'cormorant-mulish',
        name: 'Luksuzni Serif',
        heading: 'Cormorant Garamond',
        body: 'Mulish',
        mood: 'Rafinirano, premium',
        tags: ['restoran', 'turizam', 'salon'],
    },
    {
        id: 'bebas-roboto',
        name: 'Hrabri Naslovi',
        heading: 'Bebas Neue',
        body: 'Roboto',
        mood: 'Udaran, sportski, energičan',
        tags: ['teretana', 'auto', 'majstor'],
    },
    {
        id: 'sora-inter',
        name: 'Digitalni Premium',
        heading: 'Sora',
        body: 'Inter',
        mood: 'Moderan tech, premium osjećaj',
        tags: ['saas', 'b2b', 'zdravlje'],
    },
];

// Get recommended font pairs for an industry
function getRecommendedPairs(industry) {
    if (!industry) return FONT_PAIRS;
    const lower = industry.toLowerCase();

    // Map industry to tag
    const tagMap = [
        [/restoran|pizzeria|bistro|konoba|caffe|bar|kafić|catering|ugostiteljstv/, 'restoran'],
        [/salon|frizer|kozmetičar|beauty|spa|masaža|wellness/, 'salon'],
        [/majstor|vodoinstalater|električar|keramičar|stolar|bravar|obrt/, 'majstor'],
        [/stomatolog|zubar|doktor|psiholog|fizioterapeut|ordinacija|klinika|zdravstv|medicin/, 'zdravlje'],
        [/apartman|vila|smještaj|hotel|hostel|turizam|kamp|pansion/, 'turizam'],
        [/knjigovodstvo|agencija|konzalting|marketing|odvjetnik|poslovn|b2b/, 'b2b'],
        [/autoškola|tečaj|škola|edukacij|seminar|akademija/, 'edukacija'],
        [/mehaničar|vulkanizer|rent.a.car|auto.*servis|autokuća|autopraonica/, 'auto'],
        [/saas|software|aplikacija|startup|tech|fintech/, 'saas'],
        [/nekretnin|real.estate/, 'nekretnine'],
        [/teretana|fitness|gym|crossfit|pilates|yoga|trening/, 'teretana'],
        [/fotograf|videograf|snimanje|foto.studio/, 'fotograf'],
    ];

    let tag = 'default';
    for (const [pattern, t] of tagMap) {
        if (pattern.test(lower)) { tag = t; break; }
    }

    // Sort: recommended first, then rest
    const recommended = FONT_PAIRS.filter(p => p.isAuto || (p.tags && p.tags.includes(tag)));
    const others = FONT_PAIRS.filter(p => !p.isAuto && (!p.tags || !p.tags.includes(tag)));
    return [...recommended, ...others];
}

// Google Fonts URL for a pair
function getFontUrl(heading, body) {
    const fonts = new Set();
    if (heading) fonts.add(heading.replace(/ /g, '+') + ':wght@400;700');
    if (body && body !== heading) fonts.add(body.replace(/ /g, '+') + ':wght@400;500;600');
    if (fonts.size === 0) return null;
    return `https://fonts.googleapis.com/css2?${[...fonts].map(f => `family=${f}`).join('&')}&display=swap`;
}

export default function TypographySection({ watch, setValue }) {
    const industry = watch('industry');
    const currentFontPair = watch('fontPair') || 'auto';

    const sortedPairs = useMemo(() => getRecommendedPairs(industry), [industry]);

    const selectPair = (pairId) => {
        setValue('fontPair', pairId === 'auto' ? '' : pairId, { shouldDirty: true });
    };

    // Load Google Fonts for preview
    const fontsToLoad = useMemo(() => {
        const urls = new Set();
        FONT_PAIRS.forEach(p => {
            if (p.heading && p.body) {
                const url = getFontUrl(p.heading, p.body);
                if (url) urls.add(url);
            }
        });
        return [...urls];
    }, []);

    return (
        <div className="space-y-3">
            {/* Font preload links */}
            {fontsToLoad.map((url, i) => (
                <link key={i} rel="stylesheet" href={url} />
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sortedPairs.map((pair) => {
                    const isSelected = pair.isAuto
                        ? (!currentFontPair || currentFontPair === '' || currentFontPair === 'auto')
                        : currentFontPair === pair.id;

                    return (
                        <button
                            key={pair.id}
                            type="button"
                            onClick={() => selectPair(pair.id)}
                            className="group relative rounded-xl overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] text-left"
                            style={{
                                border: isSelected ? '2px solid rgba(34,197,94,0.5)' : '1px solid var(--lp-border)',
                                background: 'var(--lp-surface)',
                            }}
                        >
                            {pair.isAuto ? (
                                /* AI Auto Option */
                                <div className="flex items-center gap-3 px-4 py-3.5">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
                                        <Sparkles size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold block" style={{ color: isSelected ? '#A78BFA' : 'var(--lp-heading)' }}>
                                            AI odabire fontove
                                        </span>
                                        <span className="text-[11px]" style={{ color: 'var(--lp-text-muted)' }}>
                                            {pair.mood}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#22c55e' }}>
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Font pair card */
                                <div>
                                    {/* Font preview */}
                                    <div className="px-4 pt-3.5 pb-2">
                                        <div className="text-lg font-bold leading-tight truncate" style={{ fontFamily: `'${pair.heading}', sans-serif`, color: 'var(--lp-heading)' }}>
                                            Naslov stranice
                                        </div>
                                        <div className="text-xs mt-1 leading-relaxed" style={{ fontFamily: `'${pair.body}', sans-serif`, color: 'var(--lp-text-secondary)' }}>
                                            Ovo je primjer teksta koji se koristi na web stranici za opise i ostali sadržaj.
                                        </div>
                                    </div>
                                    {/* Label bar */}
                                    <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--lp-border)' }}>
                                        <div className="min-w-0">
                                            <span className="text-xs font-semibold block truncate" style={{ color: 'var(--lp-heading)' }}>
                                                {pair.name}
                                            </span>
                                            <span className="text-[10px] block truncate" style={{ color: 'var(--lp-text-muted)' }}>
                                                {pair.heading}{pair.heading !== pair.body ? ` + ${pair.body}` : ''} · {pair.mood}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ml-2" style={{ background: '#22c55e' }}>
                                                <Check size={10} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Export font pairs for use in generators
export { FONT_PAIRS, getFontUrl };
