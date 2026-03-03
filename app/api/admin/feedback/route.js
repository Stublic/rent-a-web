import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

async function verifyAdmin() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return null;
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
        if (user?.role !== 'ADMIN') return null;
        return session.user;
    } catch (e) {
        console.error('[Admin] Auth error:', e.message);
        return null;
    }
}

// GET /api/admin/feedback — list all feedbacks
export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const feedbacks = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return NextResponse.json({ feedbacks });
    } catch (error) {
        console.error('[Admin Feedback] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/feedback — delete a feedback entry
export async function DELETE(req) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await prisma.feedback.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Feedback Delete] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
