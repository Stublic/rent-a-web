'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

/**
 * Save per-page SEO settings (meta title, description, og:image) + favicon.
 * Stored in project.contentData.seoSettings
 */
export async function saveSeoSettingsAction(projectId: string, seoData: {
    pages: Record<string, { title?: string; description?: string; ogImage?: string }>;
    favicon?: string;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: 'Niste prijavljeni.' };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    const contentData = (project.contentData as any) || {};

    await prisma.project.update({
        where: { id: projectId },
        data: {
            contentData: {
                ...contentData,
                seoSettings: seoData,
            } as any,
        },
    });

    revalidatePath(`/dashboard/projects/${projectId}/settings`);
    return { success: true };
}
