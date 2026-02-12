'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY is not configured!');
}

const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }) : null;

export async function editWebsiteAction(projectId: string, editRequest: string) {
    const TOKENS_PER_EDIT = 50; // Cost per AI edit

    // 1. Environment Check
    if (!GOOGLE_API_KEY || !model) {
        return { error: 'AI sustav nije konfiguriran.' };
    }

    // 2. Auth
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return { error: 'Niste prijavljeni.' };
    }

    // 3. Get project
    const project = await prisma.project.findUnique({
        where: { id: projectId, userId: session.user.id }
    });

    if (!project || !project.generatedHtml) {
        return { error: 'Projekt nije pronađen ili web stranica nije generirana.' };
    }

    // 4. Check token balance
    if (project.editorTokens < TOKENS_PER_EDIT) {
        return {
            error: `Nemate dovoljno tokena. Potrebno: ${TOKENS_PER_EDIT}, Preostalo: ${project.editorTokens}`,
            insufficientTokens: true,
            tokensNeeded: TOKENS_PER_EDIT,
            tokensRemaining: project.editorTokens
        };
    }

    console.log(`🎨 Applying edit: "${editRequest}" to project ${projectId}`);
    console.log(`💰 Tokens before: ${project.editorTokens}`);

    try {
        // 4. Build prompt for Gemini
        const prompt = `
You are an expert HTML/CSS editor. The user has a website and wants to make a change.

**Current HTML:**
\`\`\`html
${project.generatedHtml}
\`\`\`

**User's Edit Request (in Croatian):**
"${editRequest}"

**Your Task:**
1. Understand what the user wants to change
2. Modify the HTML accordingly
3. Return ONLY the complete, modified HTML
4. Do NOT add markdown code blocks (\`\`\`html), just raw HTML
5. Keep all existing functionality intact
6. Make minimal changes - only what's requested

**Guidelines:**
- If the request is about COLOR: modify the appropriate CSS/Tailwind classes
- If about TEXT: change the text content
- If about IMAGES: update src attributes (suggest placeholder if user needs to upload new image)
- If about LAYOUT: adjust CSS/Tailwind spacing, sizing, positioning, flexbox, grid
- If about ADDING CONTENT: insert new sections/elements maintaining the existing style
- If about REMOVING: delete the requested elements
- If unclear: make a reasonable interpretation based on context

**Critical:**
- Start output with <!DOCTYPE html>
- Return valid, complete HTML
- No explanations, no markdown, no comments outside HTML

**Output:** Complete HTML document
`;

        // 5. Call Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let modifiedHtml = response.text();

        console.log(`✅ Gemini returned ${modifiedHtml.length} characters`);

        // 6. Clean up output
        modifiedHtml = modifiedHtml
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .trim();

        // 7. Basic validation
        if (!modifiedHtml.includes('<!DOCTYPE') && !modifiedHtml.includes('<html')) {
            console.error('❌ Invalid HTML returned by AI');
            return { error: 'AI nije vratio ispravan HTML. Pokušajte ponovno ili reformulirajte zahtjev.' };
        }

        // 8. Save edit history with token info
        const editHistory = Array.isArray(project.editHistory) ? project.editHistory : [];
        editHistory.push({
            timestamp: new Date().toISOString(),
            request: editRequest,
            success: true,
            tokensConsumed: TOKENS_PER_EDIT,
            htmlSnapshot: project.generatedHtml // For undo
        });

        // 9. Update database - consume tokens on success
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: modifiedHtml,
                editHistory: editHistory as any,
                lastEditedAt: new Date(),
                editorTokens: { decrement: TOKENS_PER_EDIT },
                editorTokensUsed: { increment: TOKENS_PER_EDIT }
            }
        });

        console.log(`✅ Edit applied successfully`);
        console.log(`💰 Tokens after: ${project.editorTokens - TOKENS_PER_EDIT}`);

        revalidatePath(`/dashboard/projects/${projectId}/editor`);

        return {
            success: true,
            updatedHtml: modifiedHtml,
            message: 'Izmjena uspješno primijenjena!',
            tokensRemaining: project.editorTokens - TOKENS_PER_EDIT,
            tokensConsumed: TOKENS_PER_EDIT
        };

    } catch (error: any) {
        console.error('❌ Edit error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);

        // Save failed attempt in history
        const editHistory = Array.isArray(project.editHistory) ? project.editHistory : [];
        editHistory.push({
            timestamp: new Date().toISOString(),
            request: editRequest,
            success: false,
            error: error.message
        });

        await prisma.project.update({
            where: { id: projectId },
            data: { editHistory: editHistory as any }
        });

        return {
            error: `Greška: ${error.message || 'Pokušajte reformulirati zahtjev.'}`
        };
    }
}

export async function undoLastEditAction(projectId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return { error: 'Niste prijavljeni.' };
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId, userId: session.user.id }
    });

    if (!project) {
        return { error: 'Projekt nije pronađen.' };
    }

    const history = Array.isArray(project.editHistory) ? project.editHistory : [];

    if (history.length === 0) {
        return { error: 'Nema izmjena za poništiti.' };
    }

    // Find last successful edit
    const successfulEdits = history.filter((edit: any) => edit.success);
    if (successfulEdits.length === 0) {
        return { error: 'Nema uspješnih izmjena za poništiti.' };
    }

    const lastEdit = successfulEdits[successfulEdits.length - 1];

    await prisma.project.update({
        where: { id: projectId },
        data: {
            generatedHtml: lastEdit.htmlSnapshot,
            editHistory: history.slice(0, history.lastIndexOf(lastEdit)) as any
        }
    });

    revalidatePath(`/dashboard/projects/${projectId}/editor`);

    return {
        success: true,
        updatedHtml: lastEdit.htmlSnapshot,
        message: 'Posljednja izmjena poništena.'
    };
}
