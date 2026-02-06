import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    const body = await req.text();
    const headerList = await headers();
    const signature = headerList.get('stripe-signature');

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            const customer = await stripe.customers.retrieve(session.customer);

            const formData = new URLSearchParams();
            formData.append('token', process.env.SOLO_API_TOKEN.trim());
            formData.append('tip_usluge', '1');
            formData.append('tip_racuna', '3');

            const isBusiness = !!(customer.name || session.customer_details?.name) && !!customer.tax_ids?.data?.length;
            formData.append('tip_kupca', isBusiness ? '2' : '1');

            formData.append('kupac_naziv', customer.name || session.customer_details?.name || 'Nepoznat kupac');
            formData.append('kupac_email', customer.email || session.customer_details?.email || '');
            formData.append('kupac_adresa', customer.address?.line1 || '');

            // USER IS NOT IN VAT SYSTEM: Send full amount, set tax to 0
            const brutoAmount = session.amount_total / 100;
            const formattedAmount = brutoAmount.toFixed(2).replace('.', ',');

            formData.append('usluga', '1');
            formData.append('opis_usluge_1', session.line_items?.data[0]?.description || 'Najam web stranice');
            formData.append('cijena_1', formattedAmount);
            formData.append('kolicina_1', '1');
            formData.append('popust_1', '0');
            formData.append('porez_stopa_1', '0');

            formData.append('nacin_placanja', '3'); // Kartice
            formData.append('valuta_racuna', '14'); // EUR
            formData.append('napomene', `Plaćeno karticom putem Stripe-a. Obveznik nije u sustavu PDV-a prema čl. 90. st. 1. i 2. Zakona o PDV-u. PDV nije obračunat. (Subscription: ${session.id})`);

            console.log('API: Sending request to SOLO (Price Fix Applied)...');

            const soloResponse = await fetch('https://api.solo.com.hr/racun', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            const result = await soloResponse.json();
            console.log('SOLO API FULL RESPONSE:', JSON.stringify(result));

            if (result.status === 0) {
                // CORRECT PATH: result.racun.pdf
                const invoiceUrl = (result.racun && result.racun.pdf) || result.pdf || '';
                const customerEmail = customer.email || session.customer_details?.email;

                if (customerEmail) {
                    try {
                        const nodemailer = (await import('nodemailer')).default;
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: process.env.SMTP_USER,
                                pass: process.env.SMTP_PASSWORD,
                            },
                        });

                        await transporter.sendMail({
                            from: process.env.SMTP_FROM,
                            to: customerEmail,
                            subject: 'Vaš račun - Rent a Web',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                    <h2 style="color: #22c55e;">Hvala na narudžbi!</h2>
                                    <p>Plaćanje od <strong>${brutoAmount.toFixed(2)} €</strong> je uspješno obrađeno.</p>
                                    <p>Vaš službeni račun možete preuzeti klikom na gumb ispod:</p>
                                    ${invoiceUrl ? `
                                    <div style="margin: 30px 0;">
                                        <a href="${invoiceUrl}" style="background-color: #22c55e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Preuzmi račun (PDF)</a>
                                    </div>
                                    <p style="font-size: 12px; color: #999;">Ako gumb ne radi, kopirajte ovaj link u preglednik:<br>${invoiceUrl}</p>
                                    ` : '<p>Obrađujemo vaš PDF račun, bit će vam dostupan u vašem web profilu ili putem naknadnog maila.</p>'}
                                    <p style="margin-top: 30px; color: #666;">Srdačan pozdrav,<br><strong>Rent a Web tim</strong></p>
                                </div>
                            `,
                        });
                        console.log(`API: Email sent to ${customerEmail}. Invoice link: ${invoiceUrl}`);
                    } catch (emailError) {
                        console.error('Error sending email:', emailError.message);
                    }
                }
            }
        } catch (error) {
            console.error('Webhook Error:', error.message);
        }
    }

    return Response.json({ received: true });
}
