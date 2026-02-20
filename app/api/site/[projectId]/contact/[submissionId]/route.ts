import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// PATCH — mark a single submission as read
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ projectId: string; submissionId: string }> }
) {
    try {
        const { projectId, submissionId } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = (session.user as any).role === 'ADMIN';
        const project = isAdmin
            ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
            : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true } });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const { read } = await req.json();

        const updated = await prisma.contactSubmission.update({
            where: { id: submissionId, projectId },
            data: { read: Boolean(read) },
        });

        return NextResponse.json({ submission: updated });

    } catch (error: any) {
        console.error('PATCH submission error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
