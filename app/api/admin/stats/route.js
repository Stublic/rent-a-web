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
        console.error('[Admin] Auth error:', e.message);
        return null;
    }
}

// GET /api/admin/stats
export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const [totalUsers, totalProjects, activeProjects, totalInvoices, recentUsers, recentInvoices] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.project.count({ where: { status: { not: 'DRAFT' } } }),
            prisma.invoice.count(),
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, name: true, email: true, createdAt: true, planName: true }
            }),
            prisma.invoice.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { user: { select: { email: true, name: true } } }
            }),
        ]);

        // Calculate MRR from active subscriptions
        const subscriptions = await prisma.project.findMany({
            where: { stripeSubscriptionId: { not: null } },
            select: { planName: true }
        });

        let mrr = 0;
        subscriptions.forEach(sub => {
            if (sub.planName?.includes('Starter')) mrr += 39;
            else if (sub.planName?.includes('Advanced')) mrr += 89;
            else if (sub.planName?.includes('Poduzetni')) mrr += 399;
        });

        return NextResponse.json({
            stats: { totalUsers, totalProjects, activeProjects, totalInvoices, mrr },
            recentUsers,
            recentInvoices,
        });
    } catch (error) {
        console.error('[Admin Stats] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
    }
}
