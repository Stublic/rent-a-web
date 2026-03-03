import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
    } catch (e: any) {
        console.error('[Admin] Auth error:', e.message);
        return null;
    }
}

export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        // Aggregate statistics from the GeminiUsage model
        const totalCalls = await prisma.geminiUsage.count();

        const sumResult = await prisma.geminiUsage.aggregate({
            _sum: {
                tokensInput: true,
                tokensOutput: true,
                cost: true,
            }
        });

        // Get daily metrics for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyUsageRaw = await prisma.geminiUsage.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true,
                cost: true,
                tokensInput: true,
                tokensOutput: true,
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by day string YYYY-MM-DD
        const dailyMap = new Map<string, { date: string, cost: number, calls: number, tokens: number }>();

        for (const record of dailyUsageRaw) {
            const dateStr = record.createdAt.toISOString().split('T')[0];
            const existing = dailyMap.get(dateStr) || { date: dateStr, cost: 0, calls: 0, tokens: 0 };

            existing.cost += record.cost;
            existing.calls += 1;
            existing.tokens += (record.tokensInput + record.tokensOutput);

            dailyMap.set(dateStr, existing);
        }

        const chartData = Array.from(dailyMap.values());

        // Group by model
        const modelStatsRaw = await prisma.geminiUsage.groupBy({
            by: ['model'],
            _count: {
                _all: true
            },
            _sum: {
                cost: true
            }
        });

        const modelStats = modelStatsRaw.map(m => ({
            name: m.model,
            calls: m._count._all,
            cost: m._sum.cost || 0
        }));

        return NextResponse.json({
            summary: {
                calls: totalCalls,
                tokens: (sumResult._sum.tokensInput || 0) + (sumResult._sum.tokensOutput || 0),
                cost: sumResult._sum.cost || 0,
            },
            chartData,
            modelStats,
        });

    } catch (error) {
        console.error('Error fetching admin usage stats:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
