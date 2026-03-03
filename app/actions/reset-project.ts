'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { removeDomainFromVercel } from '@/lib/vercel-domains';

const RESET_COST: Record<string, number> = {
    starter: 500,
    advanced: 1000,
};

/**
 * Reset a project — clears all generated content, blog posts, subpages, media,
 * and contact submissions. The subscription stays active, the project is reset
 * to a blank state ready for a new generation.
 *
 * Costs 500 tokens (Starter) or 1000 tokens (Advanced).
 */
export async function resetProjectAction(projectId: string, confirmationText: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: 'Niste prijavljeni.' };

    // Get project
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            name: true,
            userId: true,
            planName: true,
            subdomain: true,
            customDomain: true,
        },
    });

    if (!project) return { error: 'Projekt nije pronađen.' };
    if (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN') {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    // Validate confirmation text
    const expectedConfirmation = `obriši ${project.name}`.toLowerCase();
    if (confirmationText.toLowerCase().trim() !== expectedConfirmation) {
        return { error: 'Potvrdni tekst nije točan. Upišite točno: obriši ' + project.name };
    }

    // Determine cost
    const planKey = (project.planName || '').toLowerCase();
    let cost = 0;
    if (planKey.includes('advanced') || planKey.includes('growth')) {
        cost = RESET_COST.advanced;
    } else {
        cost = RESET_COST.starter;
    }

    // Check user token balance
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { editorTokens: true },
    });

    const userTokens = user?.editorTokens ?? 0;
    if (userTokens < cost) {
        return {
            error: `Nemate dovoljno tokena. Potrebno: ${cost}, Preostalo: ${userTokens}`,
            insufficientTokens: true,
            tokensNeeded: cost,
            tokensRemaining: userTokens,
        };
    }

    try {
        console.log(`🗑️ Resetting project "${project.name}" (${projectId}), cost: ${cost} tokens`);

        // Remove domains from Vercel before clearing them
        if (project.subdomain) {
            try {
                await removeDomainFromVercel(`${project.subdomain}.webica.hr`);
                console.log(`🌐 Removed subdomain: ${project.subdomain}.webica.hr`);
            } catch (e: any) {
                console.warn(`⚠️ Could not remove subdomain from Vercel:`, e.message);
            }
        }
        if (project.customDomain) {
            try {
                await removeDomainFromVercel(project.customDomain);
                console.log(`🌐 Removed custom domain: ${project.customDomain}`);
            } catch (e: any) {
                console.warn(`⚠️ Could not remove custom domain from Vercel:`, e.message);
            }
        }

        // Delete all related data
        await prisma.$transaction([
            // Delete blog posts
            prisma.blogPost.deleteMany({ where: { projectId } }),
            // Delete blog categories
            prisma.blogCategory.deleteMany({ where: { projectId } }),
            // Delete contact submissions
            prisma.contactSubmission.deleteMany({ where: { projectId } }),
            // Delete media files linked to this project
            prisma.media.deleteMany({ where: { projectId } }),
            // Reset project fields
            prisma.project.update({
                where: { id: projectId },
                data: {
                    generatedHtml: null,
                    reactFiles: null,
                    reactConfig: null,
                    contentData: null,
                    editHistory: [],
                    lastEditedAt: null,
                    hasGenerated: false,
                    aiVersion: 1,
                    status: 'DRAFT',
                    publishedAt: null,
                    subdomain: null,
                    customDomain: null,
                    domain: null,
                    contactEmail: null,
                    cancelledAt: null,
                    deletionReminders: '',
                    blogPostsUsedThisMonth: 0,
                    blogPostsResetAt: null,
                    name: project.planName, // Reset name to plan name
                },
            }),
            // Deduct tokens from user
            prisma.user.update({
                where: { id: session.user.id },
                data: {
                    editorTokens: { decrement: cost },
                    editorTokensUsed: { increment: cost },
                },
            }),
        ]);

        console.log(`✅ Project "${project.name}" reset successfully. ${cost} tokens deducted.`);

        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/projects/${projectId}`);

        return { success: true };
    } catch (error: any) {
        console.error('❌ Project reset error:', error);
        return { error: error.message || 'Greška pri resetiranju projekta.' };
    }
}
