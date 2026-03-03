'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateWithFallback } from '@/lib/gemini-with-fallback';
import { generatePageImages } from '@/lib/ai-images';
import { STYLES } from '@/lib/styles';
import { contentSchema, formatValidationErrors } from '@/lib/schemas';
import { injectContactFormScript } from '@/lib/contact-form-script';
import { logGeminiUsage } from '@/lib/gemini-usage';
import { extractDesignTokens } from '@/lib/extract-design-tokens';
import { buildReferenceImageParts, imageUrlToBase64 } from '@/lib/design-references';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// 1. INDUSTRY BLUEPRINTS — ideal macro-structure per business type
// ---------------------------------------------------------------------------
const INDUSTRY_BLUEPRINTS: Record<string, string[]> = {
    restoran: [
        'Hero with Reservation CTA',
        'Featured Menu (Grid)',
        'Chef / Story Section',
        'Ambiance Gallery',
        'Testimonials',
        'Location & Hours',
    ],
    majstor: [
        'Hero with Phone CTA',
        'Trust Badges / Certifications',
        'Services Bento Grid',
        'Before & After Gallery',
        'Testimonials',
        'Service Area Map',
    ],
    saas: [
        'Hero Split with App Screenshot',
        'Logo Cloud / Social Proof',
        'Bento Feature Grid',
        'How It Works Steps',
        'Pricing Cards',
        'FAQ',
        'Final CTA',
    ],
    nekretnine: [
        'Hero with Search / Filter CTA',
        'Featured Properties (Card Grid)',
        'Why Choose Us (Stats)',
        'Agent / Team Profiles',
        'Testimonials',
        'Contact Form with Map',
    ],
    salon: [
        'Hero with Booking CTA',
        'Services & Pricing List',
        'Before & After Gallery',
        'Meet the Team',
        'Client Reviews',
        'Location & Hours',
    ],
    teretana: [
        'Hero (Dynamic, energetic image) with "Join Now" CTA',
        'Membership Pricing Cards',
        'Class Schedule / Programs',
        'Trainers Grid',
        'Transformation Testimonials',
        'Location & Hours',
    ],
    fotograf: [
        'Hero (Full-screen portfolio image)',
        'Masonry Portfolio Gallery',
        'Services & Packages',
        'About the Photographer',
        'Client Testimonials',
        'Contact / Booking Form',
    ],
    zdravlje: [
        'Hero with Booking/Call CTA',
        'Trust Badges (Certifikati/Oprema)',
        'Our Team / Doctors (Cards)',
        'Services (List with icons)',
        'Patient Testimonials',
        'Location, Parking & Hours',
    ],
    turizam: [
        'Hero (Full screen stunning image) with "Book Now"',
        'Amenities Grid (Wi-Fi, Pool, Parking)',
        'Bento Gallery (Rooms/Exterior)',
        'Local Attractions (What is nearby)',
        'Location Map',
        'Contact/Booking Form',
    ],
    b2b: [
        'Hero Split with Value Proposition',
        'Client Logos (Social Proof)',
        'Services (Detailed Grid)',
        'Why Choose Us (Stats/ROI)',
        'Case Studies or Testimonials',
        'Lead Gen Contact Form',
    ],
    edukacija: [
        'Hero with "Upisi u tijeku" CTA',
        'Key Benefits (Why learn with us)',
        'Course Programs or Pricing Cards',
        'Meet the Instructors',
        'Success Rate / Student Reviews',
        'Enrollment Form',
    ],
    auto: [
        'Hero with Emergency Phone CTA',
        'Services Offered (Bento Grid)',
        'Brands We Service (Logos)',
        'Before/After or Workshop Gallery',
        'Location Map & Working Hours',
    ],
    default: [
        'Hero',
        'Social Proof Bar',
        'Key Benefits Grid',
        'Services Preview',
        'Testimonials',
        'Final CTA',
    ],
};

// ---------------------------------------------------------------------------
// 2. SECTION CATALOG — Tailwind layout patterns Gemini can choose from
// ---------------------------------------------------------------------------
const SECTION_CATALOG = [
    'HeroSplit',
    'HeroCentered',
    'HeroFullscreen',
    'BentoGridFeatures',
    'ZigZagContent',
    'MasonryGallery',
    'PricingCards',
    'TeamGrid',
    'InteractiveFAQ',
    'LogoCloud',
    'StatsBar',
    'TimelineSteps',
    'CardCarousel',
    'TestimonialSlider',
    'FullWidthCTA',
    'MapWithInfo',
    'BeforeAfterGallery',
    'FloatingNav',
] as const;

