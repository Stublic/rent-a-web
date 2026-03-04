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

// GET /api/admin/tickets/[id] — get single ticket with all messages
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, planName: true, image: true } },
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });

        if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ ticket });
    } catch (error: any) {
        console.error('[Admin Ticket Detail] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST /api/admin/tickets/[id] — admin reply + status update
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    const { reply, status } = await req.json();

    try {
        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Add admin reply if provided
        if (reply && reply.trim()) {
            await prisma.ticketMessage.create({
                data: {
                    ticketId: id,
                    role: 'ADMIN',
                    content: reply.trim(),
                },
            });
        }

        // Update status if provided
        if (status && ['OPEN', 'RESOLVED', 'ESCALATED'].includes(status)) {
            await prisma.ticket.update({
                where: { id },
                data: { status },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Ticket Reply] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
