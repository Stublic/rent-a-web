import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ContentForm from './form';

export default async function ContentPage({ params }) {
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

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Uredite sadržaj</h1>
                <p className="text-zinc-400">Ovdje unesite sve informacije o vašem poslovanju.</p>
            </div>
            
            <ContentForm project={project} />
        </div>
    );
}
