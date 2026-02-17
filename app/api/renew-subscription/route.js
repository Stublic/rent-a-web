import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Map planName back to Stripe price ID
function getPriceIdForPlan(planName) {
    if (!planName) return null;
    const name = planName.toLowerCase();
    if (name.includes('starter')) return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER;
    if (name.includes('advanced')) return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED;
    if (name.includes('growth') || name.includes('business') || name.includes('poduzetn')) return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS;
    // Fallback: try custom
    if (name.includes('custom')) return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER;
    return null;
}

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        // Find the cancelled project
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
            select: { planName: true, cancelledAt: true, name: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Projekt nije pronađen" }, { status: 404 });
        }

        if (!project.cancelledAt) {
            return NextResponse.json({ error: "Projekt nije otkazan" }, { status: 400 });
        }

        const priceId = getPriceIdForPlan(project.planName);

        if (!priceId) {
            return NextResponse.json({ error: "Nije moguće odrediti paket za obnovu" }, { status: 400 });
        }

        // Create Stripe checkout session for the same plan
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: session.user.stripeCustomerId,
            customer_email: session.user.stripeCustomerId ? undefined : session.user.email,
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&renewed=${projectId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
            metadata: {
                userId: session.user.id,
                renewProjectId: projectId,
                planName: project.planName,
            },
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error("Renew Subscription Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
