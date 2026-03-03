'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { contentSchema } from '@/lib/schemas';
import { injectContactFormScript } from '@/lib/contact-form-script';
import { generateWithFallback } from '@/lib/gemini-with-fallback';
import { logGeminiUsage } from '@/lib/gemini-usage';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// ─── Tier 1: Direct HTML Replacements (no AI needed) ────────────────────────

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace all occurrences of oldVal with newVal in html.
 * Returns { html, count } where count = number of replacements made.
 */
function replaceAll(html: string, oldVal: string, newVal: string): { html: string; count: number } {
    if (!oldVal || oldVal === newVal) return { html, count: 0 };
    const regex = new RegExp(escapeRegex(oldVal), 'g');
    let count = 0;
    const result = html.replace(regex, () => { count++; return newVal; });
    return { html: result, count };
}

/**
 * Replace a URL in src="..." or href="..." attributes.
 */
function replaceUrl(html: string, oldUrl: string, newUrl: string): { html: string; count: number } {
    if (!oldUrl || !newUrl || oldUrl === newUrl) return { html, count: 0 };
    // Replace in src="..." and href="..."
    const regex = new RegExp(escapeRegex(oldUrl), 'g');
    let count = 0;
    const result = html.replace(regex, () => { count++; return newUrl; });
    return { html: result, count };
}

/**
 * Replace phone number — handles both tel: links and display text.
 */
function replacePhone(html: string, oldPhone: string, newPhone: string): { html: string; count: number } {
    if (!oldPhone || oldPhone === newPhone) return { html, count: 0 };
    let totalCount = 0;

    // Replace tel: href (strip spaces/dashes for tel: format)
    const oldTel = oldPhone.replace(/[\s-]/g, '');
    const newTel = (newPhone || '').replace(/[\s-]/g, '');
    if (oldTel && newTel) {
        const r1 = replaceAll(html, oldTel, newTel);
        html = r1.html; totalCount += r1.count;
    }

    // Replace display text
    const r2 = replaceAll(html, oldPhone, newPhone || '');
    html = r2.html; totalCount += r2.count;

    return { html, count: totalCount };
}

/**
 * Replace email — handles both mailto: links and display text.
 */
function replaceEmail(html: string, oldEmail: string, newEmail: string): { html: string; count: number } {
    if (!oldEmail || oldEmail === newEmail) return { html, count: 0 };
    return replaceAll(html, oldEmail, newEmail || '');
}

/**
 * Replace color hex values throughout the HTML (inline styles, Tailwind config, CSS).
 */
function replaceColors(html: string, oldData: any, newData: any): { html: string; count: number } {
    let totalCount = 0;
    const colorFields = ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor'];

    for (const field of colorFields) {
        const oldColor = oldData?.[field];
        const newColor = newData?.[field];
        if (oldColor && newColor && oldColor !== newColor) {
            // Replace hex (case-insensitive)
            const regex = new RegExp(escapeRegex(oldColor), 'gi');
            let count = 0;
            html = html.replace(regex, () => { count++; return newColor; });
            totalCount += count;
        }
    }

    return { html, count: totalCount };
}

/**
 * Replace social media URLs.
 */
function replaceSocialLinks(html: string, oldLinks: any, newLinks: any): { html: string; count: number } {
    if (!oldLinks || !newLinks) return { html, count: 0 };
    let totalCount = 0;

    const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok', 'whatsapp'];
    for (const p of platforms) {
        const oldUrl = oldLinks[p];
        const newUrl = newLinks[p];
        if (oldUrl && newUrl && oldUrl !== newUrl) {
            const r = replaceAll(html, oldUrl, newUrl);
            html = r.html; totalCount += r.count;
        }
    }

    return { html, count: totalCount };
}

/**
 * Replace CTA button label.
 */
