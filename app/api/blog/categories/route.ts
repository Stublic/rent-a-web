import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/č/g, 'c').replace(/ć/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// GET /api/blog/categories?projectId=xxx
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id }
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const categories = await prisma.blogCategory.findMany({
        where: { projectId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } }
    });

    return NextResponse.json({ categories });
}

// POST /api/blog/categories — create new category
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { projectId, name } = body;

    if (!projectId || !name?.trim()) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id }
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const slug = slugify(name.trim());

    // Check for duplicate
    const existing = await prisma.blogCategory.findFirst({
        where: { projectId, slug }
    });
    if (existing) return NextResponse.json({ error: 'Kategorija već postoji' }, { status: 409 });

    const category = await prisma.blogCategory.create({
        data: { projectId, name: name.trim(), slug }
    });

    return NextResponse.json({ category });
}

// DELETE /api/blog/categories?id=xxx
export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const category = await prisma.blogCategory.findUnique({
        where: { id },
        include: { project: { select: { userId: true } } }
    });
    if (!category || category.project.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.blogCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
