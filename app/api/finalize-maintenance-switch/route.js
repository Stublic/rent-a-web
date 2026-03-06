import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// Called when user returns from Stripe checkout for maintenance switch
export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId } = await req.json();
        if (!projectId) {
            return Response.json({ error: 'Missing projectId' }, { status: 400 });
        }

        // Find the project
        const project = await prisma.project.findFirst({
            where: { id: projectId, userId: session.user.id },
            select: { buyoutStatus: true, exportExpiresAt: true },
        });

        if (!project) {
            return Response.json({ error: 'Projekt nije pronađen.' }, { status: 404 });
        }

        // Already switched?
        if (project.buyoutStatus === 'MAINTAINED') {
            return Response.json({ success: true, alreadySwitched: true });
        }

        if (project.buyoutStatus !== 'EXPORTED_LOCKED') {
            return Response.json({ error: 'Projekt nije u ispravnom statusu.' }, { status: 400 });
        }

        // Look for a recent successful checkout session for this project
        const checkoutSessions = await stripe.checkout.sessions.list({
            limit: 10,
        });

        const matchingSession = checkoutSessions.data.find(s =>
            s.metadata?.type === 'switch_to_maintenance' &&
            s.metadata?.projectId === projectId &&
            s.payment_status === 'paid'
        );

        if (!matchingSession) {
            return Response.json({ error: 'Plaćanje nije pronađeno. Pokušajte ponovo.' }, { status: 404 });
        }

        // Update the project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                buyoutStatus: 'MAINTAINED',
                stripeSubscriptionId: matchingSession.subscription,
                exportExpiresAt: null,
            },
        });

        console.log(`✅ Project ${projectId} switched from EXPORTED_LOCKED to MAINTAINED (sync)`);

        return Response.json({ success: true });

    } catch (error) {
        console.error('Finalize maintenance switch error:', error);
        return Response.json({ error: 'Greška pri ažuriranju.' }, { status: 500 });
    }
}
