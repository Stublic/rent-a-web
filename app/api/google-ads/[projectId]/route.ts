import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET: Fetch campaign data for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify project ownership or admin
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
    });

    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (project.userId !== session.user.id && user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaign = await prisma.googleAdsCampaign.findUnique({
        where: { projectId },
    });

    return NextResponse.json({ campaign });
}
