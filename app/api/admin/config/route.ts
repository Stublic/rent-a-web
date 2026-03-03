import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return null;
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });
        if (user?.role !== 'ADMIN') return null;
        return session.user;
    } catch {
        return null;
    }
}

const CONFIG_KEYS = ['aiPrimaryModel', 'aiFallbackModel'];

export async function GET() {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const configs = await prisma.systemConfig.findMany({
        where: { key: { in: CONFIG_KEYS } },
    });

    const result: Record<string, string> = {};
    for (const c of configs) {
        result[c.key] = c.value;
    }

    return NextResponse.json({
        aiPrimaryModel: result.aiPrimaryModel || 'gemini-3.1-pro-preview',
        aiFallbackModel: result.aiFallbackModel || 'gemini-3-pro-preview',
    });
}

export async function PUT(req: Request) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { aiPrimaryModel, aiFallbackModel } = body;

    const updates: { key: string; value: string }[] = [];
    if (aiPrimaryModel && typeof aiPrimaryModel === 'string') {
        updates.push({ key: 'aiPrimaryModel', value: aiPrimaryModel.trim() });
    }
    if (aiFallbackModel && typeof aiFallbackModel === 'string') {
        updates.push({ key: 'aiFallbackModel', value: aiFallbackModel.trim() });
    }

    if (updates.length === 0) {
        return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }

    for (const u of updates) {
        await prisma.systemConfig.upsert({
            where: { key: u.key },
            update: { value: u.value },
            create: { key: u.key, value: u.value },
        });
    }

    // Clear the in-memory cache so changes take effect immediately
    const { clearModelCache } = await import('@/lib/gemini-with-fallback');
    clearModelCache();

    return NextResponse.json({ success: true });
}
