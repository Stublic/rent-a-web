'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { contentSchema, formatValidationErrors } from '@/lib/schemas';

/**
 * Save content data without regenerating the website
 * Useful when user just wants to update metadata/info
 */
export async function saveContentAction(projectId: string, formData: any) {
    // 1. Authentication Check
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return { error: 'Niste prijavljeni. Molimo prijavite se ponovno.' };
    }

    // 2. Validation
    const validatedFields = contentSchema.safeParse(formData);

    if (!validatedFields.success) {
        console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
        return { error: formatValidationErrors(validatedFields.error) };
    }

    const data = validatedFields.data;

    // 3. Verify project ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project || project.userId !== session.user.id) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    try {
        // 4. Update only content data and name
        // Preserve _customSubpages metadata from existing contentData
        const existingContentData = (project.contentData as any) || {};
        const savedData = existingContentData._customSubpages
            ? { ...(data as any), _customSubpages: existingContentData._customSubpages }
            : data;

        await prisma.project.update({
            where: { id: projectId },
            data: {
                contentData: savedData as any,
                name: data.businessName
            }
        });

        console.log(`✅ Content saved for project ${projectId}`);

        revalidatePath(`/dashboard/projects/${projectId}/content`);
        revalidatePath('/dashboard');

        return { success: true };

    } catch (error: any) {
        console.error("❌ Save Error:", error);
        return { error: error.message || 'Neuspješno spremanje podataka.' };
    }
}
