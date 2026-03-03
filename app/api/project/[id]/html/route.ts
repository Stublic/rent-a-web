import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { html, pageSlug } = await req.json();

    if (!html || typeof html !== 'string') {
        return NextResponse.json({ error: 'Invalid HTML' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const isAdmin = currentUser?.role === 'ADMIN';

    const project = await prisma.project.findUnique({ where: isAdmin ? { id } : { id, userId: session.user.id } });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!pageSlug || pageSlug === 'home') {
        // Save homepage
        await prisma.project.update({
            where: { id },
            data: { generatedHtml: html, lastEditedAt: new Date() },
        });
    } else {
        // Save subpage to reactFiles
        const existing = (project.reactFiles as Record<string, string>) || {};
        await prisma.project.update({
            where: { id },
            data: {
                reactFiles: { ...existing, [pageSlug]: html },
                lastEditedAt: new Date(),
            },
        });
    }

    return NextResponse.json({ success: true });
}
