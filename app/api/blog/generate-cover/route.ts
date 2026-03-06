import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { logGeminiUsage } from '@/lib/gemini-usage';
import { getConfiguredImageModel } from '@/lib/ai-images';
import { generateBlogImagePrompt } from '@/lib/blog-image-prompts';
import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const TOKEN_COST = 25;

// POST /api/blog/generate-cover — AI generates a blog cover image
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!GOOGLE_API_KEY) return NextResponse.json({ error: 'AI servis nije konfiguriran.' }, { status: 500 });
        if (!BLOB_TOKEN) return NextResponse.json({ error: 'Blob storage nije konfiguriran.' }, { status: 500 });

        const body = await req.json();
        const { projectId, title, topic } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'projectId je obavezan.' }, { status: 400 });
        }

        if (!title && !topic) {
            return NextResponse.json({ error: 'Naslov ili tema članka su obavezni za generiranje slike.' }, { status: 400 });
        }

        // Verify ownership
        const project = await prisma.project.findFirst({
            where: { id: projectId, userId: session.user.id }
        });
        if (!project) return NextResponse.json({ error: 'Projekt nije pronađen.' }, { status: 404 });

        // Check token balance
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { editorTokens: true }
        });
        const userTokens = user?.editorTokens ?? 0;

        if (userTokens < TOKEN_COST) {
            return NextResponse.json({
                error: `Nemate dovoljno tokena. Potrebno: ${TOKEN_COST}, Preostalo: ${userTokens}`,
                insufficientTokens: true,
                tokensNeeded: TOKEN_COST,
                tokensRemaining: userTokens,
            }, { status: 402 });
        }

        // Get business context
        const contentData = project.contentData as any;
        const industry = contentData?.industry || '';
        const businessDesc = contentData
            ? `${contentData.businessName || ''} - ${contentData.description || ''}`
            : '';

        // Build industry-aware image prompt
        const subject = title || topic;
        const prompt = generateBlogImagePrompt(subject, industry, businessDesc);

        console.log(`🖼️ Generating blog cover image for project ${projectId}: "${subject}" (industry: ${industry || 'unknown'})`);

        // Get configured image models
        const { primary: primaryModel, fallback: fallbackModel } = await getConfiguredImageModel();
        const models = [primaryModel, fallbackModel];

        let imageUrl: string | null = null;
        let usedModel = '';

        for (let i = 0; i < models.length; i++) {
            const modelName = models[i];
            try {
                console.log(`🤖 Trying image model: ${modelName}`);
                const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: {
                        responseModalities: ['IMAGE'],
                        imageConfig: {
                            aspectRatio: '16:9',
                            imageSize: '1K',
                        } as any,
                    },
                });

                const parts = response.candidates?.[0]?.content?.parts ?? [];
                const imagePart = parts.find((p: any) => p.inlineData?.data);
                if (!imagePart?.inlineData?.data) {
                    throw new Error('AI nije vratio sliku');
                }

                const { data, mimeType } = imagePart.inlineData;
                const buffer = Buffer.from(data, 'base64');
                const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
                const slug = (subject || 'cover').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);

                // Upload to Vercel Blob
                const blob = await put(`ai-images/blog-cover-${slug}-${Date.now()}.${ext}`, buffer, {
                    access: 'public',
                    token: BLOB_TOKEN,
                    contentType: mimeType,
                });

                imageUrl = blob.url;
                usedModel = modelName;

                // Log usage
                logGeminiUsage({
                    type: 'blog_cover_image',
                    model: modelName,
                    isImage: true,
                });

                // Save to media library
                await prisma.media.create({
                    data: {
                        userId: session.user.id,
                        projectId,
                        filename: `ai-cover-${slug}.${ext}`,
                        url: blob.url,
                        size: buffer.length,
                        type: mimeType,
                    },
                });

                if (i > 0) {
                    console.log(`⚠️ Used fallback image model: ${modelName}`);
                }
                console.log(`✅ Blog cover image generated: ${blob.url} (model: ${modelName})`);
                break;

            } catch (err: any) {
                const msg = err.message || '';
                const isRetryable =
                    msg.includes('503') ||
                    msg.includes('Service Unavailable') ||
                    msg.includes('overloaded') ||
                    msg.includes('quota') ||
                    msg.includes('rate limit') ||
                    msg.includes('RESOURCE_EXHAUSTED');

                if (isRetryable && i < models.length - 1) {
                    console.warn(`⚠️ Image model ${modelName} failed (${msg.substring(0, 80)}), trying fallback...`);
                    continue;
                }

                throw err;
            }
        }

        if (!imageUrl) {
            return NextResponse.json({ error: 'AI nije uspio generirati sliku. Pokušajte ponovo.' }, { status: 500 });
        }

        // Deduct tokens
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                editorTokens: { decrement: TOKEN_COST },
                editorTokensUsed: { increment: TOKEN_COST },
            },
        });

        return NextResponse.json({
            url: imageUrl,
            model: usedModel,
            tokensUsed: TOKEN_COST,
            tokensRemaining: userTokens - TOKEN_COST,
        });

    } catch (error: any) {
        console.error('Blog cover image generation error:', error?.message || error);
        const msg = error?.message || '';
        if (msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('overloaded')) {
            return NextResponse.json({ error: 'AI model je trenutno pod velikim opterećenjem. Pokušajte ponovno za par minuta.' }, { status: 503 });
        }
        if (msg.includes('429') || msg.includes('rate limit') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
            return NextResponse.json({ error: 'Previše zahtjeva. Pričekajte minutu i pokušajte ponovno.' }, { status: 429 });
        }
        return NextResponse.json({ error: 'Greška pri generiranju slike. Pokušajte ponovno.' }, { status: 500 });
    }
}
