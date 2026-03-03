'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { injectContactFormScript } from '@/lib/contact-form-script';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { parseAiResponse } from '@/lib/parse-ai-response';

import { getModel } from '@/lib/gemini-with-fallback';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY is not configured!');
}

// ─── System prompt — establishes the editing persona ──────────────────────────
const SYSTEM_PROMPT = `Ti si Webica AI Editor — stručan web developer koji uređuje postojeće HTML stranice.

## TVOJ PRISTUP
1. Čitaj korisnikov zahtjev pažljivo
2. Napravi SAMO tražene izmjene — zadrži SVE ostalo netaknuto
3. NE mijenjaj strukturu, boje, fontove ili layout osim ako korisnik to eksplicitno ne traži
4. Ako korisnik kaže "vrati nazad" ili "kao prije" — referenciraj prethodne razgovore

## KRITIČNA PRAVILA
- NIKADA ne dodavaj klasu "hidden" na vidljive elemente
- NIKADA ne dupliciraj sadržaj — svaka sekcija smije postojati samo jednom
- UVIJEK osiguraj overflow-x: hidden na html i body elementima
- SVE container elementi moraju imati max-width: 100%
- Ako navigacija ima fixed/sticky — dodaj padding-top na prvi sadržaj ispod
- URL-ovi u src/href moraju biti čisti (bez escape znakova)
- Zadrži SVE postojeće skripte, forme, animacije i funkcionalnosti
- Ako primjetiš probleme u HTML-u, ispravi ih uz traženu izmjenu

## FORMAT ODGOVORA
Vrati SAMO čisti JSON (bez markdown blokova):
{
  "html": "...kompletni HTML počevši s <!DOCTYPE html>...",
  "summary": "Kratki opis izmjene (hrvatski, 1-2 rečenice, počni s ✅)",
  "suggestion": "Prijedlog za sljedeću izmjenu (hrvatski, pitanje)"
}`;

// ─── Build conversation history for Gemini Chat API ───────────────────────────
interface ConversationEntry {
    role: 'user' | 'assistant';
    content: string;
}

function buildChatHistory(conversationHistory: ConversationEntry[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // System prompt as first user message + model acknowledgment
    history.push({
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
    });
    history.push({
        role: 'model',
        parts: [{ text: 'Razumijem. Spreman sam za uređivanje HTML stranica. Čekam zahtjev.' }],
    });

    // Add previous conversation turns
    for (const entry of conversationHistory) {
        history.push({
            role: entry.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: entry.content }],
        });
    }

    return history;
}

