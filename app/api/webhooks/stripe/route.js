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
        return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            const customer = await stripe.customers.retrieve(session.customer);

            // 1. CLEAN TOKEN (CRITICAL)
            const cleanToken = (process.env.SOLO_API_TOKEN || '').trim();

            const formData = new URLSearchParams();
            formData.append('token', cleanToken);
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

            formData.append('nacin_placanja', '3');
            formData.append('valuta_racuna', '1');
            formData.append('napomene', `Stripe: ${session.id}`);

            // 2. TRIPLE DELIVERY METHOD (URL + Header + Body)
            const soloUrl = `https://api.solo.com.hr/racun?token=${cleanToken}`;

            console.log(`API: Sending to SOLO with token starting with: ${cleanToken.substring(0, 5)}...`);

            const soloResponse = await fetch(soloUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'API-TOKEN': cleanToken, // Some legacy versions need this
                    'Authorization': `Bearer ${cleanToken}` // Some doku.hr versions might check this
                },
                body: formData.toString(),
            });

            const result = await soloResponse.json();
            console.log('SOLO API Final Response:', JSON.stringify(result));

        } catch (error) {
            console.error('Error in SOLO webhook:', error.message);
        }
    }

    return Response.json({ received: true });
}
