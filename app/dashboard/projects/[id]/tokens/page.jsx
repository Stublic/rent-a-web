import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import TokenPurchasePage from './TokenPurchasePage';

export default async function TokenPurchasePageWrapper({ params }) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect('/login');
    }

    const { id } = await Promise.resolve(params);

    // Check if user is admin for bypassing ownership check
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });
    const isAdmin = currentUser?.role === 'ADMIN';

    const project = await prisma.project.findUnique({
        where: isAdmin ? { id } : { id, userId: session.user.id }
    });

    if (!project) {
        notFound();
    }

    return <TokenPurchasePage project={project} />;
}
