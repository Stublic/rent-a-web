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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            const customer = await stripe.customers.retrieve(session.customer);

            // SOLO API v2.0 parameters
            const formData = new URLSearchParams();
            // We'll put the token in the URL, but also keep it here for safety
            formData.append('token', process.env.SOLO_API_TOKEN);
            formData.append('tip_usluge', '1');
            formData.append('tip_racuna', '3');

            const isBusiness = !!(customer.name || session.customer_details?.name) && !!customer.tax_ids?.data?.length;
            formData.append('tip_kupca', isBusiness ? '2' : '1');

            formData.append('kupac_naziv', customer.name || session.customer_details?.name || 'Nepoznat kupac');
            formData.append('kupac_email', customer.email || session.customer_details?.email || '');
            formData.append('kupac_adresa', customer.address?.line1 || '');

            const amount = (session.amount_total / 100).toFixed(2).replace('.', ',');

            formData.append('usluga', '1');
            formData.append('opis_usluge_1', session.line_items?.data[0]?.description || 'Najam web stranice');
            formData.append('cijena_1', amount);
            formData.append('kolicina_1', '1');
            formData.append('porez_stopa_1', '25');

            formData.append('nacin_placanja', '3'); // 3 = Kartice
            formData.append('valuta_racuna', '1'); // 1 = EUR
            formData.append('napomene', `Stripe: ${session.subscription || session.id}`);

            // Sending token in URL as query param is the most reliable way for SOLO API
            const soloUrl = `https://api.solo.com.hr/racun?token=${process.env.SOLO_API_TOKEN}`;

            console.log('API: Sending request to SOLO (Token in URL)...');

            const soloResponse = await fetch(soloUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const result = await soloResponse.json();
            console.log('SOLO API Raw Result:', JSON.stringify(result));

            if (result.status !== 0) {
                console.error('SOLO API Error:', result.message || 'Unknown error');
            } else {
                console.log('SOLO Invoice created successfully!');
            }

        } catch (error) {
            console.error('Error processing SOLO invoice:', error.message);
        }
    }

    return Response.json({ received: true });
}
