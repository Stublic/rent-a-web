/**
 * Design reference utilities for generation.
 * Fetches matching design references and formats them for Gemini multimodal input.
 */

import { prisma } from '@/lib/prisma';

/**
 * Get design references for a given industry.
 * Returns up to `limit` active references, prioritizing industry match.
 */
export async function getReferencesForGeneration(industry: string, limit = 2) {
    // First try exact industry match
    let refs = await prisma.designReference.findMany({
        where: {
            isActive: true,
            industry: {
                contains: industry,
                mode: 'insensitive',
            },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
    });

    // If not enough industry matches, fill with random active refs
    if (refs.length < limit) {
        const existingIds = refs.map(r => r.id);
        const additional = await prisma.designReference.findMany({
            where: {
                isActive: true,
                id: { notIn: existingIds },
            },
            take: limit - refs.length,
            orderBy: { createdAt: 'desc' },
        });
        refs = [...refs, ...additional];
    }

    return refs;
}

/**
 * Fetch image from URL and convert to base64 for Gemini multimodal input.
 */
export async function imageUrlToBase64(url: string): Promise<{ mimeType: string; data: string } | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = Buffer.from(await response.arrayBuffer());
        return {
            mimeType: contentType,
            data: buffer.toString('base64'),
        };
    } catch (error) {
        console.error(`Failed to fetch image: ${url}`, error);
        return null;
    }
}

/**
 * Build Gemini multimodal image parts from design references.
 * Returns an array of inline image data parts ready for generateContent().
 */
export async function buildReferenceImageParts(industry: string) {
    const refs = await getReferencesForGeneration(industry, 2);

    if (refs.length === 0) {
        console.log('ℹ️  No design references found, using text-only prompt');
        return { imageParts: [], refs: [] };
    }

    const imageParts = [];
    for (const ref of refs) {
        const imgData = await imageUrlToBase64(ref.imageUrl);
        if (imgData) {
            imageParts.push({
                inlineData: imgData,
            });
        }
    }

    console.log(`🎨 Using ${imageParts.length} design reference(s) for generation`);
    return { imageParts, refs };
}
