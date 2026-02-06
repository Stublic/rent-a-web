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

    // Get the user from database to ensure we have the stripeCustomerId
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user || !user.stripeCustomerId) {
        return Response.json({ error: 'Nema aktivnog Stripe ID-a. Molimo kontaktirajte podršku.' }, { status: 400 });
    }

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${req.headers.get('origin')}/dashboard`,
        });

        return Response.json({ url: portalSession.url });
    } catch (error) {
        console.error('Portal session error:', error);
        return Response.json({ error: 'Greška pri otvaranju portala.' }, { status: 500 });
    }
}
