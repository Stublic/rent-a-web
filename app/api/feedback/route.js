import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const FEEDBACK_REWARD = 500;

export async function POST(req) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { answers } = await req.json();

        if (!answers || typeof answers !== 'object') {
            return Response.json({ error: 'Neispravni podaci.' }, { status: 400 });
        }

        // Check if user already submitted feedback before (for one-time reward)
        const existingFeedback = await prisma.feedback.findFirst({
            where: { userId: session.user.id },
        });

        await prisma.feedback.create({
            data: {
                userId: session.user.id,
                answers: JSON.stringify(answers),
            },
        });

        let tokensAwarded = 0;

        // Grant 500 tokens only on FIRST feedback
        if (!existingFeedback) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { editorTokens: { increment: FEEDBACK_REWARD } },
            });
            tokensAwarded = FEEDBACK_REWARD;
        }

        return Response.json({ success: true, tokensAwarded });

    } catch (error) {
        console.error('Feedback API Error:', error);
        return Response.json({ error: 'Greška pri spremanju feedbacka.' }, { status: 500 });
    }
}