// ---------------------------------------------------------------------------
// 3. KEYWORD MAPPER — fuzzy-match user industry input to a blueprint key
// ---------------------------------------------------------------------------
function getIndustryBlueprintKey(userInput: string): string {
    const input = userInput.toLowerCase();

    const KEYWORD_MAP: [RegExp, string][] = [
        [/restoran|pizzeria|bistro|konoba|fast food|slastičarna|caffe|bar|pub|kafić|grill|sushi|burger|catering/, 'restoran'],
        [/majstor|vodoinstalater|električar|keramičar|krovište|klima|stolar|bravar|soboslikar|fasader|moler/, 'majstor'],
        [/stomatolog|zubar|poliklinika|doktor|psiholog|psihoterapeut|fizioterapeut|ordinacija|klinika|medicina|veterinar|optičar|ljekarna|farmac/, 'zdravlje'],
        [/apartman|vila|opg|smještaj|hotel|hostel|turizam|kamp|soba|kuća za odmor|pansion|agroturiz/, 'turizam'],
        [/knjigovodstvo|agencija|konzalting|savjetovanje|marketing|odvjetnik|javni bilježnik|prevodioc|prijevod|revizija|hr\b|outsourc/, 'b2b'],
        [/autoškola|tečaj|instrukcij|škola|edukacija|seminar|radionica|kurs|akademija/, 'edukacija'],
        [/mehaničar|vulkanizer|rent.a.car|autolimar|autopraonici|auto.servis|autopraonica|autokuća/, 'auto'],
        [/saas|software|aplikacija|startup|tech|fintech|crypto|web.app/, 'saas'],
        [/nekretnin|agencija za nekretnine|real.estate/, 'nekretnine'],
        [/salon|frizer|kozmetičar|pediker|manikur|beauty|spa|masaža|wellness/, 'salon'],
        [/teretana|fitness|gym|crossfit|pilates|yoga|trening/, 'teretana'],
        [/fotograf|videograf|snimanje|foto.studio|drone/, 'fotograf'],
    ];

    for (const [pattern, key] of KEYWORD_MAP) {
        if (pattern.test(input)) return key;
    }

    // Try direct key match
    if (INDUSTRY_BLUEPRINTS[input]) return input;

    return 'default';
}

/**
 * Generate the HOMEPAGE of a multi-page HTML website for Advanced plan projects.
 * Only the homepage is generated here — subpages are generated on demand via generate-subpage.ts.
 */
