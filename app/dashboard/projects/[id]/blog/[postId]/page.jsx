import BlogEditor from '../BlogEditor';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function EditBlogPostPage({ params }) {
    const { id, postId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return notFound();

    const post = await prisma.blogPost.findUnique({
        where: { id: postId },
        include: { project: { select: { userId: true } } }
    });

    if (!post || post.project.userId !== session.user.id) return notFound();

    return <BlogEditor projectId={id} existingPost={{
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        status: post.status,
    }} />;
}
