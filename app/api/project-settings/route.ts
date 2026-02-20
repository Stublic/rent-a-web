import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET — fetch project settings (contactEmail, etc.)
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

        const isAdmin = (session.user as any).role === 'ADMIN';
        const project = isAdmin
            ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, contactEmail: true } })
            : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true, contactEmail: true } });

        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ contactEmail: project.contactEmail ?? '' });
    } catch (err) {
        console.error('GET project-settings error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PATCH — update contactEmail (and other project settings)
export async function PATCH(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { projectId, contactEmail } = body;

        if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

        // Validate email if provided
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            return NextResponse.json({ error: 'Email adresa nije ispravna.' }, { status: 400 });
        }

        // Verify ownership
        const isAdmin = (session.user as any).role === 'ADMIN';
        const existing = isAdmin
            ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
            : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true } });

        if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                contactEmail: contactEmail || null, // null = fall back to user.email
            },
            select: { id: true, contactEmail: true },
        });

        return NextResponse.json({ contactEmail: updated.contactEmail ?? '' });
    } catch (err) {
        console.error('PATCH project-settings error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
