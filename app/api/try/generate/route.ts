import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
// Use same model as main generator
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-pro-exp-03-25' }) : null;

// Simple in-memory rate limiting
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

// Fetch best stock image for a query (Pexels → Unsplash → static fallback)
async function fetchStockImage(query: string, fallback: string): Promise<string> {
    const PEXELS_KEY = process.env.PEXELS_API_KEY;
    const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

    if (PEXELS_KEY) {
        try {
            const r = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
                { headers: { Authorization: PEXELS_KEY } }
            );
            if (r.ok) {
                const d = await r.json();
                if (d.photos?.[0]?.src?.large2x) return d.photos[0].src.large2x;
            }
        } catch { /* fall through */ }
    }

    if (UNSPLASH_KEY) {
        try {
            const r = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
                { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
            );
            if (r.ok) {
                const d = await r.json();
                if (d.results?.[0]?.urls?.regular) return d.results[0].urls.regular;
            }
        } catch { /* fall through */ }
    }

    return fallback;
}

// Style prompt keywords map
const STYLE_PROMPTS: Record<string, string> = {
    bento: 'Use a Bento grid layout, soft rounded corners (rounded-2xl), subtle drop shadows, glassmorphism effects (backdrop-blur), minimalist Apple-like aesthetic, lots of whitespace.',
    dark_web3: 'Strictly dark mode (bg-slate-950), glowing gradients (bg-gradient-to-r), neon accent colors (cyan or purple), tech-focused, high contrast.',
    neo_brutalism: 'Neo-brutalist style, hard black shadows (shadow-[4px_4px_0px_black]), thick solid borders (border-2 border-black), bold punchy colors (yellow, pink, blue), aggressive and playful.',
    corporate: 'Highly professional, trustworthy corporate design, strictly blue and slate color palette, structured grid, crisp edges, no playful elements.',
    glassmorphism: 'Glassmorphism UI, frosted glass cards (bg-white/10 backdrop-blur-md), blurred colorful blobs in the background, semi-transparent borders.',
    editorial: 'Editorial magazine layout, elegant Serif typography (e.g., Playfair Display) for large headings, asymmetrical grids, prominent pull quotes.',
    typography_first: 'Typography-centric design, massive oversized headings, minimal to zero images, brutalist font choices, tight tracking (tracking-tighter).',
    playful: 'Playful and friendly app aesthetic, fully rounded buttons (rounded-full), vibrant primary colors, soft bouncy UI, minimal borders.',
    cyberpunk: 'Cyberpunk aesthetic, pitch black background, neon green or magenta text, monospaced typography (font-mono), grid lines, terminal-like UI.',
    retro: 'Retro 90s aesthetic, warm sepia undertones, classic serif fonts, slightly muted color palette, textured or grainy background feel.',
    luxury: 'Ultra-luxury high-end aesthetic, extremely minimalist, black, white, and gold/silver accents, elegant serif fonts, massive whitespace (p-24).',
    organic: 'Organic and earthy vibe, soft pastel colors (sage green, sand, terracotta), heavily rounded image corners, nature-inspired, calm.',
    monochrome: 'Strictly monochromatic, black and white only, rely entirely on font weights and spacing for visual hierarchy, sharp and architectural.',
    neumorphism: 'Neumorphic soft UI, very low contrast, elements look extruded from the background, inset shadows, soft gray-blue palette.',
    scandinavian: 'Scandinavian minimalism, extremely clean, off-white backgrounds (bg-stone-50), highly functional, sans-serif only, airy.',
    industrial: 'Industrial blueprint style, visible grid background, technical monospaced fonts, slate and steel blue colors.',
    ecommerce: 'E-commerce focused, extremely clear product cards, highly visible and contrasting CTA buttons, urgency elements, clean pricing tables.',
    portfolio: 'Visual-first portfolio, masonry image grid, hidden or minimal navigation, focus entirely on imagery, dark background to make photos pop.',
    material: 'Material design principles, distinct overlapping layers with clear drop shadows (shadow-md, shadow-lg), flat vibrant accent colors.',
    handmade: 'Handmade scrapbook feel, slightly rotated images (-rotate-2), overlapping cards, playful handwritten-style fonts for accents, casual vibe.',
};

