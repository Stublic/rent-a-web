import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EditorChat from './EditorChat';
import EditorPreview from './EditorPreview';

export default async function EditorPage({ params }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/');
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { 
            id: id,
            userId: session.user.id
        }
    });

    if (!project) {
        redirect('/dashboard');
    }

    // Redirect to content page if website hasn't been generated yet
    if (!project.hasGenerated || !project.generatedHtml) {
        redirect(`/dashboard/projects/${id}/content`);
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left: Live Preview */}
            <div className="flex-1 min-w-0">
                <EditorPreview html={project.generatedHtml} projectId={project.id} />
            </div>

            {/* Right: Chat Interface */}
            <div className="w-full md:w-96 lg:w-[28rem] flex-shrink-0">
                <EditorChat project={project} />
            </div>
        </div>
    );
}
