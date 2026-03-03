'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { STYLES } from '@/lib/styles';
import { injectContactFormScript } from '@/lib/contact-form-script';
import { generateWithFallback } from '@/lib/gemini-with-fallback';
import { logGeminiUsage } from '@/lib/gemini-usage';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const MAX_RETRIES = 2;

const SUBPAGE_CONFIG: Record<string, { title: string; prompt: string }> = {
    'o-nama': {
        title: 'O nama',
        prompt: `Generate the ABOUT US page ("O nama").
This page should contain:
1. Business story section with about image
2. Mission and values (3-4 values with icons)
3. Team/experience section with stats
4. Gallery section if gallery data provided
5. Testimonials if provided
6. Final CTA section`,
    },
    'usluge': {
        title: 'Usluge',
        prompt: `Generate the SERVICES page ("Usluge").
This page should contain:
1. Services hero with compelling headline
2. Detailed service cards (each with name, description, icon/image)
3. Services background image for visual impact
4. Pricing section if pricing data provided
5. Full FAQ accordion if FAQ data provided
6. Final CTA section`,
    },
    'kontakt': {
        title: 'Kontakt',
        prompt: `Generate the CONTACT page ("Kontakt").
This page should contain:
1. Contact hero with headline
2. Contact form that submits via JavaScript fetch()
3. Contact info cards (phone, email, address)
4. Google Maps embed if mapEmbed provided
5. Working hours table if working hours provided
6. Final section`,
    },
};

/**
 * Generate a single subpage for an Advanced plan project.
 * Uses the homepage HTML as design reference to match styles.
 */
export async function generateSubpageAction(projectId: string, pageSlug: string) {
    if (!GOOGLE_API_KEY) {
        return { error: 'AI sustav nije konfiguriran.' };
    }

    const config = SUBPAGE_CONFIG[pageSlug];
    if (!config) {
        return { error: `Nepoznata stranica: ${pageSlug}` };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: 'Niste prijavljeni.' };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    if (!project.generatedHtml) {
        return { error: 'Prvo generirajte naslovnu stranicu.' };
    }

    // Check if this is a regeneration (subpage already exists)
    const existingReactFiles = (project.reactFiles as Record<string, string>) || {};
    const isRegeneration = !!existingReactFiles[pageSlug];
    const REGEN_TOKEN_COST = 500;

    if (isRegeneration) {
        // Check user token balance
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { editorTokens: true },
        });
        const userTokens = user?.editorTokens ?? 0;
        if (userTokens < REGEN_TOKEN_COST) {
            return {
                error: `Nemate dovoljno tokena za regeneriranje. Potrebno: ${REGEN_TOKEN_COST}, Preostalo: ${userTokens}`,
                insufficientTokens: true,
                tokensNeeded: REGEN_TOKEN_COST,
                tokensRemaining: userTokens,
            };
        }
    }

    const data = (project.contentData as any) || {};

    console.log(`🚀 Generating subpage "${pageSlug}" for project ${projectId}`);

    try {
        // Style instructions
        const styleKey = data.styleKey as string | null;
        const styleEntry = styleKey ? (STYLES as any)[styleKey] : null;

        // Extract key design elements from homepage for reference
        const homepageRef = project.generatedHtml;

        // Get design tokens for consistency
        const designTokens = (data as any).designTokens;
        const tokensSection = designTokens ? `
## DESIGN TOKENS — You MUST match these EXACTLY:
\`\`\`json
${JSON.stringify({
            colors: designTokens.colors,
            fonts: designTokens.fonts,
            borderRadius: designTokens.borderRadius,
        }, null, 2)}
\`\`\`
${designTokens.tailwindConfig ? `
## TAILWIND CONFIG — Copy this EXACTLY:
\`\`\`
${designTokens.tailwindConfig}
\`\`\`` : ''}
` : '';

        // Build contextual data
        const heroImg = data.heroImageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200';
        const aboutImg = data.aboutImageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800';
        const servicesImg = data.featuresImageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200';
        const openHours = (data.workingHours || []).filter((h: any) => !h.closed);

        // CTA
        let ctaInstruction = '';
        if (data.heroCta && data.heroCta.type) {
            const cta = data.heroCta as any;
            if (cta.type === 'contact') ctaInstruction = `CTA: link to /kontakt. Label: "${cta.label || 'Kontaktirajte nas'}"`;
            else if (cta.type === 'phone') ctaInstruction = `CTA: tel:${data.phone}. Label: "${cta.label || 'Nazovite nas'}"`;
            else if (cta.type === 'email') ctaInstruction = `CTA: mailto:${data.email}. Label: "${cta.label || 'Pošaljite email'}"`;
            else ctaInstruction = `CTA: link to /kontakt. Label: "Kontaktirajte nas"`;
        }

        // Optional sections
        const extras: string[] = [];
        if (data.services && data.services.length > 0) extras.push(`Services: ${JSON.stringify(data.services)}`);
        if (data.testimonials && data.testimonials.length > 0) extras.push(`Testimonials: ${JSON.stringify(data.testimonials)}`);
        if (data.faq && data.faq.length > 0) extras.push(`FAQ: ${JSON.stringify(data.faq)}`);
        if (data.gallery && data.gallery.length > 0) extras.push(`Gallery: ${JSON.stringify(data.gallery)}`);
        if (data.pricing && data.pricing.length > 0) extras.push(`Pricing: ${JSON.stringify(data.pricing)}`);

        const contactFormInstruction = pageSlug === 'kontakt' ? `
