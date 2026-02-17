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
        console.error('[Admin Users] Auth error:', e);
        return null;
    }
}

// GET /api/admin/users - List all users
export async function GET(req) {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;

        // Build where clause — avoid mode: 'insensitive' which may not work with PrismaPg adapter
        let where = {};
        if (search) {
            where = {
                OR: [
                    { email: { contains: search } },
                    { name: { contains: search } },
                ]
            };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    projects: {
                        select: { id: true, name: true, status: true, planName: true }
                    },
                    _count: { select: { invoices: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('[Admin Users] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
    }
}

// PATCH /api/admin/users - Update user
export async function PATCH(req) {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId, ...updates } = await req.json();

        // Only allow specific fields to be updated
        const allowedFields = ['role', 'subscriptionStatus', 'planName'];
        const safeUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                safeUpdates[key] = updates[key];
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: safeUpdates,
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('[Admin Users PATCH] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
    }
}
