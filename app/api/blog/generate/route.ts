import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }) : null;

const MONTHLY_LIMIT = 20;

// POST /api/blog/generate — AI generates a blog article
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!model) return NextResponse.json({ error: 'AI servis nije konfiguriran.' }, { status: 500 });

        const body = await req.json();
        const { projectId, topic, keywords, tone, length } = body;

        if (!projectId || !topic) {
            return NextResponse.json({ error: 'Tema članka je obavezna.' }, { status: 400 });
        }

        // Verify ownership + plan
        const project = await prisma.project.findFirst({
            where: { id: projectId, userId: session.user.id }
        });
        if (!project) return NextResponse.json({ error: 'Projekt nije pronađen.' }, { status: 404 });

        if (!project.planName?.toLowerCase().includes('growth')) {
            return NextResponse.json({ error: 'AI blog pisanje je dostupno samo u Growth paketu.' }, { status: 403 });
        }

        // Check monthly limit — reset if new month
        const now = new Date();
        let usedThisMonth = project.blogPostsUsedThisMonth;
        if (project.blogPostsResetAt) {
            const resetDate = new Date(project.blogPostsResetAt);
            if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
                usedThisMonth = 0;
                await prisma.project.update({
                    where: { id: projectId },
                    data: { blogPostsUsedThisMonth: 0, blogPostsResetAt: now }
                });
            }
        } else {
            await prisma.project.update({
                where: { id: projectId },
                data: { blogPostsResetAt: now }
            });
        }

        if (usedThisMonth >= MONTHLY_LIMIT) {
            return NextResponse.json({
                error: `Dosegnuli ste mjesečni limit od ${MONTHLY_LIMIT} AI generiranih članaka. Limit se resetira sljedećeg mjeseca.`
            }, { status: 429 });
        }

        // Get business context from project content
        const contentData = project.contentData as any;
        const businessContext = contentData ? `
Naziv biznisa: ${contentData.businessName || 'N/A'}
Industrija: ${contentData.industry || 'N/A'}
Opis: ${contentData.description || 'N/A'}
Usluge: ${contentData.services?.map((s: any) => s.name).join(', ') || 'N/A'}
` : '';

        const lengthMap: Record<string, string> = {
            short: '500-800 riječi',
            medium: '800-1200 riječi',
            long: '1200-2000 riječi'
        };

        const toneMap: Record<string, string> = {
            professional: 'profesionalan, stručan',
            casual: 'opušten, razgovoran',
            informative: 'informativan, edukativni',
            persuasive: 'persuazivan, prodajni'
        };

        const prompt = `
You are an expert Croatian content writer and SEO specialist.
Write a high-quality blog article for a business website.

**BUSINESS CONTEXT:**
${businessContext}

**ARTICLE REQUIREMENTS:**
- Topic: ${topic}
- Keywords to include naturally: ${keywords || 'none specified'}
- Tone: ${toneMap[tone] || 'profesionalan'}
- Length: ${lengthMap[length] || '800-1200 riječi'}
- Language: Croatian (Hrvatski)

**OUTPUT FORMAT:**
Return a valid JSON object with these fields:
{
  "title": "Engaging article title",
  "excerpt": "2-3 sentence summary for article preview (max 200 chars)",
  "content": "Full article content in HTML format using semantic tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Do NOT include <h1> (it's the title). Do NOT include <html>, <head>, <body> tags.",
  "metaTitle": "SEO optimized title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)"
}

**WRITING GUIDELINES:**
- Write naturally, not AI-sounding
- Include practical advice and real-world examples
- Use subheadings (h2, h3) to structure the article well
- Include a strong introduction and conclusion
- Naturally weave in the keywords for SEO
- Make it relevant to the business's industry
- Use Croatian language throughout

Return ONLY the JSON object, no markdown blocks, no explanations.
`;

        console.log(`📝 Generating blog article for project ${projectId}: "${topic}"`);

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 60000)
            )
        ]) as any;

        const response = await result.response;
        let text = response.text().trim();

        console.log(`📄 AI response length: ${text.length} chars`);

        // Clean markdown blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let article;
        try {
            article = JSON.parse(text);
        } catch (e) {
            // Fix invalid escape sequences common in AI-generated JSON with HTML
            try {
                const fixed = text.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
                article = JSON.parse(fixed);
            } catch (e2) {
                // Last resort: try to extract JSON object
                try {
                    const match = text.match(/\{[\s\S]*\}/);
                    if (match) {
                        const extracted = match[0].replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
                        article = JSON.parse(extracted);
                    } else {
                        throw new Error('no JSON found');
                    }
                } catch (e3) {
                    console.error('Failed to parse AI response (all attempts):', text.substring(0, 500));
                    return NextResponse.json({ error: 'AI nije vratio ispravan format. Pokušajte ponovo.' }, { status: 500 });
                }
            }
        }

        if (!article.title || !article.content) {
            return NextResponse.json({ error: 'AI nije generirao potpun članak. Pokušajte ponovo.' }, { status: 500 });
        }

        // Increment monthly counter
        await prisma.project.update({
            where: { id: projectId },
            data: {
                blogPostsUsedThisMonth: { increment: 1 },
                blogPostsResetAt: project.blogPostsResetAt || now
            }
        });

        console.log(`✅ Blog article generated: "${article.title}" (${usedThisMonth + 1}/${MONTHLY_LIMIT} this month)`);

        return NextResponse.json({
            article,
            usedThisMonth: usedThisMonth + 1,
            limit: MONTHLY_LIMIT
        });

    } catch (error: any) {
        console.error('Blog generation error:', error?.message || error);
        if (error.message === 'timeout') {
            return NextResponse.json({ error: 'AI generiranje je predugo trajalo. Pokušajte ponovo.' }, { status: 504 });
        }
        return NextResponse.json({ error: error?.message || 'Greška pri generiranju članka.' }, { status: 500 });
    }
}

