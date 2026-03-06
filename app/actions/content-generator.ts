'use server';

import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generatePageImages } from '@/lib/ai-images';
import { STYLES } from '@/lib/styles';
import { injectContactFormScript } from '@/lib/contact-form-script';
import { logGeminiUsage } from '@/lib/gemini-usage';
import { generateWithFallback } from '@/lib/gemini-with-fallback';

import { contentSchema, formatValidationErrors } from '@/lib/schemas';
import { buildFontInstruction } from '@/lib/font-pairs';

// Validate environment variables at startup
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY is not configured in environment variables!');
}
if (!BLOB_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not configured in environment variables!');
}

// Initialize Gemini

export async function uploadImageAction(formData: FormData) {
    if (!BLOB_TOKEN) {
        throw new Error('Vercel Blob nije konfiguriran. Molimo kontaktirajte podršku.');
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('Nije odabrana datoteka za upload.');
    }

    try {
        const blob = await put(file.name, file, {
            access: 'public',
            token: BLOB_TOKEN,
            addRandomSuffix: true,
        });

        return blob.url;
    } catch (error: any) {
        console.error('Blob upload error:', error);
        throw new Error('Upload slike nije uspio. Molimo pokušajte ponovno.');
    }
}

export async function generateWebsiteAction(projectId: string, formData: any) {
    // 1. Environment Check
    if (!GOOGLE_API_KEY) {
        console.error('❌ Google API Key missing - cannot generate website');
        return { error: 'AI sustav nije konfiguriran. Molimo kontaktirajte podršku.' };
    }

    // 2. Authentication Check
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return { error: 'Niste prijavljeni. Molimo prijavite se ponovno.' };
    }

    // 3. Validation
    const validatedFields = contentSchema.safeParse(formData);

    if (!validatedFields.success) {
        console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
        return { error: formatValidationErrors(validatedFields.error) };
    }

    const data = validatedFields.data;

    // 4. Verify project ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    // 5. Check if already generated (one-time limit)
    if (project.hasGenerated) {
        return { error: 'Web stranica je već generirana. Možete samo spremiti izmjene podataka.' };
    }

    console.log(`🚀 Starting website generation for project ${projectId}`);
    console.log(`📋 Business: ${data.businessName} (${data.industry})`);

    try {
        // 6. Update Project Status to PROCESSING
        await prisma.project.update({
            where: { id: projectId },
            data: {
                contentData: data as any,
                status: "PROCESSING",
                name: data.businessName // Ažuriraj ime projekta na ime biznisa
            }
        });

        console.log('✅ Project status updated to PROCESSING');

        // 6. Generate AI images (first-time generation) OR get stock images as fallback
        console.log(`📸 Generating images for: ${data.businessName} (${data.industry})`);
        const aiImages = await generatePageImages({
            businessName: data.businessName,
            businessDescription: data.description,
            industry: data.industry,
            styleKey: (data as any).styleKey || null,
        });
        const stockImages = aiImages; // generatePageImages already handles Pexels fallback

        // 7. Build style instructions
        const styleKey = (data as any).styleKey as string | null;
        const styleEntry = styleKey ? (STYLES as any)[styleKey] : null;
        const templateInstructions = styleEntry
            ? `DESIGN STYLE — apply strictly:\n${styleEntry.prompt}`
            : 'Use a modern, professional, visually impressive design. Be creative with layout.';

        // 8. Generate Content with Gemini
        // Build clean data payload (filter out empty arrays to reduce prompt size)
        const cleanData: any = { ...data, stockImages };
        ['testimonials', 'faq', 'gallery', 'pricing', 'workingHours'].forEach(key => {
            if (Array.isArray(cleanData[key]) && cleanData[key].length === 0) delete cleanData[key];
        });
        if (!cleanData.address) delete cleanData.address;
        if (!cleanData.mapEmbed) delete cleanData.mapEmbed;
        if (!cleanData.secondaryColor) delete cleanData.secondaryColor;
        if (!cleanData.backgroundColor) delete cleanData.backgroundColor;
        if (!cleanData.textColor) delete cleanData.textColor;

        // Build conditional section instructions
        const conditionalSections: string[] = [];
        let sectionNum = 7;

        if (data.testimonials && data.testimonials.length > 0) {
            conditionalSections.push(`${sectionNum++}. **Testimonials Section**: Display customer testimonials as cards with name, role, text and star rating (1-5). Use attractive card layout.`);
        }
        if (data.faq && data.faq.length > 0) {
            conditionalSections.push(`${sectionNum++}. **FAQ Section**: Render FAQ as an interactive accordion. Each question expands/collapses on click using vanilla JS.`);
        }
        if (data.gallery && data.gallery.length > 0) {
            conditionalSections.push(`${sectionNum++}. **Gallery Section**: Photo gallery grid with lightbox effect (click to enlarge). Show captions if provided.`);
        }
        if (data.pricing && data.pricing.length > 0) {
            conditionalSections.push(`${sectionNum++}. **Pricing Section**: Pricing cards in a row. If "highlighted" is true, make that card visually prominent. Show features as a list with checkmarks.`);
        }
        if (data.workingHours && data.workingHours.length > 0) {
            conditionalSections.push(`${sectionNum++}. **Working Hours**: Show business hours in the contact section as a clean table (day + hours, or "Zatvoreno" if closed).`);
        }
        if (data.mapEmbed) {
            conditionalSections.push(`${sectionNum++}. **Map**: Embed Google Maps iframe in the contact section using the provided mapEmbed URL.`);
        }

        // Build CTA instruction
        let ctaInstruction = '';
        if (data.heroCta && data.heroCta.type) {
            const heroCta = data.heroCta;
            if (heroCta.type === 'contact') ctaInstruction = `Main CTA button scrolls to the contact form section. Label: "${heroCta.label || 'Kontaktirajte nas'}"\n`;
            else if (heroCta.type === 'phone') ctaInstruction = `Main CTA button links to tel:${data.phone}. Label: "${heroCta.label || 'Nazovite nas'}"\n`;
            else if (heroCta.type === 'email') ctaInstruction = `Main CTA button links to mailto:${data.email}. Label: "${heroCta.label || 'Pošaljite email'}"\n`;
            else if (heroCta.type === 'whatsapp') ctaInstruction = `Main CTA button links to https://wa.me/${(data.phone || '').replace(/[^0-9]/g, '')}. Label: "${heroCta.label || 'WhatsApp'}"\n`;
            else if (heroCta.type === 'link') ctaInstruction = `Main CTA button links to ${heroCta.url}. Label: "${heroCta.label || 'Saznaj više'}"\n`;
        } else {
            ctaInstruction = `Choose an appropriate main CTA button for the ${data.industry} industry (e.g. scroll to contact form with label "Kontaktirajte nas").\n`;
        }

        // Colors instruction
        const autoColors = (data as any).autoColors !== false;
        let colorInstruction = '';
        if (autoColors) {
            colorInstruction = `Choose a color palette that fits the "${data.industry}" industry perfectly. Use premium, harmonious colors.`;
        } else {
            colorInstruction = `Primary brand color: ${data.primaryColor || '#22c55e'}.`;
            if (data.secondaryColor) colorInstruction += ` Secondary/accent color: ${data.secondaryColor}.`;
            if (data.backgroundColor) colorInstruction += ` Page background: ${data.backgroundColor}.`;
            if (data.textColor) colorInstruction += ` Main text color: ${data.textColor}.`;
        }

        // Font instruction
        const fontInstruction = buildFontInstruction((data as any).fontPair);

        const prompt = `
You are a Senior Frontend Engineer and UI/UX Designer.
Your task: Generate a SINGLE, self-contained HTML file for a landing page based on the client's data.

**TECHNICAL REQUIREMENTS:**
1.  **Output:** Return ONLY valid HTML code. Start with <!DOCTYPE html>. Do NOT use markdown tags (\`\`\`html).
2.  **Framework:** Use Tailwind CSS via CDN.
    - <script src="https://cdn.tailwindcss.com"></script>
    - Configure Tailwind theme in a <script> tag. ${colorInstruction}
3.  **Typography:** ${fontInstruction}
4.  **Animations:** Use CSS-only scroll-triggered reveal animations. Do NOT use GSAP or any external animation library.
    Add this CSS in a <style> tag inside <head>:
    .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity: 1; transform: none; }
    .reveal-delay-1 { transition-delay: 0.1s; } .reveal-delay-2 { transition-delay: 0.2s; } .reveal-delay-3 { transition-delay: 0.3s; } .reveal-delay-4 { transition-delay: 0.4s; }
    Add this script before </body>:
    <script>
    const observer = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }); }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    </script>
    Apply class="reveal" to every <section>, feature card, testimonial card, pricing card, and major content block.
    Use reveal-delay-1, reveal-delay-2, etc. on children to stagger their appearance.
    For number counter animations (stats), use a simple JS counter that triggers on IntersectionObserver.
4.  **SEO:**
    - Use metaTitle for \<title\> tag (or generate from businessName + industry if empty)
    - Use metaDescription for \<meta name="description"\> (or generate a compelling 150-char description)
    - Include \<html lang="hr"\> on the html tag
5.  **SEMANTIC HTML & ACCESSIBILITY (MANDATORY):**
    - The \<html\> tag MUST have lang="hr"
    - Use semantic HTML5 elements: \<header\> for the top navigation bar, \<main\> to wrap ALL page content between header and footer, \<footer\> for the bottom section, \<section\> for each content section inside \<main\>, \<article\> for testimonials or blog-like content.
    - Do NOT use bare \<div\> elements where a semantic element exists. Every major block must be a \<section\>.
    - **Heading Hierarchy:** There must be exactly ONE \<h1\> tag per page, containing the business name or primary keyword. Use \<h2\> for section titles and \<h3\> for sub-items within sections. Never skip levels (e.g., no \<h1\> followed by \<h3\>).
    - **Image Alt Text:** ALL \<img\> tags MUST have descriptive, keyword-rich alt attributes (e.g., alt="Frizerski salon Bella - moderno uređen interijer" NOT alt="image" or alt="").
    - **Accessible Links/Buttons:** All icon-only buttons and links MUST have an aria-label attribute (e.g., aria-label="Otvori mobilni izbornik"). All interactive buttons must have clear text or aria-label.
    - **Focus states:** Ensure all interactive elements (\<a\>, \<button\>) have visible focus styles for keyboard navigation.
6.  **Images:**
    - logoUrl: ${data.logoUrl || 'none'}
    - heroImageUrl: ${data.heroImageUrl || stockImages.hero || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200'}
    - aboutImageUrl: ${data.aboutImageUrl || stockImages.about || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'}
    - featuresImageUrl: ${data.featuresImageUrl || stockImages.services || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200'}
    - servicesBackgroundUrl: ${data.servicesBackgroundUrl || ''}
7.  **Design Template:**
${templateInstructions}

**CTA BUTTONS:**
${ctaInstruction}For each service that has a cta config, add a matching CTA button to that service card.
CTA types: contact = scroll to contact, phone = tel: link, email = mailto: link, whatsapp = wa.me link, link = external href.

**CONTENT STRUCTURE:**
1. **Navbar**: Logo (if provided), navigation links, CTA button
2. **Hero Section**: Large heading, compelling subheading, CTA buttons, heroImageUrl background with overlay
3. **About Section**: "O nama" heading, persuasive copy, aboutImageUrl
4. **Features Section**: 3-4 key benefits, icon/card layout, featuresImageUrl
5. **Services Section**: All services with name, description, image, and CTA button if configured
6. **Contact Section**: Functional HTML contact form that submits via JavaScript fetch() to our API. 
   The form MUST:
   - POST JSON to: https://webica.hr/api/site/${projectId}/contact
   - Include a honeypot hidden field: <input type="text" name="_gotcha" style="display:none!important" tabindex="-1" autocomplete="off">
   - Fields: name (text, required), email (email, required), phone (tel, optional), message (textarea, required)
   - On submit: call fetch(), show a loading state on the button (disable it, change text to "Slanje...")
   - On success: replace the form with a success message: "✓ Hvala! Javit ćemo vam se uskoro."
   - On error: show an error message below the form: "Greška pri slanju. Pokušajte ponovno."
   - Also display contact email and phone as clickable links (mailto: / tel:)
   The JS for the form should be a self-contained <script> block at the bottom of the page, e.g.:
   <script>
   document.getElementById('contact-form').addEventListener('submit', async function(e) {
     e.preventDefault();
     const btn = this.querySelector('button[type="submit"]');
     btn.disabled = true; btn.textContent = 'Slanje...';
     const data = { name: this.name.value, email: this.email.value, phone: this.phone.value, message: this.message.value, _gotcha: this._gotcha?.value };
     try {
       const res = await fetch('https://webica.hr/api/site/${projectId}/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
       if (res.ok) { this.innerHTML = '<div class="text-center py-8"><p class="text-green-500 text-xl font-semibold">✓ Hvala!</p><p class="text-zinc-400 mt-2">Javit ćemo vam se uskoro.</p></div>'; }
       else { btn.disabled=false; btn.textContent='Pošalji'; document.getElementById('form-error').classList.remove('hidden'); }
     } catch { btn.disabled=false; btn.textContent='Pošalji'; document.getElementById('form-error').classList.remove('hidden'); }
   });
   </script>
${conditionalSections.join('\n')}
${sectionNum}. **Footer**: Business name, contact info, social links.
   - Copyright with DYNAMIC year: use a \<span\> with id="currentYear" and a small inline \<script\>document.getElementById('currentYear').textContent = new Date().getFullYear();\</script\> so the year always auto-updates. Example: © \<span id="currentYear"\>\</span\> BusinessName
   - At the very bottom: \<a href="https://rent.webica.hr" target="_blank" rel="noopener noreferrer" class="text-sm opacity-60 hover:opacity-100 transition-opacity"\>Powered by Rent a webica\</a\>

**TONE & COPY:**
Professional, persuasive marketing copy in Croatian language. Strong CTAs, industry-appropriate terminology.

**CLIENT DATA:**
${JSON.stringify(cleanData, null, 2)}

**OUTPUT:**
Only the HTML code. No explanations, no markdown.
`;

        console.log('🤖 Calling Gemini API...');

        const { response, modelUsed } = await generateWithFallback(prompt, {
            timeoutMs: 120000,
        });

        let text = response.text();

        if (response.usageMetadata) {
            logGeminiUsage({
                type: 'generate_website',
                model: modelUsed,
                tokensInput: response.usageMetadata.promptTokenCount || 0,
                tokensOutput: response.usageMetadata.candidatesTokenCount || 0,
            });
        }

        console.log(`✅ Gemini returned ${text.length} characters`);

        // 7. Sanitize Output (remove markdown blocks if Gemini adds them)
        text = text.replace(/```html/g, '').replace(/```/g, '').trim();

        // Basic HTML validation
        if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
            console.error('❌ Generated content is not valid HTML');
            throw new Error('AI nije generirao ispravan HTML kod.');
        }

        console.log('✅ HTML validated and sanitized');

        // 8. Update Project with Result — inject contact form JS
        const finalHtml = injectContactFormScript(text, projectId);
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: finalHtml,
                status: "GENERATED",
                name: data.businessName,
                hasGenerated: true,
                aiVersion: { increment: 1 }
            }
        });

        console.log(`✅ Project ${projectId} updated with generated HTML (version ${project.aiVersion + 1})`);

        // Revalidiraj i content stranicu i dashboard da se ime ažurira svugdje
        revalidatePath(`/dashboard/projects/${projectId}/content`);
        revalidatePath('/dashboard');
        return { success: true };

    } catch (error: any) {
        console.error("❌ Generation Error:", error);

        // Revert status on error
        await prisma.project.update({
            where: { id: projectId },
            data: { status: "DRAFT" }
        });

        // Provide specific error messages
        if (error.message === 'AI timeout') {
            return { error: 'AI generiranje je predugo trajalo. Molimo pokušajte ponovno.' };
        }

        if (error.message?.includes('API key')) {
            return { error: 'Problem s AI servisom. Molimo kontaktirajte podršku.' };
        }

        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            return { error: 'AI servis je trenutno preopterećen. Molimo pokušajte za nekoliko minuta.' };
        }

        return { error: error.message || 'Neuspješno generiranje web stranice. Molimo pokušajte ponovno.' };
    }
}
