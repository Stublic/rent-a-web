'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { fixVisibility } from '@/lib/fix-visibility';

/**
 * Deterministic page fix — no AI, no tokens.
 * Runs the full sanitizer + visibility fix:
 * - Fixes horizontal overflow
 * - Removes duplicate sections
 * - Fixes broken URLs (double-quoted src/href)
 * - Adds nav padding for fixed/sticky nav
 * - Strips leftover GSAP CDN scripts
 * - Injects reveal CSS/JS if missing
 * - Fixes opacity:0, visibility:hidden, hidden classes
 */
export async function fixPageAction(projectId: string, pageSlug: string = 'home') {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return { error: 'Niste prijavljeni.' };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const isAdmin = currentUser?.role === 'ADMIN';
    const project = await prisma.project.findUnique({
        where: isAdmin ? { id: projectId } : { id: projectId, userId: session.user.id }
    });

    if (!project || !project.generatedHtml) {
        return { error: 'Projekt nije pronađen ili stranica nije generirana.' };
    }

    const isSubpage = pageSlug !== 'home';
    const reactFiles = (project.reactFiles || {}) as Record<string, string>;
    const currentHtml = isSubpage ? (reactFiles[pageSlug] || '') : project.generatedHtml;

    if (!currentHtml) {
        return { error: 'Stranica nije pronađena.' };
    }

    console.log(`🔧 Fix page: project ${projectId}, page ${pageSlug} (${currentHtml.length} chars)`);

    // Run full sanitizer + visibility fix
    let fixedHtml = sanitizeHtml(currentHtml);
    fixedHtml = fixVisibility(fixedHtml);

    // Check if anything changed
    if (fixedHtml === currentHtml) {
        return {
            success: true,
            noChanges: true,
            message: 'Stranica izgleda ispravno — nije pronađen nijedan problem.'
        };
    }

    // Save edit history (for undo support)
    const editHistory = Array.isArray(project.editHistory) ? project.editHistory : [];
    editHistory.push({
        timestamp: new Date().toISOString(),
        request: '[Automatski popravak stranice]',
        success: true,
        tokensConsumed: 0,
        htmlSnapshot: currentHtml,
        pageSlug,
    });

    // Update database
    if (isSubpage) {
        const updatedReactFiles = { ...reactFiles, [pageSlug]: fixedHtml };
        await prisma.project.update({
            where: { id: projectId },
            data: {
                reactFiles: updatedReactFiles as any,
                editHistory: editHistory as any,
                lastEditedAt: new Date(),
            }
        });
    } else {
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: fixedHtml,
                editHistory: editHistory as any,
                lastEditedAt: new Date(),
            }
        });
    }

    console.log(`✅ Page fix applied: ${currentHtml.length} → ${fixedHtml.length} chars`);

    revalidatePath(`/dashboard/projects/${projectId}/editor`);

    return {
        success: true,
        updatedHtml: fixedHtml,
        message: 'Stranica popravljena! Ispravljeni su problemi s layoutom, vidljivošću i strukturom.'
    };
}
