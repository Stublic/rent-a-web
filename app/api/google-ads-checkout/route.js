import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const GOOGLE_ADS_BOOST_PRICE_ID = 'price_1T7IryKhkXukXczc1XSAfWxU';

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId } = await req.json();

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true, name: true, hasGenerated: true },
        });

        if (!project || project.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!project.hasGenerated) {
            return NextResponse.json({ error: 'Website must be generated first' }, { status: 400 });
        }

        // Check if already has an active subscription
        const existing = await prisma.googleAdsCampaign.findUnique({
            where: { projectId },
            select: { stripeSubscriptionId: true },
        });

        if (existing?.stripeSubscriptionId) {
            return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
        }

        // Create Stripe Checkout Session
        const user = session.user;
        const hasStripeCustomer = typeof user.stripeCustomerId === 'string' && user.stripeCustomerId.trim().length > 0;

        const checkoutSession = await stripe.checkout.sessions.create({
            ...(hasStripeCustomer
                ? { customer: user.stripeCustomerId }
                : { customer_email: user.email }
            ),
            mode: 'subscription',
            line_items: [
                {
                    price: GOOGLE_ADS_BOOST_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/inquiries?ads_paid=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/inquiries?ads_canceled=true`,
            metadata: {
                userId: user.id,
                projectId: projectId,
                type: 'google_ads_boost',
            },
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error('Google Ads Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
