import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const { priceId } = await req.json();

        if (!priceId) {
            return Response.json({ error: 'Price ID is required' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.get('origin')}/auth/signup?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/#pricing`,
        });

        return Response.json({ url: session.url });
    } catch (err) {
        console.error('Stripe error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