// ─── Main edit action — multi-turn with conversation history ──────────────────
export async function editWebsiteAction(
    projectId: string,
    editRequest: string,
    conversationHistory: ConversationEntry[] = [],
    pageSlug: string = 'home'
) {
    const TOKENS_PER_EDIT = 50;

    // 1. Environment Check
    if (!GOOGLE_API_KEY) {
        return { error: 'AI sustav nije konfiguriran.' };
    }

    // 2. Auth
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return { error: 'Niste prijavljeni.' };
    }

    // 3. Get project
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const isAdmin = currentUser?.role === 'ADMIN';
    const project = await prisma.project.findUnique({
        where: isAdmin ? { id: projectId } : { id: projectId, userId: session.user.id }
    });

    if (!project || !project.generatedHtml) {
        return { error: 'Projekt nije pronađen ili web stranica nije generirana.' };
    }

    // 4. Check token balance
    const currentUserTokens = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { editorTokens: true }
    });
    const userTokens = currentUserTokens?.editorTokens ?? 0;

    if (userTokens < TOKENS_PER_EDIT) {
        return {
            error: `Nemate dovoljno tokena. Potrebno: ${TOKENS_PER_EDIT}, Preostalo: ${userTokens}`,
            insufficientTokens: true,
            tokensNeeded: TOKENS_PER_EDIT,
            tokensRemaining: userTokens
        };
    }

    console.log(`🎨 Applying edit: "${editRequest}" to project ${projectId} (page: ${pageSlug})`);
    console.log(`💬 Conversation history: ${conversationHistory.length} turns`);

    // Determine which HTML to edit
    const isSubpage = pageSlug !== 'home';
    const reactFiles = (project.reactFiles || {}) as Record<string, string>;
    const currentHtml = isSubpage ? (reactFiles[pageSlug] || '') : project.generatedHtml;

    if (!currentHtml) {
        return { error: isSubpage ? 'Podstranica nije pronađena.' : 'Stranica nije generirana.' };
    }

    try {
        // 5. Build multi-turn chat with full HTML context
        const chatHistory = buildChatHistory(conversationHistory);

        // The current message includes the FULL HTML + user's edit request
        const currentMessage = `**Trenutni HTML stranice:**
\`\`\`html
${currentHtml}
\`\`\`

**Zahtjev korisnika:**
"${editRequest}"

Primijeni izmjenu i vrati JSON odgovor.`;

        // 6. Use Chat API with fallback on 503/timeout
        let rawText = '';
        let usedFallback = false;

        for (let modelAttempt = 0; modelAttempt < 2; modelAttempt++) {
            try {
                const { model } = await getModel(modelAttempt > 0);
                const chat = model.startChat({ history: chatHistory });
                const result = await Promise.race([
                    chat.sendMessage(currentMessage),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('AI timeout')), 120000)
                    )
                ]) as any;

                const response = await result.response;
                rawText = response.text();
                if (modelAttempt > 0) usedFallback = true;
                break;
            } catch (err: any) {
                const msg = err.message || '';
                const isRetryable = msg.includes('503') || msg.includes('Service Unavailable') ||
                    msg.includes('high demand') || msg.includes('quota') || msg === 'AI timeout';
                if (isRetryable && modelAttempt === 0) {
                    console.warn(`⚠️ Primary model failed (${msg.substring(0, 60)}), trying fallback...`);
                    continue;
                }
                throw err;
            }
        }

        console.log(`✅ Gemini returned ${rawText.length} characters`);

        // 7. Parse AI response
        const parsed = parseAiResponse(rawText);
        if (!parsed) {
            console.error('❌ Could not parse AI response');
            return { error: 'AI nije vratio ispravan odgovor. Pokušajte ponovno ili reformulirajte zahtjev.' };
        }

        // 8. Sanitize HTML
        let modifiedHtml = sanitizeHtml(parsed.html);

        // 9. Basic validation
        if (!modifiedHtml.includes('<!DOCTYPE') && !modifiedHtml.includes('<html')) {
            console.error('❌ Invalid HTML returned by AI');
            return { error: 'AI nije vratio ispravan HTML. Pokušajte ponovno ili reformulirajte zahtjev.' };
        }

        // 10. Save edit history
        const editHistory = Array.isArray(project.editHistory) ? project.editHistory : [];
        editHistory.push({
            timestamp: new Date().toISOString(),
            request: editRequest,
            success: true,
            tokensConsumed: TOKENS_PER_EDIT,
            htmlSnapshot: currentHtml,
            pageSlug,
        });

        // 11. Update database
        const finalHtml = injectContactFormScript(modifiedHtml, projectId);

        if (isSubpage) {
            // Update the specific subpage in reactFiles
            const updatedReactFiles = { ...reactFiles, [pageSlug]: finalHtml };
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
                    generatedHtml: finalHtml,
                    editHistory: editHistory as any,
                    lastEditedAt: new Date(),
                }
            });
        }

        // 12. Deduct tokens
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                editorTokens: { decrement: TOKENS_PER_EDIT },
                editorTokensUsed: { increment: TOKENS_PER_EDIT }
            }
        });

        console.log(`✅ Edit applied successfully (${conversationHistory.length + 1} turn conversation)`);

        revalidatePath(`/dashboard/projects/${projectId}/editor`);

        return {
            success: true,
            updatedHtml: finalHtml,
            message: parsed.summary,
            suggestion: parsed.suggestion,
            tokensRemaining: userTokens - TOKENS_PER_EDIT,
            tokensConsumed: TOKENS_PER_EDIT,
            // Return the conversation entries so client can accumulate
            conversationEntry: {
                userMessage: editRequest,
                assistantMessage: parsed.summary,
            }
        };

    } catch (error: any) {
        console.error('❌ Edit error:', error);

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

        if (error.message === 'AI timeout') {
            return { error: 'Zahtjev je predugo trajao. Pokušajte ponovo ili skratite zahtjev.' };
        }

        return {
            error: `Greška: ${error.message || 'Pokušajte reformulirati zahtjev.'}`
        };
    }
}

// ─── Undo last edit ───────────────────────────────────────────────────────────
export async function undoLastEditAction(projectId: string, pageSlug: string = 'home') {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return { error: 'Niste prijavljeni.' };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    const isAdmin = currentUser?.role === 'ADMIN';
    const project = await prisma.project.findUnique({
        where: isAdmin ? { id: projectId } : { id: projectId, userId: session.user.id }
    });

    if (!project) {
        return { error: 'Projekt nije pronađen.' };
    }

    const history = Array.isArray(project.editHistory) ? project.editHistory : [];

    // Filter edits for this specific page
    const isSubpage = pageSlug !== 'home';
    const pageEdits = history.filter((edit: any) =>
        edit.success && (edit.pageSlug || 'home') === pageSlug
    );

    if (pageEdits.length === 0) {
        return { error: 'Nema izmjena za poništiti.' };
    }

    const lastEdit = pageEdits[pageEdits.length - 1];
    const editIdx = history.lastIndexOf(lastEdit);

    if (isSubpage) {
        const reactFiles = (project.reactFiles || {}) as Record<string, string>;
        const updatedReactFiles = { ...reactFiles, [pageSlug]: (lastEdit as any).htmlSnapshot };
        await prisma.project.update({
            where: { id: projectId },
            data: {
                reactFiles: updatedReactFiles as any,
                editHistory: history.slice(0, editIdx) as any
            }
        });
    } else {
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: (lastEdit as any).htmlSnapshot,
                editHistory: history.slice(0, editIdx) as any
            }
        });
    }

    revalidatePath(`/dashboard/projects/${projectId}/editor`);

    return {
        success: true,
        updatedHtml: (lastEdit as any).htmlSnapshot,
        message: 'Posljednja izmjena poništena.'
    };
}
