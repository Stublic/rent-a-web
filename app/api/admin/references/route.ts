import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';

async function isAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return false;
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    return user?.role === 'ADMIN';
}

// GET — list all design references
export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const references = await prisma.designReference.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ references });
}

// POST — create a new design reference (upload image)
export async function POST(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = (formData.get('title') as string) || null;
        const industry = (formData.get('industry') as string) || null;
        const style = (formData.get('style') as string) || null;
        const sourceUrl = (formData.get('sourceUrl') as string) || null;
        const tagsRaw = (formData.get('tags') as string) || '';
        const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert to WebP and compress (keeps full-page screenshots under 20MB for Gemini)
        const originalBuffer = Buffer.from(await file.arrayBuffer());
        const originalSizeKB = Math.round(originalBuffer.length / 1024);

        const compressedBuffer = await sharp(originalBuffer)
            .resize({
                width: 2560,              // Max width — enough detail for AI analysis
                height: 16000,            // WebP max is 16383px — cap height for full-page screenshots
                fit: 'inside',            // Fit within bounds, maintain aspect ratio
                withoutEnlargement: true,  // Don't upscale small images
            })
            .webp({
                quality: 80,
                effort: 4,
            })
            .toBuffer();

        const compressedSizeKB = Math.round(compressedBuffer.length / 1024);
        const filename = file.name.replace(/\.[^.]+$/, '.webp');
        console.log(`🖼️  Compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${filename})`);

        // Upload compressed WebP to Vercel Blob
        const blob = await put(`design-refs/${Date.now()}-${filename}`, compressedBuffer, {
            access: 'public',
            contentType: 'image/webp',
        });

        const ref = await prisma.designReference.create({
            data: {
                imageUrl: blob.url,
                title,
                industry,
                style,
                sourceUrl,
                tags,
                isActive: true,
            },
        });

        return NextResponse.json({ reference: ref });
    } catch (error: any) {
        console.error('Error creating design reference:', error);
        return NextResponse.json({ error: error.message || 'Failed to create reference' }, { status: 500 });
    }
}

// PUT — replace image of an existing design reference
export async function PUT(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const id = formData.get('id') as string | null;

        if (!file || !id) {
            return NextResponse.json({ error: 'File and ID required' }, { status: 400 });
        }

        const existing = await prisma.designReference.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Compress to WebP
        const originalBuffer = Buffer.from(await file.arrayBuffer());
        const compressedBuffer = await sharp(originalBuffer)
            .resize({
                width: 2560,
                height: 16000,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 80, effort: 4 })
            .toBuffer();

        const filename = file.name.replace(/\.[^.]+$/, '.webp');
        console.log(`🖼️  Replace: ${Math.round(originalBuffer.length / 1024)}KB → ${Math.round(compressedBuffer.length / 1024)}KB`);

        // Delete old blob
        try { await del(existing.imageUrl); } catch (e) { console.warn('Could not delete old blob:', e); }

        // Upload new
        const blob = await put(`design-refs/${Date.now()}-${filename}`, compressedBuffer, {
            access: 'public',
            contentType: 'image/webp',
        });

        const ref = await prisma.designReference.update({
            where: { id },
            data: { imageUrl: blob.url },
        });

        return NextResponse.json({ reference: ref });
    } catch (error: any) {
        console.error('Error replacing image:', error);
        return NextResponse.json({ error: error.message || 'Failed to replace image' }, { status: 500 });
    }
}

// PATCH — update a design reference
export async function PATCH(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Handle tags if sent as comma-separated string
        if (typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }

        const ref = await prisma.designReference.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ reference: ref });
    } catch (error: any) {
        console.error('Error updating design reference:', error);
        return NextResponse.json({ error: error.message || 'Failed to update reference' }, { status: 500 });
    }
}

// DELETE — delete a design reference
export async function DELETE(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const ref = await prisma.designReference.findUnique({ where: { id } });
        if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Delete from Vercel Blob
        try {
            await del(ref.imageUrl);
        } catch (e) {
            console.warn('Could not delete blob:', e);
        }

        await prisma.designReference.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting design reference:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete reference' }, { status: 500 });
    }
}
