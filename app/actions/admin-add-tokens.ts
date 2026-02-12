'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Admin action to add tokens to existing projects
 * Usage: Call this from browser console or create a button in admin UI
 */
export async function addTokensToProjects(tokensToAdd = 500) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        return { error: 'Unauthorized' };
    }

    try {
        // Update all projects with 0 tokens
        const result = await prisma.project.updateMany({
            where: {
                editorTokens: 0,
                userId: session.user.id // Only update user's own projects
            },
            data: {
                editorTokens: tokensToAdd
            }
        });

        return {
            success: true,
            updated: result.count,
            message: `Added ${tokensToAdd} tokens to ${result.count} project(s)`
        };
    } catch (error) {
        console.error('Error adding tokens:', error);
        return { error: 'Failed to add tokens' };
    }
}