function replaceCtaLabel(html: string, oldCta: any, newCta: any): { html: string; count: number } {
    if (!oldCta?.label || !newCta?.label || oldCta.label === newCta.label) return { html, count: 0 };
    return replaceAll(html, oldCta.label, newCta.label);
}

/**
 * Replace map embed iframe src.
 */
function replaceMapEmbed(html: string, oldMap: string | undefined, newMap: string | undefined): { html: string; count: number } {
    if (!oldMap || oldMap === newMap) return { html, count: 0 };
    if (!newMap) return { html, count: 0 }; // Don't remove map, just skip
    return replaceAll(html, oldMap, newMap);
}

/**
 * Apply all Tier 1 direct replacements. Returns updated HTML and list of changes applied.
 */
function applyDirectReplacements(html: string, oldData: any, newData: any): { html: string; appliedChanges: string[] } {
    const applied: string[] = [];

    // Business name
    if (oldData?.businessName && newData.businessName && oldData.businessName !== newData.businessName) {
        const r = replaceAll(html, oldData.businessName, newData.businessName);
        if (r.count > 0) { html = r.html; applied.push(`Ime biznisa: "${oldData.businessName}" → "${newData.businessName}" (${r.count}x)`); }
    }

    // Tagline
    if (oldData?.tagline && newData.tagline && oldData.tagline !== newData.tagline) {
        const r = replaceAll(html, oldData.tagline, newData.tagline);
        if (r.count > 0) { html = r.html; applied.push(`Tagline ažuriran (${r.count}x)`); }
    }

    // Phone
    if (oldData?.phone !== newData.phone) {
        const r = replacePhone(html, oldData?.phone, newData.phone);
        if (r.count > 0) { html = r.html; applied.push(`Telefon ažuriran (${r.count}x)`); }
    }

    // Email
    if (oldData?.email !== newData.email) {
        const r = replaceEmail(html, oldData?.email, newData.email);
        if (r.count > 0) { html = r.html; applied.push(`Email ažuriran (${r.count}x)`); }
    }

    // Address
    if (oldData?.address && newData.address && oldData.address !== newData.address) {
        const r = replaceAll(html, oldData.address, newData.address);
        if (r.count > 0) { html = r.html; applied.push(`Adresa ažurirana (${r.count}x)`); }
    }

    // Colors
    const colorsResult = replaceColors(html, oldData, newData);
    if (colorsResult.count > 0) { html = colorsResult.html; applied.push(`Boje ažurirane (${colorsResult.count}x)`); }

    // Logo URL
    if (oldData?.logoUrl && newData.logoUrl && oldData.logoUrl !== newData.logoUrl) {
        const r = replaceUrl(html, oldData.logoUrl, newData.logoUrl);
        if (r.count > 0) { html = r.html; applied.push(`Logo ažuriran`); }
    }

    // Hero image
    if (oldData?.heroImageUrl && newData.heroImageUrl && oldData.heroImageUrl !== newData.heroImageUrl) {
        const r = replaceUrl(html, oldData.heroImageUrl, newData.heroImageUrl);
        if (r.count > 0) { html = r.html; applied.push(`Hero slika ažurirana`); }
    }

    // About image
    if (oldData?.aboutImageUrl && newData.aboutImageUrl && oldData.aboutImageUrl !== newData.aboutImageUrl) {
        const r = replaceUrl(html, oldData.aboutImageUrl, newData.aboutImageUrl);
        if (r.count > 0) { html = r.html; applied.push(`About slika ažurirana`); }
    }

    // Features/services image
    if (oldData?.featuresImageUrl && newData.featuresImageUrl && oldData.featuresImageUrl !== newData.featuresImageUrl) {
        const r = replaceUrl(html, oldData.featuresImageUrl, newData.featuresImageUrl);
        if (r.count > 0) { html = r.html; applied.push(`Services slika ažurirana`); }
    }

    // Map embed
    if (oldData?.mapEmbed !== newData.mapEmbed) {
        const r = replaceMapEmbed(html, oldData?.mapEmbed, newData.mapEmbed);
        if (r.count > 0) { html = r.html; applied.push(`Google Maps ažuriran`); }
    }

    // Social links
    if (JSON.stringify(oldData?.socialLinks) !== JSON.stringify(newData.socialLinks)) {
        const r = replaceSocialLinks(html, oldData?.socialLinks, newData.socialLinks);
        if (r.count > 0) { html = r.html; applied.push(`Društvene mreže ažurirane (${r.count}x)`); }
    }

    // CTA label
    if (JSON.stringify(oldData?.heroCta) !== JSON.stringify(newData.heroCta)) {
        const r = replaceCtaLabel(html, oldData?.heroCta, newData.heroCta);
        if (r.count > 0) { html = r.html; applied.push(`CTA gumb ažuriran`); }
    }

    return { html, appliedChanges: applied };
}


