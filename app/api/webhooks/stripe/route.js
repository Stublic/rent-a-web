import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    const body = await req.text();
    const headerList = await headers();
    const signature = headerList.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            // Get customer details from session
            const customer = await stripe.customers.retrieve(session.customer);

            // Create invoice in SOLO
            const soloResponse = await fetch('https://api.solo.com.hr/racuni', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'API-Token': process.env.SOLO_API_TOKEN,
                },
                body: JSON.stringify({
                    tip_racuna: 'ponavljajuci', // Recurring invoice for subscription
                    kupac: {
                        naziv: customer.name || session.customer_details?.name || 'Nepoznat kupac',
                        email: customer.email || session.customer_details?.email,
                        adresa: customer.address?.line1 || '',
                        grad: customer.address?.city || '',
                        postanski_broj: customer.address?.postal_code || '',
                        drzava: customer.address?.country || 'HR',
                    },
                    stavke: [
                        {
                            opis: session.line_items?.data[0]?.description || 'Web pretplata',
                            kolicina: 1,
                            cijena: session.amount_total / 100, // Convert from cents
                            porez: 25, // VAT 25%
                        },
                    ],
                    nacin_placanja: 'kartica',
                    valuta: session.currency.toUpperCase(),
                    napomena: `Stripe Subscription ID: ${session.subscription}`,
                }),
            });

            if (!soloResponse.ok) {
                const errorData = await soloResponse.json();
                console.error('SOLO API error:', errorData);
                throw new Error('Failed to create SOLO invoice');
            }

            const soloInvoice = await soloResponse.json();
            console.log('SOLO invoice created:', soloInvoice);

            // Optional: Send confirmation email to customer
            // You can call your send-email API here if needed

        } catch (error) {
            console.error('Error processing webhook:', error);
            // Don't return error to Stripe - we've received the event
            // Log it for manual review instead
        }
    }

    return Response.json({ received: true });
}
