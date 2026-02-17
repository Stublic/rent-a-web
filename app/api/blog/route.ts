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

// Inject a "Blog" link into the site's navigation
async function ensureBlogLinkInNav(projectId: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { generatedHtml: true }
        });
        if (!project?.generatedHtml) return;

        let html = project.generatedHtml;
        const blogUrl = `/api/site/${projectId}/blog`;

        // Skip if blog link already exists
        if (html.includes(blogUrl) || html.includes('>Blog<')) return;

        // Strategy 1: Find nav with anchor links and insert before the last item or CTA
        // Look for patterns like: <a href="#contact" ...>Newsletter</a> or similar CTA buttons in nav
        const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
        if (navMatch) {
            const navContent = navMatch[1];
            // Find all anchor tags in nav
            const anchors = [...navContent.matchAll(/<a\s[^>]*>[^<]*<\/a>/gi)];
            if (anchors.length > 0) {
                // Insert before the last anchor (usually the CTA button)
                const lastAnchor = anchors[anchors.length - 1];
                const blogLink = `<a href="${blogUrl}" style="color:inherit;text-decoration:none;font-weight:500;transition:opacity 0.2s" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">Blog</a>`;
                const insertPos = navContent.lastIndexOf(lastAnchor[0]);
                const newNavContent = navContent.substring(0, insertPos) + blogLink + ' ' + navContent.substring(insertPos);
                html = html.replace(navContent, newNavContent);
            }
        }

        // Strategy 2: If no nav found, try header with links
        if (!navMatch) {
            const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
            if (headerMatch) {
                const headerContent = headerMatch[1];
                const anchors = [...headerContent.matchAll(/<a\s[^>]*>[^<]*<\/a>/gi)];
                if (anchors.length > 1) {
                    const lastAnchor = anchors[anchors.length - 1];
                    const blogLink = `<a href="${blogUrl}" style="color:inherit;text-decoration:none;font-weight:500">Blog</a>`;
                    const insertPos = headerContent.lastIndexOf(lastAnchor[0]);
                    const newHeaderContent = headerContent.substring(0, insertPos) + blogLink + ' ' + headerContent.substring(insertPos);
                    html = html.replace(headerContent, newHeaderContent);
                }
            }
        }

        // Only update if HTML changed
        if (html !== project.generatedHtml) {
            await prisma.project.update({
                where: { id: projectId },
                data: { generatedHtml: html }
            });
            console.log(`✅ Blog link injected into nav for project ${projectId}`);
        }
    } catch (err) {
        console.error('Failed to inject blog link:', err);
    }
}

// GET /api/blog?projectId=xxx
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    // Verify ownership
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id }
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const posts = await prisma.blogPost.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, title: true, slug: true, excerpt: true,
            coverImage: true, status: true, publishedAt: true,
            createdAt: true, updatedAt: true,
            categoryId: true, tags: true,
            category: { select: { id: true, name: true, slug: true } }
        }
    });

    return NextResponse.json({ posts, blogPostsUsedThisMonth: project.blogPostsUsedThisMonth });
}

// POST /api/blog — create new post
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { projectId, title, content, excerpt, coverImage, metaTitle, metaDescription, status, categoryId, tags } = body;

    if (!projectId || !title || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership + plan
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id }
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!project.planName?.toLowerCase().includes('growth')) {
        return NextResponse.json({ error: 'Blog je dostupan samo u Growth paketu.' }, { status: 403 });
    }

    // Generate unique slug
    let slug = slugify(title);
    const existing = await prisma.blogPost.findFirst({ where: { projectId, slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const post = await prisma.blogPost.create({
        data: {
            projectId, title, slug, content,
            excerpt: excerpt || '',
            coverImage: coverImage || null,
            categoryId: categoryId || null,
            tags: tags || null,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || excerpt || '',
            status: status || 'DRAFT',
            publishedAt: status === 'PUBLISHED' ? new Date() : null
        }
    });

    // Auto-inject blog link into site nav when publishing
    if (status === 'PUBLISHED') {
        await ensureBlogLinkInNav(projectId);
    }

    return NextResponse.json({ post });
}

// PATCH /api/blog — update post
export async function PATCH(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, title, content, excerpt, coverImage, metaTitle, metaDescription, status, categoryId, tags } = body;

    if (!id) return NextResponse.json({ error: 'Missing post id' }, { status: 400 });

    // Verify ownership via project
    const post = await prisma.blogPost.findUnique({
        where: { id },
        include: { project: { select: { userId: true } } }
    });
    if (!post || post.project.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) {
        updateData.title = title;
        updateData.slug = slugify(title);
    }
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (tags !== undefined) updateData.tags = tags || null;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (status !== undefined) {
        updateData.status = status;
        if (status === 'PUBLISHED' && !post.publishedAt) updateData.publishedAt = new Date();
    }

    const updated = await prisma.blogPost.update({ where: { id }, data: updateData });

    // Auto-inject blog link when publishing
    if (status === 'PUBLISHED') {
        await ensureBlogLinkInNav(post.projectId);
    }

    return NextResponse.json({ post: updated });
}

// DELETE /api/blog?id=xxx
export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const post = await prisma.blogPost.findUnique({
        where: { id },
        include: { project: { select: { userId: true } } }
    });
    if (!post || post.project.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