export async function POST(req: Request) {
    try {
        // Rate limiting
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

        const styleInstruction = styleKey && STYLE_PROMPTS[styleKey]
            ? `\n**VISUAL STYLE — CRITICAL (apply this THROUGHOUT the ENTIRE design, every section):**\n${STYLE_PROMPTS[styleKey]}`
            : '';

        console.log(`� Trial generate | style: ${styleKey ?? 'AI decides'} | "${businessName}"`);

        // Fetch stock images in parallel based on business description keywords
        const descWords = businessDescription.toLowerCase().split(/\s+/).slice(0, 4).join(' ');
        const [heroImg, aboutImg, featuresImg] = await Promise.all([
            fetchStockImage(`${descWords} professional hero`, `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&auto=format&fit=crop`),
            fetchStockImage(`${descWords} team office`, `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&auto=format&fit=crop`),
            fetchStockImage(`${descWords} modern work`, `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop`),
        ]);

        console.log(`📸 Stock images: hero=${heroImg.slice(0, 60)}...`);

        const prompt = `
You are a Senior Frontend Engineer and UI/UX Designer creating a PREMIUM landing page.
Your task: Generate a SINGLE, complete, self-contained HTML file based on the business information below.
This is a preview for a potential client — it must look STUNNING and PROFESSIONAL.

**TECHNICAL REQUIREMENTS:**
1. **Output:** Return ONLY valid HTML. Start with <!DOCTYPE html>. Do NOT wrap in markdown code blocks.
2. **Tailwind CSS** via CDN:
   <script src="https://cdn.tailwindcss.com"></script>
   Configure a custom Tailwind theme in a <script> block with industry-appropriate brand colors.
3. **GSAP + ScrollTrigger** via CDN for animations:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
   Apply scroll-triggered fade-in, slide-up, and stagger animations to every section.
   Add counter animations for statistics using GSAP ScrollTrigger.
4. **Lucide Icons** via CDN:
   <script src="https://unpkg.com/lucide@latest"></script>
   Use <i data-lucide="icon-name"></i> and call lucide.createIcons() at end of body.
5. **Google Fonts:** Load Inter (body) and Space Grotesk or Sora (headings).
6. **Stock Images — USE THESE EXACT URLs:**
   - Hero background: ${heroImg}
   - About section image: ${aboutImg}
   - Features/Services section: ${featuresImg}
   Place each image using a regular <img> tag or as a CSS background-image.
   Always add a semi-transparent overlay on top of background images for text legibility.
   Images MUST be visible and prominent in the design — don't hide them.
7. **SEO:** Include <title>, <meta name="description">, and Open Graph tags.
8. **Responsiveness:** Mobile-first. The site must look perfect on mobile (375px) and desktop (1440px).

**BUSINESS INFORMATION:**
- Business Name: "${businessName}"
- Description: "${businessDescription}"
- All text content MUST be written in Croatian language.
- Infer the industry, tone, and target audience from the description. Generate appropriate fake-but-realistic content (services, pricing, testimonials, statistics).

**SECTIONS TO GENERATE:**
1. **Navbar:** Sticky, glassmorphism (backdrop-blur + bg-white/10), logo text, nav links (Usluge, O nama, Kontakt), CTA button.
2. **Hero:** Full-viewport height, background image with dark overlay, large bold heading with gradient text, compelling 2-line subheadline, two CTA buttons (primary + outline ghost), animated scroll indicator.
3. **Stats Bar:** 3–4 impressive statistics with animated counters (e.g. "500+ klijenata", "10+ godina iskustva"). Dark contrasting background.
4. **About / O nama:** Two-column layout — compelling long-form copy on left, about image on right. Include a small badge/pill "Zašto mi?".
5. **Services / Usluge:** 3–4 service cards with Lucide icon, name, description, price hint, hover lift effect. Use features image as a background accent.
6. **Testimonials:** 3 realistic testimonials with Croatian names, star ratings (★★★★★), short quote, role/location. Card layout with subtle shadow.
7. **FAQ:** 3–4 relevant questions with expandable accordion (vanilla JS toggle).
8. **CTA Section:** Full-width gradient band, bold headline, subtext, prominent "Kontaktirajte nas" button.
9. **Contact Form:** Name, Email, Phone, Message fields + submit button (non-functional). Display business email and phone as text.
10. **Footer:** Business name, short tagline, nav links, contact info, copyright line, social icons (Lucide).

**DESIGN EXCELLENCE — NON-NEGOTIABLE:**
- Sophisticated, industry-appropriate color palette using HSL harmony
- Generous whitespace (py-20 to py-32 for sections)
- Cards with rounded-2xl, subtle borders, hover:scale-[1.02] transitions
- Smooth CSS transitions on all interactive elements
- Decorative CSS blur blobs (absolute, blur-3xl, opacity-20) as background accents
- The page must look like it was built by a top-tier €5000+ agency${styleInstruction}

**OUTPUT:** ONLY the complete HTML document. No explanations, no markdown.
`;

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 120000)
            ),
        ]) as any;

        const response = await result.response;
        let html: string = response.text();

        // Clean up markdown wrappers if model adds them
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
