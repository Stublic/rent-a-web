import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
        return Response.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId: session.user.id
        }
    });

    if (!project) {
        return Response.json({ error: 'Projekt nije pronađen.' }, { status: 404 });
    }

    if (!project.stripeSubscriptionId) {
        return Response.json({ error: 'Nema aktivne pretplate za obnovu.' }, { status: 400 });
    }

    try {
        // Revert cancel_at_period_end back to false
        await stripe.subscriptions.update(project.stripeSubscriptionId, {
            cancel_at_period_end: false,
        });

        console.log(`✅ Reverted cancellation for project: ${project.name} (${project.id})`);

        return Response.json({
            success: true,
            message: 'Pretplata je obnovljena! Vaš projekt ostaje na godišnjem održavanju.'
        });
    } catch (error) {
        console.error('❌ Revert cancellation error:', error);
        return Response.json({ error: 'Greška pri obnovi pretplate.' }, { status: 500 });
    }
}
