import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

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
            select: { buyoutStatus: true, exportExpiresAt: true, name: true },
        });

        if (!project) {
            return Response.json({ error: 'Projekt nije pronađen.' }, { status: 404 });
        }

        if (project.buyoutStatus !== 'EXPORTED_LOCKED') {
            return Response.json({ error: 'Projekt nije u statusu za prebacivanje.' }, { status: 400 });
        }

        // Check if 90-day window has expired
        if (project.exportExpiresAt && new Date(project.exportExpiresAt) < new Date()) {
            return Response.json({ error: 'Rok za prebacivanje je istekao.' }, { status: 410 });
        }

        // Create a Stripe Checkout session for yearly maintenance only
        // (buyout was already paid, this is just the maintenance subscription)
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer_email: session.user.email,
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_YEARLY_MAINTENANCE,
                    quantity: 1,
                },
            ],
            metadata: {
                type: 'switch_to_maintenance',
                projectId,
                userId: session.user.id,
            },
            success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}/settings?switched=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}/settings`,
        });

        return Response.json({ url: checkoutSession.url });

    } catch (error) {
        console.error('Switch to maintenance error:', error);
        return Response.json({ error: 'Greška pri kreiranju narudžbe.' }, { status: 500 });
    }
}
