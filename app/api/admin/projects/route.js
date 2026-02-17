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
        console.error('[Admin Projects] Auth error:', e.message);
        return null;
    }
}

// GET /api/admin/projects - List all projects
export async function GET(req) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;

        let where = {};
        if (search) {
            where = {
                OR: [
                    { name: { contains: search } },
                    { user: { email: { contains: search } } },
                    { user: { name: { contains: search } } },
                ]
            };
        }

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                include: {
                    user: { select: { id: true, email: true, name: true } }
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.project.count({ where })
        ]);

        return NextResponse.json({ projects, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('[Admin Projects] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
    }
}
