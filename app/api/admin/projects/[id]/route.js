import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

async function verifyAdmin() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return null;
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });
        if (user?.role !== 'ADMIN') return null;
        return session.user;
    } catch (e) {
        console.error('[Admin Projects] Auth error:', e);
        return null;
    }
}

// GET /api/admin/projects/[id]
export async function GET(req, { params }) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: { user: { select: { email: true, name: true } } }
        });

        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ project });
    } catch (error) {
        console.error('[Admin Projects GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
    }
}

// PATCH /api/admin/projects/[id]
export async function PATCH(req, { params }) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;
        const updates = await req.json();

        const allowedFields = ['generatedHtml', 'status', 'editorTokens', 'domain', 'name', 'planName'];
        const safeUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                safeUpdates[key] = updates[key];
            }
        }

        const project = await prisma.project.update({
            where: { id },
            data: safeUpdates,
        });

        return NextResponse.json({ project });
    } catch (error) {
        console.error('[Admin Projects PATCH] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
    }
}