// ─── Tier 2: Structural Changes (AI needed) ─────────────────────────────────

interface StructuralChange {
    type: string;
    label: string;
    oldData: any;
    newData: any;
}

/**
 * Normalize array data for comparison — treats undefined, null, and empty arrays as equivalent.
 */
function normalizeArray(arr: any): string {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '[]';
    return JSON.stringify(arr);
}

/**
 * Check if working hours are "empty" (all days closed with no actual times set).
 */
function isWorkingHoursEmpty(hours: any): boolean {
    if (!hours || !Array.isArray(hours) || hours.length === 0) return true;
    return hours.every((h: any) => h.closed && !h.from && !h.to);
}

/**
 * Normalize working hours for comparison.
 */
function normalizeWorkingHours(hours: any): string {
    if (isWorkingHoursEmpty(hours)) return 'empty';
    return JSON.stringify(hours);
}

/**
 * Detect structural changes that require AI to update.
 */
function detectStructuralChanges(oldData: any, newData: any): StructuralChange[] {
    const changes: StructuralChange[] = [];

    // Description (significant change — compare trimmed)
    const oldDesc = (oldData?.description || '').trim();
    const newDesc = (newData.description || '').trim();
    if (oldDesc !== newDesc) {
        changes.push({
            type: 'description',
            label: 'Opis biznisa promijenjen',
            oldData: oldData?.description,
            newData: newData.description,
        });
    }

    // Services
    if (normalizeArray(oldData?.services) !== normalizeArray(newData.services)) {
        changes.push({
            type: 'services',
            label: `Usluge: ${oldData?.services?.length || 0} → ${newData.services?.length || 0}`,
            oldData: oldData?.services,
            newData: newData.services,
        });
    }

    // Testimonials
    if (normalizeArray(oldData?.testimonials) !== normalizeArray(newData.testimonials)) {
        changes.push({
            type: 'testimonials',
            label: `Recenzije: ${oldData?.testimonials?.length || 0} → ${newData.testimonials?.length || 0}`,
            oldData: oldData?.testimonials,
            newData: newData.testimonials,
        });
    }

    // FAQ
    if (normalizeArray(oldData?.faq) !== normalizeArray(newData.faq)) {
        changes.push({
            type: 'faq',
            label: `FAQ: ${oldData?.faq?.length || 0} → ${newData.faq?.length || 0}`,
            oldData: oldData?.faq,
            newData: newData.faq,
        });
    }

    // Gallery
    if (normalizeArray(oldData?.gallery) !== normalizeArray(newData.gallery)) {
        changes.push({
            type: 'gallery',
            label: `Galerija: ${oldData?.gallery?.length || 0} → ${newData.gallery?.length || 0}`,
            oldData: oldData?.gallery,
            newData: newData.gallery,
        });
    }

    // Pricing
    if (normalizeArray(oldData?.pricing) !== normalizeArray(newData.pricing)) {
        changes.push({
            type: 'pricing',
            label: `Cjenik: ${oldData?.pricing?.length || 0} → ${newData.pricing?.length || 0}`,
            oldData: oldData?.pricing,
            newData: newData.pricing,
        });
    }

    // Working hours — normalize: all-closed = empty = undefined
    if (normalizeWorkingHours(oldData?.workingHours) !== normalizeWorkingHours(newData.workingHours)) {
        changes.push({
            type: 'workingHours',
            label: 'Radno vrijeme ažurirano',
            oldData: oldData?.workingHours,
            newData: newData.workingHours,
        });
    }

    return changes;
}

