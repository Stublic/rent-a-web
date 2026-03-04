'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateWithFallback } from '@/lib/gemini-with-fallback';
import { logGeminiUsage } from '@/lib/gemini-usage';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

// Read the knowledge base once at module level
let knowledgeBase: string = '';
try {
    knowledgeBase = fs.readFileSync(
        path.join(process.cwd(), 'GOOGLE_ADS_KNOWLEDGE_BASE.md'),
        'utf-8'
    );
} catch (err) {
    console.error('⚠️ Could not read GOOGLE_ADS_KNOWLEDGE_BASE.md:', err);
}

export async function confirmGoogleAdsCampaign(projectId: string) {
    // 1. Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return { error: 'Niste prijavljeni. Molimo prijavite se ponovno.' };
    }

    // 2. Load project with content data
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { user: { select: { email: true, name: true } } },
    });

    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    if (!project.hasGenerated) {
        return { error: 'Prvo morate generirati web stranicu prije nego pokrenete Google Ads kampanju.' };
    }

    // 3. Check if campaign already exists
    const existing = await prisma.googleAdsCampaign.findUnique({
        where: { projectId },
    });

    if (existing && existing.status !== 'PENDING') {
        return { error: 'Kampanja je već pokrenuta. Trenutni status: ' + existing.status };
    }

    // 4. Create or update campaign as PENDING
    const campaign = await prisma.googleAdsCampaign.upsert({
        where: { projectId },
        create: { projectId, status: 'PENDING' },
        update: { status: 'PENDING' },
    });

    // 5. Extract business data from contentData
    const contentData = (project.contentData as any) || {};
    const businessName = contentData.businessName || project.name || 'Nepoznat biznis';
    const industry = contentData.industry || 'Usluge';
    const description = contentData.description || '';
    const services = contentData.services || [];
    const city = contentData.city || contentData.address || '';
    const phone = contentData.phone || '';
    const email = contentData.email || project.user?.email || '';

    // Build services string
    const servicesStr = Array.isArray(services)
        ? services.map((s: any) => typeof s === 'string' ? s : s.name || s.title || '').filter(Boolean).join(', ')
        : String(services);

    // 6. Build the prompt
    const prompt = `
You are an Elite Google Ads Specialist and Senior Copywriter.

Your task: Generate high-converting Google Ads assets for a local business.
Follow EVERY rule in the KNOWLEDGE BASE provided in your system instructions.

BUSINESS DATA:
- Business Name: ${businessName}
- Industry: ${industry}
- City/Location: ${city || 'Croatia'}
- Description: ${description}
- Services: ${servicesStr}
- Phone: ${phone}
- Email: ${email}

GENERATE the following in Croatian language:

1. EXACTLY 15 Short Headlines (max 30 characters each, Title Case)
   - Cover all 5 angles: Brand (2-3), Benefit (3-4), Feature (3-4), Urgency (2-3), CTA (2-3)
   - At least 5 must contain a primary keyword
   - No two headlines should be near-duplicates

2. EXACTLY 4 Long Headlines (max 90 characters each)
   - Each must cover a different angle (Brand+Location, Benefit, Feature, CTA)

3. EXACTLY 4 Descriptions (max 90 characters each, Sentence case)
   - Description 1: Main benefit / elevator pitch
   - Description 2: Trust signals (years of experience, reviews, certifications)
   - Description 3: Key service or feature detail
   - Description 4: Strong CTA with incentive

4. EXACTLY 50 High-Intent Search Keywords
   - Tier 1 (Hot, ~15): [service] + [action] keywords
   - Tier 2 (Warm, ~20): [service] + [location] keywords
   - Tier 3 (Engaged, ~15): [service] + [qualifier] keywords

CRITICAL RULES:
- ALL character limits are HARD LIMITS — never exceed them
- Count characters INCLUDING spaces
- Use Croatian language for all ad copy
- Keywords can be in Croatian
- NO exclamation marks unless max 1 per asset
- NO ALL CAPS words (except acronyms)
- NO decorative symbols or emojis
- Business name in max 3 headlines

OUTPUT FORMAT — Return ONLY valid JSON (no markdown, no explanation):
{
  "headlines": ["headline1", "headline2", ... (exactly 15)],
  "longHeadlines": ["long1", "long2", "long3", "long4"],
  "descriptions": ["desc1", "desc2", "desc3", "desc4"],
  "keywords": ["keyword1", "keyword2", ... (exactly 50)]
}
`;

    try {
        console.log(`🚀 Generating Google Ads assets for project ${projectId} (${businessName})`);

        const { text, modelUsed } = await generateWithFallback(prompt, {
            systemInstruction: `You are a Google Ads expert. Follow these rules strictly:\n\n${knowledgeBase}`,
            inactivityMs: 60_000,
        });

        // 7. Parse JSON from response
        let parsed: any;
        try {
            // Strip potential markdown code blocks
            const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            parsed = JSON.parse(cleanText);
        } catch (parseErr) {
            console.error('❌ Failed to parse AI response as JSON:', text.substring(0, 500));
            await prisma.googleAdsCampaign.update({
                where: { id: campaign.id },
                data: { status: 'PENDING' },
            });
            return { error: 'AI je vratio neispravan format. Molimo pokušajte ponovno.' };
        }

        // 8. Validate structure
        const headlines = Array.isArray(parsed.headlines) ? parsed.headlines.slice(0, 15) : [];
        const longHeadlines = Array.isArray(parsed.longHeadlines) ? parsed.longHeadlines.slice(0, 4) : [];
        const descriptions = Array.isArray(parsed.descriptions) ? parsed.descriptions.slice(0, 4) : [];
        const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 50) : [];

        if (headlines.length < 10 || longHeadlines.length < 3 || descriptions.length < 3 || keywords.length < 20) {
            console.error('❌ AI response missing required assets:', {
                headlines: headlines.length,
                longHeadlines: longHeadlines.length,
                descriptions: descriptions.length,
                keywords: keywords.length,
            });
            await prisma.googleAdsCampaign.update({
                where: { id: campaign.id },
                data: { status: 'PENDING' },
            });
            return { error: 'AI nije generirao dovoljno oglasnih materijala. Molimo pokušajte ponovno.' };
        }

        // 9. Save to database
        await prisma.googleAdsCampaign.update({
            where: { id: campaign.id },
            data: {
                status: 'AWAITING_ADMIN',
                generatedHeadlines: headlines,
                generatedLongHeadlines: longHeadlines,
                generatedDescriptions: descriptions,
                generatedKeywords: keywords,
            },
        });

        // 10. Log Gemini usage
        await logGeminiUsage({
            type: 'google_ads_assets',
            model: modelUsed,
            tokensInput: 0,
            tokensOutput: 0,
        });

        console.log(`✅ Google Ads assets generated for ${businessName}: ${headlines.length} headlines, ${longHeadlines.length} long headlines, ${descriptions.length} descriptions, ${keywords.length} keywords`);

        revalidatePath(`/dashboard/projects/${projectId}/inquiries`);
        return { success: true };

    } catch (error: any) {
        console.error('❌ Google Ads generation error:', error);

        // Reset to PENDING on error
        await prisma.googleAdsCampaign.update({
            where: { id: campaign.id },
            data: { status: 'PENDING' },
        });

        if (error.message === 'AI timeout') {
            return { error: 'AI generiranje je predugo trajalo. Molimo pokušajte ponovno.' };
        }
        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            return { error: 'AI servis je trenutno preopterećen. Pokušajte za nekoliko minuta.' };
        }
        return { error: error.message || 'Neuspješno generiranje. Molimo pokušajte ponovno.' };
    }
}
