

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT = 5; // max requests per IP per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
    const now = Date.now();
    const key = `generate:${ip}`;
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.windowStart > RATE_WINDOW) {
        rateLimitMap.set(key, { windowStart: now, count: 1 });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

export async function POST(req) {
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
            return NextResponse.json(
                { error: 'AI sustav nije konfiguriran.' },
                { status: 500 }
            );
        }

        const { businessName, businessDescription } = await req.json();

        if (!businessName || !businessDescription) {
            return NextResponse.json(
                { error: 'Naziv i opis biznisa su obavezni.' },
                { status: 400 }
            );
        }

        if (businessName.length > 100 || businessDescription.length > 1000) {
            return NextResponse.json(
                { error: 'Tekst je predugačak.' },
                { status: 400 }
            );
        }

        console.log(`🆓 Trial generate: "${businessName}"`);

        const prompt = `
You are an AWARD-WINNING Frontend Engineer and UI/UX Designer known for creating visually STUNNING websites.
Generate a SINGLE, self-contained HTML file for a modern, premium landing page that will WOW anyone who sees it.

**TECHNICAL STACK (load ALL via CDN):**
1. **Tailwind CSS**: <script src="https://cdn.tailwindcss.com"></script>
   - Configure a custom theme with brand-appropriate colors in a <script> block
2. **GSAP + ScrollTrigger** for rich animations:
   - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
3. **Lucide Icons** for beautiful, consistent iconography:
   - <script src="https://unpkg.com/lucide@latest"></script>
   - Use icons like: <i data-lucide="arrow-right"></i> and call lucide.createIcons() at the end
4. **Google Fonts** — Load "Inter" for body and "Space Grotesk" or "Sora" for headings:
   - <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">

**⚠️ CRITICAL — NO IMAGES:**
- Do NOT use any <img> tags or background-image URLs
- Do NOT reference Unsplash, Pexels, or any external images
- Instead, create visual interest with:
  • CSS gradients (mesh gradients, linear, radial, conic)
  • SVG geometric shapes, blobs, and abstract patterns (inline SVG)
  • Animated gradient orbs/blurs as background decorations
  • Icon compositions using Lucide icons
  • CSS-only decorative elements (borders, shadows, blur effects)

**CONTENT:**
- Business Name: "${businessName}"
- Business Description: "${businessDescription}"
- ALL text MUST be in Croatian language

**SECTIONS TO GENERATE:**
1. **Navbar**: Sticky, glassmorphism (backdrop-blur), business name as text logo, nav links, primary CTA button
2. **Hero**: 
   - Large bold headline with gradient text effect or animated text reveal
   - Compelling subheadline
   - Two CTA buttons (primary filled + secondary outline)
   - Abstract decorative SVG shapes or animated gradient orbs in background
   - Subtle grid/dot pattern overlay
3. **About / O nama**: Split layout, compelling copy, decorative accent elements
4. **Services/Features**: 3-4 cards with Lucide icons, hover lift effects, subtle borders
5. **Stats/Numbers**: Animated counters (use GSAP ScrollTrigger), e.g. "500+ klijenata", "10+ godina"
6. **Testimonials**: 2-3 testimonials with Croatian names, star ratings (★), card design with subtle shadows
7. **CTA Section**: Full-width gradient background, strong call-to-action
8. **Contact**: Contact form (Name, Email, Message), display email/phone with icons
9. **Footer**: Business name, links, copyright, social icons

**DESIGN REQUIREMENTS (THIS IS CRITICAL):**
- **Color**: Choose a sophisticated, industry-appropriate palette. Use HSL colors for harmony. Dark sections alternating with light sections for contrast.
- **Typography**: Inter for body (16px base), Space Grotesk for headings. Generous line height.
- **Spacing**: Lots of whitespace. py-20 to py-32 for sections. Breathable layouts.
- **Cards**: Subtle borders (border-gray-200/10), soft shadows, rounded-2xl, hover:scale-[1.02] transitions
- **Buttons**: Rounded-full or rounded-xl, with hover animations and transitions
- **Background effects**: Use CSS blur blobs (absolute positioned divs with blur-3xl and gradient backgrounds, opacity-20) for visual depth
- **Animations** (GSAP): 
  • Fade-up on scroll for every section (stagger children)
  • Text reveal animations for hero headline
  • Scale-in for cards
  • Counter animations for stats
  • Smooth parallax-like effects
- **Responsive**: Mobile-first, looks perfect on all screen sizes
- **Premium feel**: The page should look like it was designed by a top-tier agency

**OUTPUT:** ONLY the complete HTML document. No explanations, no markdown.
`;

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 90000)
            )
        ]) as any;

        const response = await result.response;
        let html = response.text();

        // Clean up
        html = html.replace(/```html/g, '').replace(/```/g, '').trim();

        if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
            return NextResponse.json(
                { error: 'AI nije generirao ispravnu stranicu. Pokušajte ponovno.' },
                { status: 500 }
            );
        }

        // Cap size
        if (html.length > 200000) {
            html = html.substring(0, 200000);
        }

        console.log(`✅ Trial generated: ${html.length} chars for "${businessName}"`);

        return NextResponse.json({ html });

    } catch (error) {
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
