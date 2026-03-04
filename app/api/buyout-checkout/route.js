import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId, option } = await req.json();

        if (!projectId || !['maintain', 'export'].includes(option)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Verify project ownership and eligibility
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                userId: true,
                name: true,
                planName: true,
                hasGenerated: true,
                buyoutStatus: true,
                stripeSubscriptionId: true,
            },
        });

        if (!project || project.userId !== session.user.id) {
            return NextResponse.json({ error: 'Projekt nije pronađen.' }, { status: 403 });
        }

        if (project.buyoutStatus !== 'NONE') {
            return NextResponse.json({ error: 'Ovaj projekt je već otkupljen.' }, { status: 400 });
        }

        if (!project.hasGenerated) {
            return NextResponse.json({ error: 'Web stranica mora biti generirana prije otkupa.' }, { status: 400 });
        }

        // Determine buyout price based on plan
        const isAdvanced = project.planName?.toLowerCase().includes('advanced') || project.planName?.toLowerCase().includes('growth');
        const isStarter = project.planName?.toLowerCase().includes('starter');

        if (!isAdvanced && !isStarter) {
            return NextResponse.json({ error: 'Otkup je dostupan samo za Starter i Advanced pakete.' }, { status: 400 });
        }

        const buyoutPriceId = isAdvanced
            ? process.env.STRIPE_PRICE_BUYOUT_ADVANCED
            : process.env.STRIPE_PRICE_BUYOUT_STARTER;

        if (!buyoutPriceId) {
            return NextResponse.json({ error: 'Cijena otkupa nije konfigurirana.' }, { status: 500 });
        }

        const user = session.user;
        const hasStripeCustomer = typeof user.stripeCustomerId === 'string' && user.stripeCustomerId.trim().length > 0;

        const metadata = {
            userId: user.id,
            projectId: projectId,
            type: 'website_buyout',
            option: option,
            oldSubscriptionId: project.stripeSubscriptionId || '',
        };

        let checkoutSessionConfig;

        if (option === 'maintain') {
            // Option 1: One-time buyout fee + yearly maintenance subscription
            // Stripe Checkout supports mixing one-time and recurring line items in subscription mode
            const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY_MAINTENANCE;
            if (!yearlyPriceId) {
                return NextResponse.json({ error: 'Cijena održavanja nije konfigurirana.' }, { status: 500 });
            }

            checkoutSessionConfig = {
                ...(hasStripeCustomer
                    ? { customer: user.stripeCustomerId }
                    : { customer_email: user.email }
                ),
                mode: 'subscription',
                line_items: [
                    {
                        price: buyoutPriceId, // One-time buyout fee (added to first invoice)
                        quantity: 1,
                    },
                    {
                        price: yearlyPriceId, // Yearly maintenance subscription
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/settings?buyout=success&option=maintain`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/settings?buyout=canceled`,
                metadata,
            };
        } else {
            // Option 2: One-time buyout fee only (no subscription)
            checkoutSessionConfig = {
                ...(hasStripeCustomer
                    ? { customer: user.stripeCustomerId }
                    : { customer_email: user.email }
                ),
                mode: 'payment',
                line_items: [
                    {
                        price: buyoutPriceId,
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/settings?buyout=success&option=export`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/settings?buyout=canceled`,
                metadata,
            };
        }

        const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionConfig);

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error('Buyout Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
