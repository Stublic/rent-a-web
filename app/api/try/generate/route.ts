import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' }) : null;

// ─── Rate limiting ────────────────────────────────────────────
const rateLimitMap = new Map<string, { windowStart: number; count: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string) {
    const now = Date.now();
    const key = `generate:${ip}`;
    const entry = rateLimitMap.get(key);
    if (!entry || now - entry.windowStart > RATE_WINDOW) {
        rateLimitMap.set(key, { windowStart: now, count: 1 });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// ─── Pexels-only image search ─────────────────────────────────
async function searchPexels(query: string): Promise<string | null> {
    const key = process.env.PEXELS_API_KEY;
    if (!key) return null;
    try {
        const r = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
            { headers: { Authorization: key } }
        );
        if (!r.ok) return null;
        const d = await r.json();
        const photo = d.photos?.[0];
        return photo?.src?.large2x ?? photo?.src?.large ?? null;
    } catch { return null; }
}

// ─── Industry → base subject (English) ───────────────────────
// Matches Croatian keywords to a concise English subject used in image queries
const INDUSTRY_SUBJECTS: Array<{ kw: string[]; subject: string; env: string }> = [
    {
        kw: ['frizer', 'salon', 'šiš', 'boja', 'kos', 'hair', 'friz'],
        subject: 'hairdresser', env: 'beauty salon'
    },
    {
        kw: ['restoran', 'pizzeria', 'pizza', 'caffe', 'café', 'kafić', 'bistro', 'konoba', 'grill', 'kuhinja', 'chef'],
        subject: 'chef cooking', env: 'restaurant'
    },
    {
        kw: ['auto', 'mehaničar', 'automobil', 'vozil', 'gume', 'motor', 'servis auto'],
        subject: 'car mechanic', env: 'garage workshop'
    },
    {
        kw: ['odvjetn', 'pravn', 'sud', 'ugovor', 'pravo', 'notarsk'],
        subject: 'lawyer professional', env: 'law office'
    },
    {
        kw: ['liječn', 'doktor', 'klinik', 'stomatolog', 'zubar', 'medicin', 'zdravl', 'psiholog', 'terapeut', 'savjetovanj'],
        subject: 'therapist consultation', env: 'calm office'
    },
    {
        kw: ['coach', 'treneri', 'kouč', 'mentori', 'personal', 'savjet', 'nfp', 'life'],
        subject: 'life coach consultation', env: 'bright cozy space'
    },
    {
        kw: ['dom', 'prostor', 'interijer', 'uređenj', 'home', 'stanovan'],
        subject: 'cozy home interior', env: 'bright living room'
    },
    {
        kw: ['fitness', 'teretana', 'gym', 'trening', 'sport', 'trener', 'pilates', 'yoga', 'wellness'],
        subject: 'fitness training', env: 'modern gym studio'
    },
    {
        kw: ['kozmet', 'ljepot', 'beauty', 'manikur', 'pedikur', 'spa', 'masaž', 'nega'],
        subject: 'beauty treatment', env: 'luxury spa salon'
    },
    {
        kw: ['građevin', 'gradi', 'renovacij', 'soboslikar', 'ličilac', 'fasad', 'krov', 'zidar'],
        subject: 'construction worker skilled', env: 'renovation site'
    },
    {
        kw: ['vodoinstalater', 'instal', 'kupaon', 'sanitarij'],
        subject: 'plumber professional', env: 'modern bathroom'
    },
    {
        kw: ['računovod', 'porez', 'financij', 'reviz', 'knjigovod'],
        subject: 'accountant professional', env: 'clean office'
    },
    {
        kw: ['fotografij', 'fotograf', 'video', 'sniman', 'vjenčanj', 'wedding', 'portret'],
        subject: 'photographer camera', env: 'photo studio'
    },
    {
        kw: ['nekretnin', 'stan', 'kuć', 'real estate', 'prodaj', 'najam stan'],
        subject: 'real estate property', env: 'modern house interior'
    },
    {
        kw: ['pekar', 'pekara', 'kruh', 'kolač', 'torta', 'slastičar', 'desert'],
        subject: 'artisan bread pastry', env: 'bakery interior'
    },
    {
        kw: ['cvjeć', 'flower', 'buket', 'florist'],
        subject: 'florist flowers', env: 'flower shop'
    },
    {
        kw: ['softver', 'razvoj', 'programer', 'web', 'app', 'digital', 'startup', 'tech', 'it', 'saas'],
        subject: 'developer working', env: 'modern tech office'
    },
    {
        kw: ['čišćen', 'posprem', 'clean', 'higijena', 'dezinfek'],
        subject: 'cleaning professional', env: 'clean bright home'
    },
    {
        kw: ['prijevoz', 'dostava', 'taxi', 'logistik', 'kamion', 'kurirsk'],
        subject: 'delivery driver', env: 'logistics warehouse'
    },
    {
        kw: ['hotel', 'hostel', 'smještaj', 'apartman', 'resort'],
        subject: 'hotel lobby luxury', env: 'elegant accommodation'
    },
    {
        kw: ['turizam', 'putovanj', 'travel', 'odmor', 'izlet', 'agencij'],
        subject: 'travel scenery', env: 'beautiful destination'
    },
    {
        kw: ['hrana', 'catering', 'dostava jela', 'meal'],
        subject: 'food catering', env: 'kitchen preparation'
    },
    {
        kw: ['vrtlar', 'vrt', 'cvijeće', 'hortikultur', 'uređenj vrta'],
        subject: 'garden landscaping', env: 'beautiful garden'
    },
    {
        kw: ['glazb', 'glazben', 'glazbenik', 'studio', 'sniman glazb', 'bend'],
        subject: 'music studio musician', env: 'recording studio'
    },
    {
        kw: ['tiskara', 'tisak', 'dizajn', 'grafičk', 'print'],
        subject: 'graphic design print', env: 'creative studio'
    },
];

// Style → aesthetic modifier that shapes photo mood
const STYLE_IMAGE_MODS: Record<string, string> = {
    organic: 'natural light warm earthy tones plants',
    luxury: 'minimalist elegant white marble gold',
    scandinavian: 'bright clean white minimal airy',
    cyberpunk: 'dark neon moody dramatic',
    dark_web3: 'dark moody dramatic blue purple',
    retro: 'vintage warm film grain nostalgic',
    playful: 'bright colorful vibrant cheerful',
    corporate: 'professional formal clean blue',
    glassmorphism: 'bright airy colorful blurred background',
    bento: 'clean minimal white organised flat lay',
    neo_brutalism: 'bold graphic high contrast punchy',
    editorial: 'artistic editorial fashion editorial',
    typography_first: 'minimal graphic typographic',
    neumorphism: 'soft gray pastel low contrast',
    monochrome: 'black white high contrast dramatic',
    industrial: 'industrial metal concrete dark',
    ecommerce: 'product photography clean white background',
    portfolio: 'creative artistic dramatic moody',
    material: 'clean flat colorful layered',
    handmade: 'handmade craft artisan rustic',
};

// Style → design system for the prompt
const STYLE_PROMPTS: Record<string, string> = {
    bento: 'Bento grid layout. Soft rounded corners (rounded-2xl). Subtle drop shadows. Glassmorphism cards (backdrop-blur). Minimalist Apple-like aesthetic. Lots of whitespace. Light background.',
    dark_web3: 'Strictly dark mode (bg-slate-950 or bg-black). Glowing gradient accents (cyan, purple, blue). Neon borders. High contrast. Futuristic tech feel. No light sections.',
    neo_brutalism: 'Neo-brutalist. Hard black drop shadows (box-shadow: 4px 4px 0 black). Thick black borders everywhere (border-2 border-black or border-4). Bold punchy fill colors (yellow, hot pink, electric blue, lime). Raw, loud, unapologetic. No subtle gradients.',
    corporate: 'Highly professional corporate. Strictly navy/slate/blue color palette. Structured 3-col grids. Zero playful elements. Clean sans-serif. Trust-building layout.',
    glassmorphism: 'Glassmorphism. Frosted glass cards (background: rgba(255,255,255,0.1), backdrop-filter: blur(20px)). Colorful blurred blobs behind everything. Light, dreamy aesthetic.',
    editorial: 'Editorial magazine layout. Oversized serif headings (Playfair Display or similar). Asymmetric grids. Horizontal rules as dividers. Pull quotes in large italic. Classic and refined.',
    typography_first: 'Typography-driven. Massive display fonts (10rem+ headings). Minimal imagery. Brutalist font weights. All visual hierarchy comes from type scale and spacing.',
    playful: 'Playful, friendly app-like. Fully rounded everything (rounded-full). Vibrant primary colors (coral, sky, lime). Big bouncy buttons. Soft card shadows. Minimal borders. Fun.',
    cyberpunk: 'Cyberpunk. Pitch black background (#000). Neon green (#00ff41) or hot pink/magenta text. Monospaced font (Courier New, JetBrains Mono). Visible grid lines overlay. Terminal scanline effect.',
    retro: 'Retro 90s/70s. Warm cream/sepia background. Classic serif or slab fonts. Muted earthy palette (mustard, rust, forest green). Slight grain texture. Nostalgic and warm.',
    luxury: 'Ultra-luxury. Extremely minimal. Black, white, and gold/champagne only. Thin elegant serif font (Cormorant Garamond). Massive whitespace (padding: 8rem+). No decorative clutter.',
    organic: 'Organic and earthy. Sage green, sand, terracotta, warm cream palette. Soft rounded corners. Natural textures (linen, stone). Flowing organic shapes as SVG decorations. Calm, grounded, nurturing feel. Nature-inspired section dividers.',
    monochrome: 'Strictly black and white. No colors whatsoever. All hierarchy from font weight (100–900) and generous spacing. Sharp, architectural, bold.',
    neumorphism: 'Neumorphism (soft UI). Light neutral gray background (#e0e5ec). Elements have extruded soft shadow (box-shadow: 6px 6px 12px #b8bec7, -6px -6px 12px #ffffff). Very low contrast. Calm and tactile.',
    scandinavian: 'Scandinavian minimalism. Off-white/light stone background. Maximum white space. Single accent color (dusty blue or forest green). Strictly sans-serif. Functional, airy, IKEA-like clarity.',
    industrial: 'Industrial. Dark steel-gray background. Blueprint grid overlay (CSS background-image grid). Monospaced fonts. Slate and steel-blue palette. Technical drawings aesthetic.',
    ecommerce: 'E-commerce conversion-focused. Clean product cards with strong CTA buttons. Urgency elements (badges, timers). Trust signals (reviews, guarantees). Clear pricing tables.',
    portfolio: 'Portfolio visual-first. Oversized imagery. Minimal navigation that disappears. Dark background so photos pop. Hover reveals on project cards. Gallery masonry grid.',
    material: 'Material Design. Distinct card layers with elevation (shadow-md, shadow-xl). Flat vibrant accent colors. FAB button. Clear visual hierarchy with elevation.',
    handmade: 'Handmade scrapbook. Slightly rotated elements (-rotate-1, rotate-2). Overlapping layered cards. Handwritten accent font (Caveat, Patrick Hand). Warm, casual, personal.',
};

// Build up to 3 Pexels queries from business + style
function buildImageQueries(
    businessName: string,
    businessDescription: string,
    styleKey: string | null
): { hero: string; about: string; features: string } {
    const text = `${businessName} ${businessDescription}`.toLowerCase();
    const styleMod = styleKey ? (STYLE_IMAGE_MODS[styleKey] ?? '') : '';

    // Match industry
    const matched = INDUSTRY_SUBJECTS.find(e => e.kw.some(kw => text.includes(kw)));

    if (matched) {
        // Style mod shifts the photo mood — e.g. "hairdresser natural light warm earthy tones plants"
        const mod = styleMod ? ` ${styleMod}` : '';
        return {
            hero: `${matched.env}${mod}`,
            about: `${matched.subject}${mod}`,
            features: `${matched.env} detail${mod}`,
        };
    }

    // No industry match — use business name + style mood as fallback
    const nameWords = businessName.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
    const base = nameWords || 'professional service';
    return {
        hero: `${base} ${styleMod || 'professional background'}`,
        about: `${base} ${styleMod || 'team people'}`,
        features: `${base} ${styleMod || 'work detail'}`,
    };
}

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Previše zahtjeva. Pokušajte ponovno za sat vremena.' },
                { status: 429 }
            );
        }

        if (!GOOGLE_API_KEY || !model) {
            return NextResponse.json({ error: 'AI sustav nije konfiguriran.' }, { status: 500 });
        }

        const { businessName, businessDescription, styleKey } = await req.json();

        if (!businessName || !businessDescription) {
            return NextResponse.json({ error: 'Naziv i opis biznisa su obavezni.' }, { status: 400 });
        }
        if (businessName.length > 100 || businessDescription.length > 1000) {
            return NextResponse.json({ error: 'Tekst je predugačak.' }, { status: 400 });
        }

        const styleGuide = styleKey ? (STYLE_PROMPTS[styleKey] ?? '') : '';
        const styleMod = styleKey ? (STYLE_IMAGE_MODS[styleKey] ?? '') : '';

        console.log(`🎨 Trial | style: ${styleKey ?? 'auto'} | "${businessName}"`);

        // Fetch Pexels images — style-aware + industry-aware queries
        const queries = buildImageQueries(businessName, businessDescription, styleKey);
        console.log(`🔍 Pexels queries:`, queries);

        const [heroImg, aboutImg, featuresImg] = await Promise.all([
            searchPexels(queries.hero),
            searchPexels(queries.about),
            searchPexels(queries.features),
        ]);

        // Fallbacks that at least match the style mood
        const heroFallback = `https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1400`;
        const aboutFallback = `https://images.pexels.com/photos/4350057/pexels-photo-4350057.jpeg?auto=compress&cs=tinysrgb&w=900`;
        const featuresFallback = `https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1000`;

        const photos = {
            hero: heroImg ?? heroFallback,
            about: aboutImg ?? aboutFallback,
            features: featuresImg ?? featuresFallback,
        };

        console.log(`📸 hero: ${photos.hero.slice(0, 70)}`);

        const styleSection = styleGuide
            ? `\n## YOUR VISUAL STYLE BIBLE — FOLLOW THIS EXACTLY\nStyle key: "${styleKey}"\nDesign system: ${styleGuide}\nThis style must be applied EVERYWHERE — colors, fonts, spacing, shadows, borders, shapes, decorations, hero layout, card style. A reader should be able to identify the style at a glance.`
            : `\n## YOUR VISUAL STYLE BIBLE\nYou have full creative freedom. Choose a sophisticated, unique visual style that perfectly matches this specific business. Make it memorable and premium.`;

        const prompt = `You are a world-class UI/UX designer and senior frontend engineer.

Your mission: Create a visually STUNNING, complete, production-ready HTML landing page for the business below.
This is a demo page to impress a potential client — it must WOW them immediately.

## HARD RULES (never break these)
- Output ONLY valid HTML. Start with <!DOCTYPE html>. No markdown code fences.
- All text content must be in CROATIAN language.
- Do NOT use <img> src placeholders. Use the exact image URLs provided below.
- The page must be fully responsive (mobile 375px and desktop 1440px).
- No broken layouts, no text overflow, no overlapping elements.
- Every section must be complete and polished — no "lorem ipsum" or "[placeholder]".

## CDN STACK (load all of these)
\`\`\`html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Space+Grotesk:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Caveat:wght@400;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = { theme: { extend: { /* your custom colors/fonts here */ } } }</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
\`\`\`
- Use <i data-lucide="icon-name"></i> for icons, call lucide.createIcons() at end of body.
- GSAP ScrollTrigger: animate every section in (fade + slide-up, stagger children). Add number counter animations for stats.

## STOCK IMAGES — use these exact URLs, they are pre-selected to match the business and style
- HERO image: ${photos.hero}
- ABOUT / "O nama" image: ${photos.about}
- SERVICES / features image: ${photos.features}

Place images prominently. Use CSS object-fit: cover. Add a style-appropriate overlay for text readability.
${styleSection}

## BUSINESS INFORMATION
- Name: "${businessName}"
- Description: "${businessDescription}"

From the description, infer: industry, target audience, tone of voice, key services, and typical pricing.
Generate realistic, persuasive Croatian marketing copy — like a real copywriter wrote it.

## DESIGN FREEDOM — THIS IS KEY
You are NOT constrained to a fixed template. Based on the style guide above and the business type, YOU decide:
- What sections to include and in what order
- What layout each section uses (grid, flex, full-bleed, split, cards, masonry, etc.)
- What decorative elements to add (SVG shapes, gradients, textures, patterns)
- How typography is sized and weighted
- What micro-interactions and hover effects to add

REQUIRED sections (adapt their look to the style): navbar, hero, services/offers, about, testimonials, contact/CTA, footer.
OPTIONAL (add if they fit): stats bar, FAQ accordion, gallery, pricing table, process steps, team section.

## CONTENT QUALITY
- Write 3–5 unique services with realistic Croatian names and descriptions
- Write 3 testimonials with Croatian names (e.g. "Marija K., Zagreb"), star ratings ★★★★★, genuine-sounding quotes
- Write 2–3 FAQ items with real questions the target audience would ask
- Generate 3–4 impressive statistics (e.g. "200+ zadovoljnih klijenata", "5+ godina iskustva")
- Hero headline: bold, short (max 8 words), emotionally resonant for the target audience
- Hero subheadline: 1–2 sentences, persuasive, benefit-focused

## OUTPUT
Return ONLY the HTML document. Nothing else.`;

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 120000)
            ),
        ]) as any;

        const response = await result.response;
        let html: string = response.text();

        html = html.replace(/```html/gi, '').replace(/```/g, '').trim();

        if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
            return NextResponse.json(
                { error: 'AI nije generirao ispravnu stranicu. Pokušajte ponovno.' },
                { status: 500 }
            );
        }

        if (html.length > 300000) html = html.substring(0, 300000);

        console.log(`✅ Trial HTML: ${html.length} chars | "${businessName}"`);
        return NextResponse.json({ html });

    } catch (error: any) {
        console.error('❌ Trial generate error:', error);
        if (error.message === 'AI timeout') {
            return NextResponse.json(
                { error: 'Generiranje je predugo trajalo. Pokušajte ponovno.' },
                { status: 504 }
            );
        }
        return NextResponse.json(
            { error: 'Greška pri generiranju. Pokušajte ponovno.' },
            { status: 500 }
        );
    }
}