## CONTACT FORM
The contact form MUST submit via JavaScript fetch() to: https://webica.hr/api/site/${projectId}/contact
The form MUST:
- POST JSON with fields: name, email, phone, message, _gotcha (honeypot)
- Include hidden honeypot field: <input type="text" name="_gotcha" style="display:none!important" tabindex="-1" autocomplete="off">
- On submit: disable button, show "Slanje..."
- On success: replace form with "✓ Hvala! Javit ćemo vam se uskoro."
- On error: show "Greška pri slanju. Pokušajte ponovno."
` : '';

        const prompt = `You are an elite frontend engineer and UI/UX designer.
Your task: Generate a SINGLE SUBPAGE that matches the design of an existing homepage.

## OUTPUT FORMAT
Return ONLY the raw HTML starting with <!DOCTYPE html>. No markdown code blocks. No explanations.

## REFERENCE: COMPLETE HOMEPAGE HTML — Match this design EXACTLY
\`\`\`html
${homepageRef}
\`\`\`

${tokensSection}

## CRITICAL: You MUST use the EXACT SAME design system as the homepage:
- Same Tailwind config / theme colors
- Same fonts
- Same button styles
- Same navigation structure (copy verbatim from homepage)
- Same footer (copy verbatim from homepage)
- Same GSAP animations pattern

## TECHNICAL REQUIREMENTS
1. Complete, self-contained HTML file starting with <!DOCTYPE html>
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use GSAP + ScrollTrigger via CDN
4. All text in CROATIAN language
5. SEO meta title and description for this specific page

## NAVIGATION (copy from homepage VERBATIM)
- Copy the EXACT same nav/header structure from the homepage HTML above
- Same logo, same links, same mobile hamburger menu
- Keep <!-- NAV_LINKS --> placeholder if present in the homepage nav
- Highlight "${config.title}" as active page if its link exists

## FOOTER (copy from homepage VERBATIM)
- Copy the EXACT same footer from the homepage HTML above
- Keep <!-- FOOTER_NAV_LINKS --> placeholder if present

## PAGE CONTENT
${config.prompt}

${contactFormInstruction}

## BUSINESS DATA
- Business name: ${data.businessName}
- Industry: ${data.industry}
- Description: ${data.description}
${data.phone ? `- Phone: ${data.phone}` : ''}
${data.email ? `- Email: ${data.email}` : ''}
${data.address ? `- Address: ${data.address}` : ''}
${data.mapEmbed ? `- Google Maps: <iframe src="${data.mapEmbed}" width="100%" height="400" style="border:0;border-radius:1rem" allowFullScreen loading="lazy"></iframe>` : ''}
${openHours.length > 0 ? `- Working hours: ${JSON.stringify(openHours)}` : ''}

## IMAGES
- heroImageUrl: ${heroImg}
- aboutImageUrl: ${aboutImg}
- servicesImageUrl: ${servicesImg}
${data.logoUrl ? `- logoUrl: ${data.logoUrl}` : ''}

${extras.length > 0 ? '## DATA\n' + extras.join('\n') : ''}

${ctaInstruction}

CRITICAL: Return ONLY the raw HTML. Match the homepage design EXACTLY. No markdown, no code blocks.`;

        let generatedHtml: string | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            console.log(`🤖 Subpage "${pageSlug}" generation attempt ${attempt}/${MAX_RETRIES}...`);

            try {
                const { response, modelUsed } = await generateWithFallback(prompt, {
                    timeoutMs: 120000,
                });

                let text = response.text();

                if (response.usageMetadata) {
                    logGeminiUsage({
                        type: `generate_subpage_${pageSlug}`,
                        model: modelUsed,
                        tokensInput: response.usageMetadata.promptTokenCount || 0,
                        tokensOutput: response.usageMetadata.candidatesTokenCount || 0,
                    });
                }

                // Clean response
                text = text.replace(/```html\s*/g, '').replace(/```\s*/g, '').trim();

                if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
                    console.error(`❌ Attempt ${attempt}: No HTML found`);
                    if (attempt === MAX_RETRIES) throw new Error('AI nije vratio ispravan HTML format.');
                    continue;
                }

                const htmlMatch = text.match(/<!DOCTYPE[\s\S]*/i);
                generatedHtml = htmlMatch ? htmlMatch[0] : text;
                console.log(`✅ Successfully extracted "${pageSlug}" HTML (${generatedHtml.length} chars)`);
                break;

            } catch (parseError: any) {
                if (parseError.message === 'AI timeout') throw parseError;
                console.error(`❌ Attempt ${attempt} error:`, parseError.message);
                if (attempt === MAX_RETRIES) throw parseError;
            }
        }

        if (!generatedHtml) {
            throw new Error('Generiranje nije uspjelo.');
        }

        // Inject contact form script for kontakt page
        if (pageSlug === 'kontakt') {
            generatedHtml = injectContactFormScript(generatedHtml, projectId);
        }

        // Save subpage to reactFiles
        const existingSubpages = (project.reactFiles as Record<string, string>) || {};
        const updatedSubpages = { ...existingSubpages, [pageSlug]: generatedHtml };

        await prisma.project.update({
            where: { id: projectId },
            data: { reactFiles: updatedSubpages }
        });

        console.log(`✅ Subpage "${pageSlug}" saved for project ${projectId}`);

        // Deduct tokens for regeneration
        if (isRegeneration) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    editorTokens: { decrement: REGEN_TOKEN_COST },
                    editorTokensUsed: { increment: REGEN_TOKEN_COST },
                },
            });
            console.log(`💰 Deducted ${REGEN_TOKEN_COST} tokens for subpage regeneration`);
        }

        revalidatePath(`/dashboard/projects/${projectId}/content`);
        return { success: true };

    } catch (error: any) {
        console.error(`❌ Subpage "${pageSlug}" generation error:`, error);

        if (error.message === 'AI timeout') {
            return { error: 'Generiranje je predugo trajalo. Pokušajte ponovno.' };
        }
        return { error: error.message || 'Neuspješno generiranje podstranice.' };
    }
}


