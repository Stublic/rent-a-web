import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/site/[projectId]/preview — Serve the project's generated HTML
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { generatedHtml: true }
    });

    if (!project?.generatedHtml) {
        return new NextResponse('Stranica nije pronađena', { status: 404 });
    }

    return new NextResponse(project.generatedHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
