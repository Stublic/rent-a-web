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

// GET /api/admin/bug-reports — list all
export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const reports = await prisma.bugReport.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, planName: true } },
            },
        });

        return NextResponse.json({ reports });
    } catch (error) {
        console.error('[Admin Bug Reports] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/bug-reports — update status
export async function PATCH(req) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id, status } = await req.json();
        if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await prisma.bugReport.update({ where: { id }, data: { status } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Bug Report Update] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/bug-reports — delete
export async function DELETE(req) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await prisma.bugReport.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Bug Report Delete] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
