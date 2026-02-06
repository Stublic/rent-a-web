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

            // SOLO API v2.0 parameters
            const formData = new URLSearchParams();
            formData.append('token', process.env.SOLO_API_TOKEN.trim());
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
            formData.append('popust_1', '0');
            formData.append('porez_stopa_1', '25');

            formData.append('nacin_placanja', '3'); // 3 = Kartice
            formData.append('valuta_racuna', '14'); // 14 = EUR
            formData.append('napomene', `Stripe: ${session.id}`);

            console.log('API: Sending request to SOLO...');

            const soloResponse = await fetch('https://api.solo.com.hr/racun', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const result = await soloResponse.json();
            console.log('SOLO API Response:', JSON.stringify(result));

            if (result.status === 0) {
                console.log('SOLO Invoice created successfully!');

                // Send email to customer with invoice
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

                        const invoiceUrl = result.pdf || '';

                        await transporter.sendMail({
                            from: process.env.SMTP_FROM,
                            to: customerEmail,
                            subject: 'Vaš račun - Rent a Web',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333 text-align: left;">
                                    <h2 style="color: #22c55e;">Hvala na narudžbi!</h2>
                                    <p>Vaše plaćanje je uspješno obrađeno. U privitku (poveznici) dostavljamo vaš račun.</p>
                                    ${invoiceUrl ? `
                                    <div style="margin: 20px 0;">
                                        <a href="${invoiceUrl}" style="background-color: #22c55e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Preuzmi račun (PDF)</a>
                                    </div>
                                    ` : ''}
                                    <p style="margin-top: 30px; color: #666;">
                                        Srdačan pozdrav,<br>
                                        <strong>Rent a Web tim</strong>
                                    </p>
                                </div>
                            `,
                        });
                        console.log(`API: Invoice email sent to ${customerEmail}`);
                    } catch (emailError) {
                        console.error('Error sending invoice email:', emailError.message);
                    }
                }
            } else {
                console.error('SOLO API Error:', result.message || 'Unknown error');
            }

        } catch (error) {
            console.error('Error in SOLO webhook:', error.message);
        }
    }

    return Response.json({ received: true });
}
