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
        const prompt = `
You are a Senior Frontend Engineer and UI/UX Designer.
Your task: Generate a SINGLE, self-contained HTML file for a landing page based on the client's data.

**TECHNICAL REQUIREMENTS:**
1.  **Output:** Return ONLY valid HTML code. Start with <!DOCTYPE html>. Do NOT use markdown tags (\`\`\`html).
2.  **Framework:** Use Tailwind CSS via CDN.
    - <script src="https://cdn.tailwindcss.com"></script>
    - Configure Tailwind theme in a <script> tag to use the client's \`primaryColor\` as the main brand color.
3.  **Animations:** Use GSAP + ScrollTrigger via CDN.
    - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    - Apply smooth scroll-triggered animations (fade-in, slide-up) to sections.
4.  **SEO:**
    - Use metaTitle for <title> tag (or generate from businessName if empty)
    - Use metaDescription for <meta name="description"> (or generate if empty)
    - Include Open Graph tags for social sharing
    - Add meta keywords if provided
5.  **Images:**
    - logoUrl: ${data.logoUrl || 'none'}
    - heroImageUrl: ${data.heroImageUrl || stockImages.hero || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200'}
    - aboutImageUrl: ${data.aboutImageUrl || stockImages.about || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'}
    - featuresImageUrl: ${data.featuresImageUrl || stockImages.features || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200'}
    - servicesBackgroundUrl: ${data.servicesBackgroundUrl || stockImages.servicesBackground || ''}
    - For each service with imageUrl, use that image. If missing, use Unsplash/Pexels URLs related to the service name.
6.  **Design Template:**
${templateInstructions}

**CONTENT STRUCTURE:**
1. **Navbar**: Logo (if provided), navigation links (O nama, Usluge, Galerija, Kontakt), CTA button
2. **Hero Section**: 
   - Large, impactful heading with business name
   - Compelling subheading based on description
   - 2 CTA buttons (Kontaktirajte nas, Naše usluge)
   - Background: heroImageUrl with overlay
3. **About Section**:
   - Heading "O nama" or creative variant
   - Expand on the description with persuasive copy
   - Include aboutImageUrl on the side
4. **Features Section**:
   - 3-4 key benefits/features (infer from industry and description)
   - Icon grid or card layout
   - Use featuresImageUrl as background if provided
5. **Services Section**:
   - List all services from the services array
   - Each service should have:
     * Icon or image (use service.imageUrl if provided, otherwise infer)
     * Name (service.name)
     * Description (service.description or generate compelling one)
   - Use servicesBackgroundUrl if provided
6. **Contact Form Section**:
   - Working HTML form with fields: Name, Email, Phone, Message
   - Form does NOT need to submit (just HTML)
   - Display contact email and phone
7. **Footer**:
   - Business name
   - Contact information
   - Copyright year
   - Social media placeholders (if relevant)

**TONE & COPY:**
Write professional, persuasive marketing copy in Croatian language that:
- Builds trust and credibility
- Highlights unique value proposition
- Uses industry-appropriate terminology
- Includes strong CTAs

**CLIENT DATA (JSON):**
${JSON.stringify({
            ...data,
            stockImages, // Include fetched stock images
        }, null, 2)}

**OUTPUT:**
Only the HTML code. No explanations, no markdown, no comments outside HTML comments.
`;

        console.log('🤖 Calling Gemini API...');

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 60000) // 60 second timeout
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
