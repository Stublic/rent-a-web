import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: 'Niste prijavljeni.' }, { status: 401 });
        }

        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Nedostaje ID projekta.' }, { status: 400 });
        }

        // Verify ownership and MAINTAINED status
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id }
        });

        if (!project) {
            return NextResponse.json({ error: 'Projekt nije pronađen.' }, { status: 404 });
        }

        if (project.buyoutStatus !== 'MAINTAINED') {
            return NextResponse.json({ error: 'Projekt nije na godišnjem održavanju.' }, { status: 400 });
        }

        const isStarter = project.planName?.toLowerCase().includes('starter');
        if (!isStarter) {
            return NextResponse.json({ error: 'Projekt već ima Advanced paket.' }, { status: 400 });
        }

        // One-time payment for Starter → Advanced difference (600€)
        const priceId = 'price_1T7zZYKhkXukXczcUMjV8Iwx';

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { stripeCustomerId: true, email: true }
        });

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: user?.stripeCustomerId || undefined,
            customer_email: !user?.stripeCustomerId ? (user?.email || session.user.email) : undefined,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}/settings?upgraded=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}/settings`,
            metadata: {
                type: 'maintained_advanced_upgrade',
                projectId: projectId,
                userId: session.user.id,
            },
        });

        console.log(`🚀 Created maintained upgrade checkout for project ${projectId}: ${checkoutSession.id}`);

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error('❌ Maintained upgrade checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Greška pri kreiranju checkout sessiona.' },
            { status: 500 }
        );
    }
}
