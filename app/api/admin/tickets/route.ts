import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function verifyAdmin() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return null;
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, id: true },
        });
        if (user?.role !== 'ADMIN') return null;
        return { ...session.user, dbRole: user.role };
    } catch {
        return null;
    }
}

// GET /api/admin/tickets — list all tickets
export async function GET(req: NextRequest) {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const status = req.nextUrl.searchParams.get('status');

    try {
        const where: any = {};
        if (status && status !== 'ALL') where.status = status;

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, planName: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: { select: { messages: true } },
            },
        });

        return NextResponse.json({ tickets });
    } catch (error: any) {
        console.error('[Admin Tickets] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