// ─── Section Prompt Fragments ────────────────────────────────────────────────
const SECTION_PROMPTS: Record<string, string> = {
    hero: 'Hero section with a compelling headline, subtitle, and optional CTA button. Full-width with background image or gradient.',
    features: 'Features section with 3-6 icon cards arranged in a grid. Each card has an icon, title, and short description.',
    pricing: 'Pricing section with 3-4 pricing cards in columns. Highlight one as "Most Popular". Each card: plan name, price, feature list, CTA button.',
    gallery: 'Image gallery in a masonry or grid layout. Show images from the gallery data if available, otherwise use relevant stock photos.',
    team: 'Team section with member cards in a grid. Each card: photo placeholder (use initials if no image), name, title/role, and short bio.',
    faq: 'FAQ section with accordion/collapsible items. Use FAQ data if available, otherwise generate 5-7 relevant questions and answers.',
    testimonials: 'Testimonials section with client review cards. Show rating stars, client name, role, and their quote. Use testimonials data if available.',
    stats: 'Statistics/numbers section with 3-4 large animated counters. Examples: years of experience, satisfied clients, completed projects, etc.',
    contact_form: `Contact form section. The form MUST submit via JavaScript fetch() to the project's contact API endpoint. Fields: name, email, phone, message. Include hidden honeypot field.`,
    cta: 'Final call-to-action section with a compelling headline, short text, and a prominent CTA button. Use contrasting background color.',
    process: 'How-it-works section with 3-5 numbered steps. Each step has an icon/number, title, and description. Connected with lines or arrows.',
    case_studies: 'Case studies section with project cards. Each card: project image, client name, challenge, solution, and results/ROI.',
    text_block: 'Long-form text content section with narrow container, left-aligned text, clear subheadings (h2, h3), and proper paragraph spacing. Suitable for legal pages.',
    map_location: 'Location section with Google Maps embed (if mapEmbed URL available) and address/contact info card beside it. Include working hours if available.',
    before_after: 'Before/After comparison section with side-by-side images or slider. Great for showing transformation results.',
    booking: 'Booking/reservation form section. Large form with fields: name, email, phone, service selection dropdown, preferred date, preferred time, and notes. Submit via fetch() like contact form.',
    logo_cloud: 'Client logos section showing a row of partner/client logos. Use placeholder logos with company initials if no data available.',
};


