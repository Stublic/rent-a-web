'use server';

import { put } from '@vercel/blob';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

import { contentSchema } from '@/lib/schemas';

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
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }) : null;

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
        });

        return blob.url;
    } catch (error: any) {
        console.error('Blob upload error:', error);
        throw new Error('Upload slike nije uspio. Molimo pokušajte ponovno.');
    }
}

export async function generateWebsiteAction(projectId: string, formData: any) {
    // 1. Environment Check
    if (!GOOGLE_API_KEY || !model) {
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
        return { error: 'Podaci forme nisu ispravni. Molimo provjerite sva polja.' };
    }

    const data = validatedFields.data;

    // 4. Verify project ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project || project.userId !== session.user.id) {
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

        // 6. Fetch stock images if needed
        const { searchStockImages, getIndustryImageQueries } = await import('@/lib/stock-images');
        const { getTemplatePrompt } = await import('@/lib/templates');

        const imageQueries = getIndustryImageQueries(data.industry);
        const stockImages: any = {};

        // Fetch missing images from stock APIs
        if (!data.heroImageUrl) {
            stockImages.hero = await searchStockImages(imageQueries.hero);
        }
        if (!data.aboutImageUrl) {
            stockImages.about = await searchStockImages(imageQueries.about);
        }
        if (!data.featuresImageUrl) {
            stockImages.features = await searchStockImages(imageQueries.features);
        }
        if (!data.servicesBackgroundUrl) {
            stockImages.servicesBackground = await searchStockImages(imageQueries.services);
        }

        console.log(`📸 Stock images fetched:`, stockImages);

        // 7. Get template-specific prompt
        const templateInstructions = getTemplatePrompt(data.template || 'modern', data.industry);

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
        const heroCta = data.heroCta || { type: 'contact', label: '', url: '' };
        let ctaInstruction = '';
        if (heroCta.type === 'contact') ctaInstruction = `Main CTA button scrolls to the contact form section. Label: "${heroCta.label || 'Kontaktirajte nas'}"\n`;
        else if (heroCta.type === 'phone') ctaInstruction = `Main CTA button links to tel:${data.phone}. Label: "${heroCta.label || 'Nazovite nas'}"\n`;
        else if (heroCta.type === 'email') ctaInstruction = `Main CTA button links to mailto:${data.email}. Label: "${heroCta.label || 'Pošaljite email'}"\n`;
        else if (heroCta.type === 'whatsapp') ctaInstruction = `Main CTA button links to https://wa.me/${(data.phone || '').replace(/[^0-9]/g, '')}. Label: "${heroCta.label || 'WhatsApp'}"\n`;
        else if (heroCta.type === 'link') ctaInstruction = `Main CTA button links to ${heroCta.url}. Label: "${heroCta.label || 'Saznaj više'}"\n`;

        // Colors instruction
        let colorInstruction = `Primary brand color: ${data.primaryColor}.`;
        if (data.secondaryColor) colorInstruction += ` Secondary/accent color: ${data.secondaryColor}.`;
        if (data.backgroundColor) colorInstruction += ` Page background: ${data.backgroundColor}.`;
        if (data.textColor) colorInstruction += ` Main text color: ${data.textColor}.`;

        const prompt = `
You are a Senior Frontend Engineer and UI/UX Designer.
Your task: Generate a SINGLE, self-contained HTML file for a landing page based on the client's data.

**TECHNICAL REQUIREMENTS:**
1.  **Output:** Return ONLY valid HTML code. Start with <!DOCTYPE html>. Do NOT use markdown tags (\`\`\`html).
2.  **Framework:** Use Tailwind CSS via CDN.
    - <script src="https://cdn.tailwindcss.com"></script>
    - Configure Tailwind theme in a <script> tag. ${colorInstruction}
3.  **Animations:** Use GSAP + ScrollTrigger via CDN.
    - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    - Apply smooth scroll-triggered animations (fade-in, slide-up) to sections.
4.  **SEO:**
    - Use metaTitle for <title> tag (or generate from businessName if empty)
    - Use metaDescription for <meta name="description"> (or generate if empty)
    - Include Open Graph tags for social sharing
5.  **Images:**
    - logoUrl: ${data.logoUrl || 'none'}
    - heroImageUrl: ${data.heroImageUrl || stockImages.hero || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200'}
    - aboutImageUrl: ${data.aboutImageUrl || stockImages.about || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'}
    - featuresImageUrl: ${data.featuresImageUrl || stockImages.features || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200'}
    - servicesBackgroundUrl: ${data.servicesBackgroundUrl || stockImages.servicesBackground || ''}
6.  **Design Template:**
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
${sectionNum}. **Footer**: Business name, contact info, copyright, social links

**TONE & COPY:**
Professional, persuasive marketing copy in Croatian language. Strong CTAs, industry-appropriate terminology.

**CLIENT DATA:**
${JSON.stringify(cleanData, null, 2)}

**OUTPUT:**
Only the HTML code. No explanations, no markdown.
`;

        console.log('🤖 Calling Gemini API...');

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 120000) // 120 second timeout
            )
        ]) as any;

        const response = await result.response;
        let text = response.text();

        console.log(`✅ Gemini returned ${text.length} characters`);

        // 7. Sanitize Output (remove markdown blocks if Gemini adds them)
        text = text.replace(/```html/g, '').replace(/```/g, '').trim();

        // Basic HTML validation
        if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
            console.error('❌ Generated content is not valid HTML');
            throw new Error('AI nije generirao ispravan HTML kod.');
        }

        console.log('✅ HTML validated and sanitized');

        // 8. Update Project with Result
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: text,
                status: "GENERATED",
                name: data.businessName, // Osiguraj da ime ostane ažurirano
                hasGenerated: true, // Označi da je web stranica generirana
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
