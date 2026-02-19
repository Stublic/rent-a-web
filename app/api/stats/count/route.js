import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // refresh every 60s

export async function GET() {
    try {
        const count = await prisma.project.count({
            where: {
                status: { in: ['LIVE', 'PUBLISHED', 'GENERATED'] },
            },
        });
        return NextResponse.json({ count });
    } catch {
        return NextResponse.json({ count: 0 });
    }
}