/**
 * Apply structural changes via AI. Sends only the relevant sections
 * and a focused prompt instead of the full homepage.
 */
async function applyStructuralChangesViaAI(
    html: string,
    structuralChanges: StructuralChange[],
    newData: any,
    projectId: string
): Promise<{ html: string; changesApplied: string[] }> {
    if (!GOOGLE_API_KEY) throw new Error('AI sustav nije konfiguriran.');

    const changeDescriptions = structuralChanges.map(c => {
        const oldBrief = c.oldData ? (Array.isArray(c.oldData) ? `${c.oldData.length} items` : 'exists') : 'empty';
        const newBrief = c.newData ? (Array.isArray(c.newData) ? `${c.newData.length} items` : 'exists') : 'empty';
        return `- ${c.type}: ${oldBrief} → ${newBrief}`;
    }).join('\n');

    const newDataForChanges: Record<string, any> = {};
    for (const change of structuralChanges) {
        newDataForChanges[change.type] = change.newData;
    }

    // Build a focused prompt — send the full HTML but with clear instructions
    // to only modify specific sections
    const prompt = `You are making TARGETED updates to specific sections of an existing website.

**CURRENT WEBSITE HTML:**
\`\`\`html
${html}
\`\`\`

**SECTIONS THAT NEED UPDATING:**
${changeDescriptions}

**NEW DATA FOR THESE SECTIONS:**
\`\`\`json
${JSON.stringify(newDataForChanges, null, 2)}
\`\`\`

**BUSINESS INFO (for context):**
- Business: ${newData.businessName}
- Industry: ${newData.industry}

**CRITICAL RULES:**
1. ONLY modify the sections listed above. Do NOT touch ANY other part of the HTML.
2. Keep ALL existing styling, classes, colors, fonts, animations, and structure intact.
3. For array data (services, testimonials, FAQ, gallery, pricing):
   - Match the EXACT same HTML structure/classes as existing items
   - Add new items using the same card/component pattern
   - Remove items that no longer exist in the new data
   - Update items whose content changed
4. For description: find where the description text appears and replace it, keeping all surrounding HTML/styling.
5. For working hours: update the table/list with new hours, keep the same formatting.
6. All text must be in CROATIAN.
7. Return the COMPLETE updated HTML document starting with <!DOCTYPE html>.
8. No markdown code blocks. Just raw HTML.

**OUTPUT:** Return the COMPLETE HTML with ONLY the listed sections updated. Everything else must remain EXACTLY the same.`;

    console.log(`🤖 AI updating ${structuralChanges.length} structural section(s)...`);

    const { response, modelUsed } = await generateWithFallback(prompt, { timeoutMs: 120000 });
    let updatedHtml = response.text();

    if (response.usageMetadata) {
        logGeminiUsage({
            type: 'update_content_structural',
            model: modelUsed,
            tokensInput: response.usageMetadata.promptTokenCount || 0,
            tokensOutput: response.usageMetadata.candidatesTokenCount || 0,
        });
    }

    // Clean up
    updatedHtml = updatedHtml.replace(/```html\s*/g, '').replace(/```\s*/g, '').trim();

    // Validate
    if (!updatedHtml.includes('<!DOCTYPE') && !updatedHtml.includes('<html')) {
        throw new Error('AI nije vratio ispravan HTML format.');
    }

    const htmlMatch = updatedHtml.match(/<!DOCTYPE[\s\S]*/i);
    updatedHtml = htmlMatch ? htmlMatch[0] : updatedHtml;

    return {
        html: updatedHtml,
        changesApplied: structuralChanges.map(c => c.label),
    };
}