/**
 * Generate a CUSTOM subpage with user-defined title and sections.
 */
export async function generateCustomSubpageAction(
    projectId: string,
    opts: { title: string; slug: string; sections: string[] }
) {
    if (!GOOGLE_API_KEY) {
        return { error: 'AI sustav nije konfiguriran.' };
    }

    const { title, slug, sections } = opts;
    if (!title || !slug || !sections.length) {
        return { error: 'Naslov i barem jedna sekcija su obavezni.' };
    }

    // Validate slug format
    const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
    if (!safeSlug) return { error: 'Neispravan slug.' };

    // Block predefined slugs from being overwritten
    if (SUBPAGE_CONFIG[safeSlug]) {
        return { error: 'Ovaj slug je rezerviran za predefiniranu podstranicu.' };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: 'Niste prijavljeni.' };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    if (!project.generatedHtml) {
        return { error: 'Prvo generirajte naslovnu stranicu.' };
    }

    // Check if this is a regeneration
    const existingReactFiles = (project.reactFiles as Record<string, string>) || {};
    const isRegeneration = !!existingReactFiles[safeSlug];
    const REGEN_TOKEN_COST = 500;

    if (isRegeneration) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { editorTokens: true },
        });
        const userTokens = user?.editorTokens ?? 0;
        if (userTokens < REGEN_TOKEN_COST) {
            return {
                error: `Nemate dovoljno tokena za regeneriranje. Potrebno: ${REGEN_TOKEN_COST}, Preostalo: ${userTokens}`,
                insufficientTokens: true,
                tokensNeeded: REGEN_TOKEN_COST,
                tokensRemaining: userTokens,
            };
        }
    }

    const data = (project.contentData as any) || {};

    console.log(`🚀 Generating custom subpage "${safeSlug}" (${title}) for project ${projectId}`);
    console.log(`   Sections: ${sections.join(', ')}`);

    try {
        const homepageRef = project.generatedHtml;

        // Design tokens
        const designTokens = (data as any).designTokens;
        const tokensSection = designTokens ? `
## DESIGN TOKENS — You MUST match these EXACTLY:
\`\`\`json
${JSON.stringify({
            colors: designTokens.colors,
            fonts: designTokens.fonts,
            borderRadius: designTokens.borderRadius,
        }, null, 2)}
\`\`\`
${designTokens.tailwindConfig ? `
## TAILWIND CONFIG — Copy this EXACTLY:
\`\`\`
${designTokens.tailwindConfig}
\`\`\`` : ''}
` : '';

        // Build section instructions
        const sectionInstructions = sections
            .map((s, i) => {
                const prompt = SECTION_PROMPTS[s];
                return prompt ? `${i + 1}. ${prompt}` : null;
            })
            .filter(Boolean)
            .join('\n');

        // Business data
        const heroImg = data.heroImageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200';
        const aboutImg = data.aboutImageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800';
        const openHours = (data.workingHours || []).filter((h: any) => !h.closed);

        // CTA
        let ctaInstruction = '';
        if (data.heroCta && data.heroCta.type) {
            const cta = data.heroCta as any;
            if (cta.type === 'contact') ctaInstruction = `CTA: link to /kontakt. Label: "${cta.label || 'Kontaktirajte nas'}"`;
            else if (cta.type === 'phone') ctaInstruction = `CTA: tel:${data.phone}. Label: "${cta.label || 'Nazovite nas'}"`;
            else if (cta.type === 'email') ctaInstruction = `CTA: mailto:${data.email}. Label: "${cta.label || 'Pošaljite email'}"`;
            else ctaInstruction = `CTA: link to /kontakt. Label: "Kontaktirajte nas"`;
        }

        // Optional data
        const extras: string[] = [];
        if (data.services && data.services.length > 0) extras.push(`Services: ${JSON.stringify(data.services)}`);
        if (data.testimonials && data.testimonials.length > 0) extras.push(`Testimonials: ${JSON.stringify(data.testimonials)}`);
        if (data.faq && data.faq.length > 0) extras.push(`FAQ: ${JSON.stringify(data.faq)}`);
        if (data.gallery && data.gallery.length > 0) extras.push(`Gallery: ${JSON.stringify(data.gallery)}`);
        if (data.pricing && data.pricing.length > 0) extras.push(`Pricing: ${JSON.stringify(data.pricing)}`);

        const hasContactForm = sections.includes('contact_form') || sections.includes('booking');
        const contactFormInstruction = hasContactForm ? `
