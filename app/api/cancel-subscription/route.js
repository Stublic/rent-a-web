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

    // Verify the user owns this project
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
        return Response.json({ error: 'Ovaj projekt nema aktivnu pretplatu.' }, { status: 400 });
    }

    try {
        // If project was bought out + maintained, use cancel_at_period_end 
        // so user keeps access until the billing period ends
        if (project.buyoutStatus === 'MAINTAINED') {
            const sub = await stripe.subscriptions.update(project.stripeSubscriptionId, {
                cancel_at_period_end: true,
            });

            // Calculate when the subscription will actually end
            // billing_cycle_anchor + 1 year for yearly subscriptions
            const anchorTs = sub.billing_cycle_anchor || sub.created;
            const endDate = new Date(anchorTs * 1000);
            endDate.setFullYear(endDate.getFullYear() + 1);
            while (endDate < new Date()) {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            console.log(`✅ MAINTAINED subscription set to cancel at period end: ${endDate.toISOString()}`);

            return Response.json({
                success: true,
                message: `Pretplata je otkazana. Vaš projekt ostaje aktivan do ${endDate.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
                cancelAtPeriodEnd: true,
                periodEndDate: endDate.toISOString(),
            });
        }

        // Normal cancel flow — immediately cancel in Stripe
        await stripe.subscriptions.cancel(project.stripeSubscriptionId);
        await prisma.project.update({
            where: { id: project.id },
            data: {
                stripeSubscriptionId: null,
                cancelledAt: new Date(),
                deletionReminders: '',
            }
        });

        console.log(`✅ Subscription cancelled for project: ${project.name} (${project.id})`);

        return Response.json({ success: true, message: 'Pretplata je uspješno otkazana.' });
    } catch (error) {
        console.error('❌ Cancel subscription error:', error);

        // If Stripe says it's already cancelled, still update our DB
        if (error.code === 'resource_missing' || error.statusCode === 404) {
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    stripeSubscriptionId: null,
                    cancelledAt: new Date(),
                    deletionReminders: '',
                }
            });
            return Response.json({ success: true, message: 'Pretplata je već otkazana.' });
        }

        return Response.json({ error: 'Greška pri otkazivanju pretplate.' }, { status: 500 });
    }
}