// ─── Main Action ─────────────────────────────────────────────────────────────

export async function updateContentAction(projectId: string, formData: any) {
    if (!GOOGLE_API_KEY) {
        return { error: 'AI sustav nije konfiguriran.' };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: 'Niste prijavljeni.' };

    let data;
    try {
        data = contentSchema.parse(formData);
    } catch {
        return { error: 'Neispravni podaci.' };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const isAdmin = currentUser?.role === 'ADMIN';
    const project = await prisma.project.findUnique({
        where: isAdmin ? { id: projectId } : { id: projectId, userId: session.user.id }
    });

    if (!project) return { error: 'Projekt nije pronađen.' };
    if (!project.generatedHtml) return { error: 'Web stranica mora biti prvo generirana.' };

    const oldData = project.contentData as any;

    console.log(`🔄 Hybrid update for project ${projectId} - ${data.businessName}`);

    try {
        let html = project.generatedHtml;
        const allChanges: string[] = [];

        // ── Step 1: Apply Tier 1 (Direct Replacements) ──
        const { html: directHtml, appliedChanges } = applyDirectReplacements(html, oldData, data);
        html = directHtml;
        allChanges.push(...appliedChanges);

        if (appliedChanges.length > 0) {
            console.log(`⚡ Tier 1 (direct): ${appliedChanges.length} change(s) applied instantly`);
            appliedChanges.forEach(c => console.log(`   ✅ ${c}`));
        }

        // ── Step 2: Detect Tier 2 (Structural Changes) ──
        const structuralChanges = detectStructuralChanges(oldData, data);

        if (structuralChanges.length > 0) {
            console.log(`🧠 Tier 2 (AI): ${structuralChanges.length} structural change(s) need AI`);
            structuralChanges.forEach(c => console.log(`   📝 ${c.label}`));

            const { html: aiHtml, changesApplied } = await applyStructuralChangesViaAI(
                html, structuralChanges, data, projectId
            );
            html = aiHtml;
            allChanges.push(...changesApplied);
        }

        // ── No changes? ──
        if (allChanges.length === 0) {
            console.log('ℹ️ No content changes detected');
            // Still save contentData in case internal fields changed — preserve _customSubpages
            const customSubpages = oldData?._customSubpages;
            const savedData = customSubpages
                ? { ...(data as any), _customSubpages: customSubpages }
                : data;
            await prisma.project.update({
                where: { id: projectId },
                data: { contentData: savedData as any }
            });
            return { success: true };
        }

        // ── Step 3: Finalize and Save ──
        const finalHtml = injectContactFormScript(html, projectId);

        // Preserve _customSubpages metadata
        const customSubpages = oldData?._customSubpages;
        const savedData = customSubpages
            ? { ...(data as any), _customSubpages: customSubpages }
            : data;

        await prisma.project.update({
            where: { id: projectId },
            data: {
                contentData: savedData as any,
                generatedHtml: finalHtml,
                name: data.businessName,
                aiVersion: { increment: 1 },
            }
        });

        console.log(`✅ Update complete — ${allChanges.length} change(s) applied`);
        console.log(`   Tier 1 (instant): ${appliedChanges.length}`);
        console.log(`   Tier 2 (AI): ${structuralChanges.length}`);

        revalidatePath(`/dashboard/projects/${projectId}/content`);
        revalidatePath(`/dashboard/projects/${projectId}/editor`);
        revalidatePath('/dashboard');

        return { success: true };

    } catch (error: any) {
        console.error('❌ Update error:', error);
        if (error.message === 'AI timeout') {
            return { error: 'Generiranje je predugo trajalo. Pokušajte ponovno.' };
        }
        return { error: error.message || 'Greška pri ažuriranju sadržaja. Pokušajte ponovno.' };
    }
}
