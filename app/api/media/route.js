import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

export async function GET(req) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');

        const where = { userId: session.user.id };
        if (projectId) where.projectId = projectId;

        const media = await prisma.media.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ media });
    } catch (error) {
        console.error('[Media] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file');
        const projectId = formData.get('projectId') || null;

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'Datoteka nije pronađena' }, { status: 400 });
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Datoteka je prevelika (max 10MB)' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Nepodržani tip datoteke. Dozvoljeni: slike, videa, PDF.' }, { status: 400 });
        }

        // Upload to Vercel Blob
        const blob = await put(`media/${session.user.id}/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });

        // Save to DB
        const media = await prisma.media.create({
            data: {
                userId: session.user.id,
                projectId,
                filename: file.name,
                url: blob.url,
                size: file.size,
                type: file.type,
            },
        });

        return NextResponse.json({ media });
    } catch (error) {
        console.error('[Media] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID datoteke je obavezan' }, { status: 400 });

        const media = await prisma.media.findUnique({ where: { id } });
        if (!media || media.userId !== session.user.id) {
            return NextResponse.json({ error: 'Datoteka nije pronađena' }, { status: 404 });
        }

        // Delete from Vercel Blob
        try {
            await del(media.url);
        } catch (blobErr) {
            console.error('[Media] Blob delete error:', blobErr.message);
        }

        // Delete from DB
        await prisma.media.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Media] DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
