import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { priceId, trialData } = await req.json();

        // Build metadata — include trial info if coming from /try flow
        const metadata = {
            userId: session.user.id,
        };
        if (trialData?.businessName) {
            metadata.trialBusinessName = trialData.businessName.substring(0, 500);
        }
        if (trialData?.businessDescription) {
            metadata.trialBusinessDescription = trialData.businessDescription.substring(0, 500);
        }

        // Create Checkout Session
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
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&fromTrial=${trialData ? 'true' : 'false'}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/new-project?canceled=true`,
            metadata,
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error("Checkout Session Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
