import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const customer = await stripe.customers.retrieve(session.customer);

        return Response.json({
            email: customer.email || session.customer_details?.email || '',
            name: customer.name || session.customer_details?.name || '',
        });
    } catch (err) {
        console.error('Error fetching stripe session:', err);
        return Response.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}
