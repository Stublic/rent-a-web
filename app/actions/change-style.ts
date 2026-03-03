'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { STYLES } from '@/lib/styles';
import { generateAdvancedWebsiteAction } from './advanced-generator';

const STYLE_REGEN_COST = 500;

/**
 * Regenerate a project's website with a new style (costs 500 tokens).
 * Available on all plans that have generated a website.
 */
export async function changeProjectStyleAction(projectId: string, newStyleKey: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: 'Niste prijavljeni.' };

    // Verify ownership + get project data
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project || (project.userId !== session.user.id && (session.user as any).role !== 'ADMIN')) {
        return { error: 'Nemate pristup ovom projektu.' };
    }

    if (!project.hasGenerated) {
        return { error: 'Web stranica nije generirana. Prvo generirajte stranicu.' };
    }

    // Check user token balance
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { editorTokens: true },
    });

    if ((user?.editorTokens ?? 0) < STYLE_REGEN_COST) {
        return {
            error: `Nemate dovoljno tokena (treba ${STYLE_REGEN_COST}). Kupite tokene u postavkama.`,
            insufficientTokens: true,
            tokensNeeded: STYLE_REGEN_COST,
            tokensRemaining: user?.editorTokens ?? 0,
        };
    }

    // Validate style key
    if (newStyleKey !== 'auto' && !(newStyleKey in STYLES)) {
        return { error: 'Nepoznati stil.' };
    }

    // Deduct tokens first
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            editorTokens: { decrement: STYLE_REGEN_COST },
            editorTokensUsed: { increment: STYLE_REGEN_COST },
        },
    });

    try {
        const contentData = project.contentData as any;
        if (!contentData) {
            // Restore tokens on failure
            await prisma.user.update({
                where: { id: session.user.id },
                data: { editorTokens: { increment: STYLE_REGEN_COST }, editorTokensUsed: { decrement: STYLE_REGEN_COST } },
            });
            return { error: 'Projekt nema sadržaj za regeneraciju.' };
        }

        // Re-run generation with new style, but allow regeneration
        // Temporarily unset hasGenerated to allow re-generation
        await prisma.project.update({
            where: { id: projectId },
            data: { hasGenerated: false },
        });

        const result = await generateAdvancedWebsiteAction(projectId, {
            ...contentData,
            styleKey: newStyleKey === 'auto' ? null : newStyleKey,
        });

        if (result.error) {
            // Restore hasGenerated and tokens on failure
            await prisma.project.update({ where: { id: projectId }, data: { hasGenerated: true } });
            await prisma.user.update({
                where: { id: session.user.id },
                data: { editorTokens: { increment: STYLE_REGEN_COST }, editorTokensUsed: { decrement: STYLE_REGEN_COST } },
            });
            return { error: result.error };
        }

        revalidatePath(`/dashboard/projects/${projectId}/content`);
        return { success: true, tokensDeducted: STYLE_REGEN_COST };

    } catch (err: any) {
        // Restore tokens on unexpected error
        await prisma.user.update({
            where: { id: session.user.id },
            data: { editorTokens: { increment: STYLE_REGEN_COST }, editorTokensUsed: { decrement: STYLE_REGEN_COST } },
        });
        console.error('Style regeneration error:', err);
        return { error: err.message || 'Greška pri generiranju novog stila.' };
    }
}