## CONTACT / BOOKING FORM
The form MUST submit via JavaScript fetch() to: https://webica.hr/api/site/${projectId}/contact
The form MUST:
- POST JSON with fields: name, email, phone, message, _gotcha (honeypot)
- Include hidden honeypot field: <input type="text" name="_gotcha" style="display:none!important" tabindex="-1" autocomplete="off">
- On submit: disable button, show "Slanje..."
- On success: replace form with "✓ Hvala! Javit ćemo vam se uskoro."
- On error: show "Greška pri slanju. Pokušajte ponovno."
` : '';

        const prompt = `You are an elite frontend engineer and UI/UX designer.
Your task: Generate a SINGLE SUBPAGE titled "${title}" that matches the design of an existing homepage.

## OUTPUT FORMAT
Return ONLY the raw HTML starting with <!DOCTYPE html>. No markdown code blocks. No explanations.

## REFERENCE: COMPLETE HOMEPAGE HTML — Match this design EXACTLY
\`\`\`html
${homepageRef}
\`\`\`

${tokensSection}

## CRITICAL: You MUST use the EXACT SAME design system as the homepage:
- Same Tailwind config / theme colors
- Same fonts
- Same button styles
- Same navigation structure (copy verbatim from homepage)
- Same footer (copy verbatim from homepage)
- Same GSAP animations pattern

## TECHNICAL REQUIREMENTS
1. Complete, self-contained HTML file starting with <!DOCTYPE html>
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use GSAP + ScrollTrigger via CDN
4. All text in CROATIAN language
5. SEO meta title and description for this specific page

## NAVIGATION (copy from homepage VERBATIM)
- Copy the EXACT same nav/header structure from the homepage HTML above
- Same logo, same links, same mobile hamburger menu
- Keep <!-- NAV_LINKS --> placeholder if present in the homepage nav
- Highlight "${title}" as active page if its link exists

## FOOTER (copy from homepage VERBATIM)
- Copy the EXACT same footer from the homepage HTML above
- Keep <!-- FOOTER_NAV_LINKS --> placeholder if present

## PAGE CONTENT — Build these sections IN THIS ORDER:
${sectionInstructions}

${contactFormInstruction}

## BUSINESS DATA
- Business name: ${data.businessName}
- Industry: ${data.industry}
- Description: ${data.description}
${data.phone ? `- Phone: ${data.phone}` : ''}
${data.email ? `- Email: ${data.email}` : ''}
${data.address ? `- Address: ${data.address}` : ''}
${data.mapEmbed ? `- Google Maps: <iframe src="${data.mapEmbed}" width="100%" height="400" style="border:0;border-radius:1rem" allowFullScreen loading="lazy"></iframe>` : ''}
${openHours.length > 0 ? `- Working hours: ${JSON.stringify(openHours)}` : ''}

## IMAGES
- heroImageUrl: ${heroImg}
- aboutImageUrl: ${aboutImg}
${data.logoUrl ? `- logoUrl: ${data.logoUrl}` : ''}

${extras.length > 0 ? '## DATA\n' + extras.join('\n') : ''}

${ctaInstruction}

CRITICAL: Return ONLY the raw HTML. Match the homepage design EXACTLY. No markdown, no code blocks.`;

        let generatedHtml: string | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            console.log(`🤖 Custom subpage "${safeSlug}" generation attempt ${attempt}/${MAX_RETRIES}...`);

            try {
                const { response, modelUsed } = await generateWithFallback(prompt, {
                    timeoutMs: 120000,
                });

                let text = response.text();

                if (response.usageMetadata) {
                    logGeminiUsage({
                        type: `generate_custom_subpage_${safeSlug}`,
                        model: modelUsed,
                        tokensInput: response.usageMetadata.promptTokenCount || 0,
                        tokensOutput: response.usageMetadata.candidatesTokenCount || 0,
                    });
                }

                text = text.replace(/```html\s*/g, '').replace(/```\s*/g, '').trim();

                if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
                    console.error(`❌ Attempt ${attempt}: No HTML found`);
                    if (attempt === MAX_RETRIES) throw new Error('AI nije vratio ispravan HTML format.');
                    continue;
                }

                const htmlMatch = text.match(/<!DOCTYPE[\s\S]*/i);
                generatedHtml = htmlMatch ? htmlMatch[0] : text;
                console.log(`✅ Successfully extracted custom "${safeSlug}" HTML (${generatedHtml.length} chars)`);
                break;

            } catch (parseError: any) {
                if (parseError.message === 'AI timeout') throw parseError;
                console.error(`❌ Attempt ${attempt} error:`, parseError.message);
                if (attempt === MAX_RETRIES) throw parseError;
            }
        }

        if (!generatedHtml) {
            throw new Error('Generiranje nije uspjelo.');
        }

        // Inject contact form script if needed
        if (hasContactForm) {
            generatedHtml = injectContactFormScript(generatedHtml, projectId);
        }

        // Save to reactFiles
        const updatedSubpages = { ...existingReactFiles, [safeSlug]: generatedHtml };

        // Also save custom subpage metadata inside contentData for UI display
        const contentData = (project.contentData as any) || {};
        const customMeta = contentData._customSubpages || {};
        const updatedContentData = {
            ...contentData,
            _customSubpages: {
                ...customMeta,
                [safeSlug]: { title, sections, createdAt: new Date().toISOString() },
            },
        };

        await prisma.project.update({
            where: { id: projectId },
            data: {
                reactFiles: updatedSubpages,
                contentData: updatedContentData,
            },
        });

        console.log(`✅ Custom subpage "${safeSlug}" saved for project ${projectId}`);

        // Deduct tokens for regeneration
        if (isRegeneration) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    editorTokens: { decrement: REGEN_TOKEN_COST },
                    editorTokensUsed: { increment: REGEN_TOKEN_COST },
                },
            });
            console.log(`💰 Deducted ${REGEN_TOKEN_COST} tokens for custom subpage regeneration`);
        }

        revalidatePath(`/dashboard/projects/${projectId}/content`);
        return { success: true };

    } catch (error: any) {
        console.error(`❌ Custom subpage "${safeSlug}" generation error:`, error);

        if (error.message === 'AI timeout') {
            return { error: 'Generiranje je predugo trajalo. Pokušajte ponovno.' };
        }
        return { error: error.message || 'Neuspješno generiranje podstranice.' };
    }
}


/**
 * Delete a subpage from a project's reactFiles.
 */
export async function deleteSubpageAction(projectId: string, slug: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: 'Niste prijavljeni.' };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    const existingReactFiles = (project.reactFiles as Record<string, string>) || {};
    const { [slug]: _, ...remaining } = existingReactFiles;

    const contentData = (project.contentData as any) || {};
    const customMeta = (contentData._customSubpages || {}) as Record<string, any>;
    const { [slug]: _m, ...remainingMeta } = customMeta;

    await prisma.project.update({
        where: { id: projectId },
        data: {
            reactFiles: remaining,
            contentData: { ...contentData, _customSubpages: remainingMeta },
        },
    });

    console.log(`🗑️ Deleted subpage "${slug}" from project ${projectId}`);

    revalidatePath(`/dashboard/projects/${projectId}/content`);
    return { success: true };
}
