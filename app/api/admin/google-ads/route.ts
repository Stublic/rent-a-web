import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET: List all campaigns with AWAITING_ADMIN status (admin only)
export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'AWAITING_ADMIN';

    const campaigns = await prisma.googleAdsCampaign.findMany({
        where: { status: statusFilter },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    contentData: true,
                    user: { select: { email: true, name: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
}
