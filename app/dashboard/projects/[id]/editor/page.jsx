import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EditorPageClient from './EditorPageClient';

export default async function EditorPage({ params }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/');

    const { id } = await params;
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, editorTokens: true }
    });
    const isAdmin = currentUser?.role === 'ADMIN';
    const userTokens = currentUser?.editorTokens ?? 0;

    const project = await prisma.project.findUnique({ where: isAdmin ? { id } : { id, userId: session.user.id } });
    if (!project) redirect(isAdmin ? '/admin/projects' : '/dashboard');
    // Allow access if HTML is generated
    if (!project.hasGenerated || !project.generatedHtml) redirect(`/dashboard/projects/${id}/content`);

    return <EditorPageClient project={project} userTokens={userTokens} />;
}
