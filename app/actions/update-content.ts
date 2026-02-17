'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { contentSchema } from '@/lib/schemas';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }) : null;

export async function updateContentAction(projectId: string, formData: any) {
    // 1. Environment Check
    if (!GOOGLE_API_KEY || !model) {
        return { error: 'AI sustav nije konfiguriran.' };
    }

    // 2. Auth
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return { error: 'Niste prijavljeni.' };
    }

    // 3. Validate data
    let data;
    try {
        data = contentSchema.parse(formData);
    } catch (error) {
        return { error: 'Neispravni podaci.' };
    }

    // 4. Get project (admin can access any project)
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const isAdmin = currentUser?.role === 'ADMIN';
    const project = await prisma.project.findUnique({
        where: isAdmin ? { id: projectId } : { id: projectId, userId: session.user.id }
    });

    if (!project) {
        return { error: 'Projekt nije pronađen.' };
    }

    if (!project.generatedHtml) {
        return { error: 'Web stranica mora biti prvo generirana. Koristite "Generiraj Web Stranicu" gumb.' };
    }

    console.log(`🔄 Updating content for project ${projectId} - ${data.businessName}`);

    try {
        // 5. Compare old and new data to find what changed
        const oldData = project.contentData as any;
        const changes = [];

        // Detect changes
        if (oldData?.businessName !== data.businessName) {
            changes.push(`Business name: "${oldData?.businessName || 'N/A'}" → "${data.businessName}"`);
        }
        if (oldData?.tagline !== data.tagline) {
            changes.push(`Tagline changed`);
        }
        if (oldData?.description !== data.description) {
            changes.push(`Description changed`);
        }
        if (JSON.stringify(oldData?.services) !== JSON.stringify(data.services)) {
            changes.push(`Services updated (${oldData?.services?.length || 0} → ${data.services?.length || 0} services)`);
        }
        if (oldData?.phone !== data.phone) {
            changes.push(`Phone: "${oldData?.phone || 'N/A'}" → "${data.phone || 'N/A'}"`);
        }
        if (oldData?.email !== data.email) {
            changes.push(`Email: "${oldData?.email || 'N/A'}" → "${data.email}"`);
        }
        if (JSON.stringify(oldData?.socialLinks) !== JSON.stringify(data.socialLinks)) {
            changes.push(`Social links updated`);
        }
        if (oldData?.primaryColor !== data.primaryColor || oldData?.secondaryColor !== data.secondaryColor || oldData?.backgroundColor !== data.backgroundColor || oldData?.textColor !== data.textColor) {
            changes.push(`Colors updated: primary=${data.primaryColor}${data.secondaryColor ? `, secondary=${data.secondaryColor}` : ''}${data.backgroundColor ? `, bg=${data.backgroundColor}` : ''}${data.textColor ? `, text=${data.textColor}` : ''}`);
        }
        if (JSON.stringify(oldData?.heroCta) !== JSON.stringify(data.heroCta)) {
            changes.push(`Hero CTA updated: type=${data.heroCta?.type}, label="${data.heroCta?.label || ''}"`);
        }
        if (oldData?.address !== data.address) {
            changes.push(`Address: "${oldData?.address || 'N/A'}" → "${data.address || 'N/A'}"`);
        }
        if (oldData?.mapEmbed !== data.mapEmbed) {
            changes.push(`Google Maps embed updated`);
        }
        if (JSON.stringify(oldData?.workingHours) !== JSON.stringify(data.workingHours)) {
            changes.push(`Working hours updated`);
        }
        if (JSON.stringify(oldData?.testimonials) !== JSON.stringify(data.testimonials)) {
            changes.push(`Testimonials updated (${oldData?.testimonials?.length || 0} → ${data.testimonials?.length || 0})`);
        }
        if (JSON.stringify(oldData?.faq) !== JSON.stringify(data.faq)) {
            changes.push(`FAQ updated (${oldData?.faq?.length || 0} → ${data.faq?.length || 0})`);
        }
        if (JSON.stringify(oldData?.gallery) !== JSON.stringify(data.gallery)) {
            changes.push(`Gallery updated (${oldData?.gallery?.length || 0} → ${data.gallery?.length || 0})`);
        }
        if (JSON.stringify(oldData?.pricing) !== JSON.stringify(data.pricing)) {
            changes.push(`Pricing updated (${oldData?.pricing?.length || 0} → ${data.pricing?.length || 0})`);
        }

        if (changes.length === 0) {
            console.log('ℹ️ No content changes detected');
            return { success: true };
        }

        console.log('📝 Detected changes:', changes);

        // 6. Build surgical update prompt
        const prompt = `
You are making SURGICAL updates to an existing website. The user has made custom edits in the AI editor, and we MUST preserve ALL those edits.

**Current Website HTML (with custom AI edits):**
\`\`\`html
${project.generatedHtml}
\`\`\`

**Old Content Data (before form submission):**
\`\`\`json
${JSON.stringify(oldData, null, 2)}
\`\`\`

**New Content Data (from form):**
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

**Changes Detected:**
${changes.map(c => `- ${c}`).join('\n')}

**CRITICAL RULES - READ CAREFULLY:**

1. **PRESERVE 100% OF CUSTOM STYLING:**
   - If the HTML has custom colors, fonts, gradients, backgrounds → KEEP THEM
   - If headings have been customized (different text, styling) → KEEP THEM unless the data explicitly changed
   - If layout has been modified → KEEP IT
   - Any custom HTML elements added → KEEP THEM

2. **UPDATE ONLY WHAT CHANGED:**
   - For each change in the list above, find the corresponding HTML element
   - Replace ONLY the text content or attribute value
   - Do NOT touch the element's classes, styles, or structure

3. **SURGICAL HTML EDITING EXAMPLES:**
   
   Example 1 - Phone number changed:
   - OLD HTML: \` <a href="tel:+38591123">+385 91 123</a>\`
   - NEW HTML: \`<a href="tel:+38598765">+385 98 765</a>\`
   - KEEP: The \`<a>\` tag, all classes, styling
   - CHANGE: Only href and text content

   Example 2 - Service added:
   - Find the services section
   - Duplicate the HTML structure of an existing service
   - Change only the content (icon, title, description)
   - Keep all classes, styling the same

   Example 3 - Business name in header:
   - If old data had "Salon Maja" and new has "Salon Ana"
   - Find where "Salon Maja" appears in the HTML
   - Replace ONLY that text with "Salon Ana"
   - Do NOT change \`<h1>\` classes, colors, fonts, etc.

4. **WHAT TO DO IF TEXT WAS CUSTOMIZED:**
   - If the HTML heading says "Dobrodošli u Salon Maja" but old data just had "Salon Maja"
   - The user customized "Salon Maja" → "Dobrodošli u Salon Maja" in the editor
   - New data has "Salon Ana"
   - Preserve the custom structure: "Dobrodošli u Salon Ana"
   - Just replace the business name part, keep the custom prefix

5. **OUTPUT REQUIREMENTS:**
   - Return the COMPLETE updated HTML document
   - Start with \`<!DOCTYPE html>\`
   - Do NOT add markdown code blocks (\`\`\`html), just raw HTML
   - Think: minimal changes, maximum preservation

**Your task:** Apply ONLY the detected changes while preserving all custom AI edits.
`;

        // 7. Call Gemini with improved prompt
        console.log('🤖 Calling Gemini for surgical content update...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let updatedHtml = response.text();

        console.log(`✅ Gemini returned ${updatedHtml.length} characters`);

        // 8. Clean up
        updatedHtml = updatedHtml
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .trim();

        // 9. Validate
        if (!updatedHtml.includes('<!DOCTYPE') && !updatedHtml.includes('<html')) {
            console.error('❌ Invalid HTML returned');
            return { error: 'AI nije vratio ispravan HTML. Pokušajte ponovno.' };
        }

        // 10. Update database
        await prisma.project.update({
            where: { id: projectId },
            data: {
                contentData: data as any,
                generatedHtml: updatedHtml,
                name: data.businessName,
                aiVersion: { increment: 1 }
            }
        });

        console.log(`✅ Content updated successfully - version ${project.aiVersion + 1}`);
        console.log(`📊 Applied ${changes.length} surgical change(s)`);

        revalidatePath(`/dashboard/projects/${projectId}/content`);
        revalidatePath(`/dashboard/projects/${projectId}/editor`);
        revalidatePath('/dashboard');

        return { success: true };

    } catch (error: any) {
        console.error('❌ Update error:', error);
        return { error: 'Greška pri ažuriranju sadržaja. Pokušajte ponovno.' };
    }
}
