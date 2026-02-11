import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ContentForm from './form';

export default async function ContentPage({ params }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/auth/login');
    }

    const { id } = params;

    const project = await prisma.project.findUnique({
        where: { 
            id: id,
            userId: session.user.id
        }
    });

    if (!project) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500">
                Projekt nije pronađen ili nemate pristup.
            </div>
        );
    }

    return (
        <div className="p-8">
            <ContentForm project={project} />
        </div>
    );
}
