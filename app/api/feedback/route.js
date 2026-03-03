import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

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

        await prisma.feedback.create({
            data: {
                userId: session.user.id,
                answers: JSON.stringify(answers),
            },
        });

        return Response.json({ success: true });

    } catch (error) {
        console.error('Feedback API Error:', error);
        return Response.json({ error: 'Greška pri spremanju feedbacka.' }, { status: 500 });
    }
}