export async function generateAdvancedWebsiteAction(projectId: string, formData: any) {
    if (!GOOGLE_API_KEY) {
        return { error: 'AI sustav nije konfiguriran. Molimo kontaktirajte podršku.' };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: 'Niste prijavljeni.' };

    const validatedFields = contentSchema.safeParse(formData);
    if (!validatedFields.success) {
        return { error: formatValidationErrors(validatedFields.error) };
    }

    const data = validatedFields.data;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    if (project.hasGenerated) {
        return { error: 'Web stranica je već generirana. Možete samo spremiti izmjene podataka.' };
    }

    console.log(`🚀 Advanced homepage generation for: ${data.businessName} (${data.industry})`);

    try {
        // Update status to PROCESSING
        await prisma.project.update({
            where: { id: projectId },
            data: { contentData: data as any, status: "PROCESSING", name: data.businessName }
        });

        // Generate AI images
        const aiImages = await generatePageImages({
            businessName: data.businessName,
            businessDescription: data.description,
            industry: data.industry,
            styleKey: (data as any).styleKey || null,
        });

        // Style instructions
        const styleKey = (data as any).styleKey as string | null;
        const styleEntry = styleKey ? (STYLES as any)[styleKey] : null;
        const styleInstructions = styleEntry
            ? `DESIGN STYLE — apply strictly:\n${styleEntry.prompt}`
            : 'Use a modern, professional, visually impressive design. Be creative with layout.';

        // Color instructions
        const autoColors = (data as any).autoColors !== false;
        let colorInstruction = '';
        if (autoColors) {
            colorInstruction = `Choose premium, harmonious colors that fit the "${data.industry}" industry perfectly.`;
        } else {
            colorInstruction = `Primary brand color: ${data.primaryColor || '#22c55e'}.`;
            if (data.secondaryColor) colorInstruction += ` Secondary: ${data.secondaryColor}.`;
            if (data.backgroundColor) colorInstruction += ` Background: ${data.backgroundColor}.`;
            if (data.textColor) colorInstruction += ` Text: ${data.textColor}.`;
        }

        // CTA instructions
        let ctaInstruction = '';
        if (data.heroCta && data.heroCta.type) {
            const cta = data.heroCta as any;
            if (cta.type === 'contact') ctaInstruction = `Main CTA: link to /kontakt page. Label: "${cta.label || 'Kontaktirajte nas'}"`;
            else if (cta.type === 'phone') ctaInstruction = `Main CTA: tel:${data.phone}. Label: "${cta.label || 'Nazovite nas'}"`;
            else if (cta.type === 'email') ctaInstruction = `Main CTA: mailto:${data.email}. Label: "${cta.label || 'Pošaljite email'}"`;
            else if (cta.type === 'whatsapp') ctaInstruction = `Main CTA: https://wa.me/${(data.phone || '').replace(/[^0-9]/g, '')}. Label: "${cta.label || 'WhatsApp'}"`;
            else if (cta.type === 'link') ctaInstruction = `Main CTA: ${cta.url}. Label: "${cta.label || 'Saznaj više'}"`;
        } else {
            ctaInstruction = `Main CTA: link to /kontakt page. Label: "Kontaktirajte nas"`;
        }

        // Filter working hours
        const openHours = (data.workingHours || []).filter((h: any) => !h.closed);

        // Build clean data
        const cleanData: any = { ...data };
        ['testimonials', 'faq', 'gallery', 'pricing', 'workingHours'].forEach(key => {
            if (Array.isArray(cleanData[key]) && cleanData[key].length === 0) delete cleanData[key];
        });
        ['address', 'mapEmbed', 'secondaryColor', 'backgroundColor', 'textColor', 'metaTitle', 'metaDescription'].forEach(key => {
            if (!cleanData[key]) delete cleanData[key];
        });
        if (openHours.length > 0) cleanData.workingHours = openHours;
        else delete cleanData.workingHours;

        // Images
        const heroImg = data.heroImageUrl || aiImages.hero || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200';
        const aboutImg = data.aboutImageUrl || aiImages.about || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800';
        const servicesImg = data.featuresImageUrl || aiImages.services || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200';

        // Build services section instruction
        const servicesInstruction = data.services && data.services.length > 0
            ? `Use these services: ${JSON.stringify(data.services)}`
            : `Generate 4-6 relevant services for the "${data.industry}" industry with creative names and compelling descriptions.`;

        // Build optional sections
        const optionalSections: string[] = [];
        if (data.testimonials && data.testimonials.length > 0) optionalSections.push(`**Testimonials:** ${JSON.stringify(data.testimonials)} — display as attractive cards with star ratings`);
        if (data.faq && data.faq.length > 0) optionalSections.push(`**FAQ:** ${JSON.stringify(data.faq)} — render as interactive accordion (JS expand/collapse)`);
        if (data.gallery && data.gallery.length > 0) optionalSections.push(`**Gallery:** ${JSON.stringify(data.gallery)} — photo grid with lightbox effect`);
        if (data.pricing && data.pricing.length > 0) optionalSections.push(`**Pricing:** ${JSON.stringify(data.pricing)} — pricing cards, highlight featured tier`);

        // Resolve the dynamic industry blueprint
        const blueprintKey = getIndustryBlueprintKey(data.industry);
        const blueprint = INDUSTRY_BLUEPRINTS[blueprintKey];
        console.log(`📐 Blueprint: "${blueprintKey}" (${blueprint.length} sections) for industry input: "${data.industry}"`);

        const blueprintList = blueprint
            .map((section, i) => `${i + 1}. ${section}`)
            .join('\n');

        const prompt = `You are an elite frontend engineer and UI/UX designer.
Your task: Generate the HOMEPAGE of a multi-page business website as a single, complete HTML file.

## OUTPUT FORMAT
Return ONLY the raw HTML starting with <!DOCTYPE html>. No markdown code blocks. No explanations.

## TECHNICAL REQUIREMENTS
1. Complete, self-contained HTML file starting with <!DOCTYPE html>
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
   Configure Tailwind theme in a <script> tag. ${colorInstruction}
3. Use GSAP + ScrollTrigger via CDN for smooth scroll-triggered animations:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
4. Generate SEO meta title and description
5. Include Open Graph tags
6. All text in CROATIAN language

## NAVIGATION (very important!)
- Logo: ${data.logoUrl ? `<img src="${data.logoUrl}" alt="${data.businessName}">` : `"${data.businessName}" as text logo`}
- Nav links: ONLY "Početna" (href="/") — this is the only page that exists right now
- After "Početna", add an HTML comment <!-- NAV_LINKS --> — this is a placeholder where other page links will be injected later. Do NOT add any other nav links.
- CTA button in nav: ${ctaInstruction}
- Mobile hamburger menu (JS toggle) — must be fully responsive
- The homepage link should be visually highlighted/active in nav
- Make sure the nav is responsive: desktop shows horizontal links, mobile shows hamburger menu with slide-in panel

## FOOTER
- Business name, copyright with DYNAMIC year: use a <span> with id="currentYear" and a small inline <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script> so the year always updates automatically. Example: © <span id="currentYear"></span> ${data.businessName}
- Quick nav links: ONLY "/" (Početna) — then add <!-- FOOTER_NAV_LINKS --> placeholder comment for future pages
${data.phone ? `- Phone: ${data.phone}` : ''}
${data.email ? `- Email: ${data.email}` : ''}
${data.address ? `- Address: ${data.address}` : ''}
- Social links if provided
- At the very bottom of the footer, add: <a href="https://rent.webica.hr" target="_blank" rel="noopener noreferrer" class="text-sm opacity-60 hover:opacity-100 transition-opacity">Powered by Rent a webica</a>

## DESIGN SYSTEM
${styleInstructions}

## HOMEPAGE BLUEPRINT (required sections for "${data.industry}")
You MUST implement the following section structure in this exact order. This blueprint is specifically optimised for the "${data.industry}" industry — do NOT deviate from it:
${blueprintList}

${servicesInstruction}

## SECTION CATALOG (available layout patterns)
You have access to the following Tailwind CSS layout patterns: [${SECTION_CATALOG.join(', ')}].
Choose 5 to 7 patterns from this catalog that BEST execute the required blueprint above.
For example, if the blueprint requires a "Services Bento Grid", select the "BentoGridFeatures" pattern.
If it requires a "Hero with Phone CTA", choose between "HeroSplit", "HeroCentered", or "HeroFullscreen" based on what fits the industry best.
Do NOT use the same pattern twice. Create visual variety.

## IMAGES
- logoUrl: ${data.logoUrl || 'none'}
- heroImageUrl: ${heroImg}
- aboutImageUrl: ${aboutImg}
- servicesImageUrl: ${servicesImg}

${optionalSections.length > 0 ? '## PROVIDED DATA\n' + optionalSections.join('\n\n') : ''}

## COPYWRITING RULES
- ALL text in Croatian (Hrvatski)
- Benefit-driven headlines, not feature-driven
- Short paragraphs (2-3 sentences max)
- Industry-adapted messaging for ${data.industry}
- Generate realistic Croatian stats (e.g. "15+ godina iskustva", "500+ projekata")

## BUSINESS DATA
${JSON.stringify(cleanData, null, 2)}

CRITICAL: Return ONLY the raw HTML. No markdown, no code blocks, no explanations.`;

        // Fetch design reference images for multimodal prompt
        const { imageParts: referenceImageParts } = await buildReferenceImageParts(data.industry);

        // If user provided a design reference URL, try to include it as an image too
        const userRefUrl = (data as any).designReferenceUrl;
        if (userRefUrl) {
            try {
                const userRefImg = await imageUrlToBase64(userRefUrl);
                if (userRefImg) {
                    referenceImageParts.push({ inlineData: userRefImg });
                    console.log(`📸 Added user's reference URL image: ${userRefUrl}`);
                }
            } catch (e) {
                console.warn('Could not fetch user reference URL:', e);
            }
        }

        // Generation with retry loop
        let generatedHtml: string | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            console.log(`🤖 Advanced homepage generation attempt ${attempt}/${MAX_RETRIES}...`);

            try {
                // Build multimodal content with design reference images
                const contentParts: any[] = [];

                // Add reference images (fetched before the retry loop would be better,
                // but kept simple here since they're cached in memory)
                if (referenceImageParts.length > 0) {
                    contentParts.push(...referenceImageParts);
                    contentParts.push({
                        text: `REFERENCE IMAGE ANALYSIS — CRITICAL INSTRUCTIONS:
One or more reference images are attached above. DO NOT just use them for color or vibe.

Deeply analyze the MACRO-STRUCTURE and GEOMETRIC LAYOUT of each reference:
- Is the Hero section split 50/50, centered, or full-screen?
- Are there overlapping cards, layered sections, or offset grids?
- Is the navigation floating, sticky, transparent, or solid?
- How is whitespace distributed — tight and dense, or airy and spacious?
- What is the visual rhythm — alternating wide/narrow sections, asymmetric columns?

REPLICATE the exact layout geometry, whitespace proportions, structural composition,
and section flow of the reference image(s) using Tailwind CSS classes.
Populate the replicated structure with the client's actual business data.
The final page should feel like a structural twin of the reference, NOT a color copy.
Each section must match the spatial composition of what is shown in the reference.`
                    });
                }

                contentParts.push({ text: prompt });

                const { response, modelUsed } = await generateWithFallback(contentParts, {
                    timeoutMs: 180000,
                    fallbackTimeoutMs: 240000,
                });

                let text = response.text();

                if (response.usageMetadata) {
                    logGeminiUsage({
                        type: 'generate_advanced_homepage',
                        model: modelUsed,
                        tokensInput: response.usageMetadata.promptTokenCount || 0,
                        tokensOutput: response.usageMetadata.candidatesTokenCount || 0,
                    });
                }

                console.log(`✅ Gemini returned ${text.length} characters`);

                // Clean response
                text = text.replace(/```html\s*/g, '').replace(/```\s*/g, '').trim();

                // Validate it contains HTML
                if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
                    console.error(`❌ Attempt ${attempt}: No HTML found`);
                    if (attempt === MAX_RETRIES) throw new Error('AI nije vratio ispravan HTML format.');
                    continue;
                }

                // Extract the HTML
                const htmlMatch = text.match(/<!DOCTYPE[\s\S]*/i);
                generatedHtml = htmlMatch ? htmlMatch[0] : text;
                console.log(`✅ Successfully extracted homepage HTML (${generatedHtml.length} chars)`);
                break;

            } catch (parseError: any) {
                if (parseError.message === 'AI timeout') throw parseError;
                console.error(`❌ Attempt ${attempt} error:`, parseError.message);
                if (attempt === MAX_RETRIES) throw parseError;
            }
        }

        if (!generatedHtml) {
            throw new Error('Generiranje nije uspjelo nakon svih pokušaja.');
        }

        // Inject contact form script
        const homeHtml = injectContactFormScript(generatedHtml, projectId);

        // Extract design tokens for subpage consistency
        const designTokens = extractDesignTokens(homeHtml);
        console.log(`🎨 Extracted design tokens: ${Object.keys(designTokens.colors).filter(k => designTokens.colors[k]).length} colors, fonts: [${designTokens.fonts.heading}, ${designTokens.fonts.body}]`);

        // Save to database (only homepage, no subpages yet)
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: homeHtml,
                contentData: { ...data, designTokens } as any,
                status: "GENERATED",
                name: data.businessName,
                hasGenerated: true,
                aiVersion: { increment: 1 },
            }
        });

        console.log(`✅ Advanced project ${projectId} homepage saved`);

        revalidatePath(`/dashboard/projects/${projectId}/content`);
        revalidatePath('/dashboard');
        return { success: true };

    } catch (error: any) {
        console.error("❌ Advanced Generation Error:", error);

        await prisma.project.update({
            where: { id: projectId },
            data: { status: "DRAFT" }
        });

        if (error.message === 'AI timeout') {
            return { error: 'AI generiranje je predugo trajalo. Molimo pokušajte ponovno.' };
        }
        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            return { error: 'AI servis je trenutno preopterećen. Pokušajte za nekoliko minuta.' };
        }

        return { error: error.message || 'Neuspješno generiranje web stranice.' };
    }
}
