import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const body = await req.text();
    const headerList = await headers();
    const signature = headerList.get('stripe-signature');

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            const customer = await stripe.customers.retrieve(session.customer);
            const customerEmail = customer.email || session.customer_details?.email;

            // Get Plan Name (simple mapping)
            let planName = 'Starter';
            if (session.amount_total === 8900) planName = 'Advanced';
            if (session.amount_total === 19900) planName = 'Web Shop Start';

            console.log(`Webhook: Processing subscription for ${customerEmail} (Plan: ${planName})`);

            // 1. Sync to Database (Prisma)
            // We save to a separate table so we can link it during signup later.
            if (customerEmail) {
                await prisma.stripeSubscription.upsert({
                    where: { email: customerEmail },
                    update: {
                        stripeCustomerId: session.customer,
                        planName: planName,
                        status: 'active',
                    },
                    create: {
                        email: customerEmail,
                        stripeCustomerId: session.customer,
                        planName: planName,
                        status: 'active',
                    },
                });
                console.log(`Webhook: StripeSubscription synced for ${customerEmail}`);

                // Also update User if they already exist
                await prisma.user.updateMany({
                    where: { email: customerEmail },
                    data: {
                        subscriptionStatus: 'active',
                        stripeCustomerId: session.customer,
                        planName: planName,
                    }
                });
            }

            // 2. Original SOLO Invoice Logic
            const formData = new URLSearchParams();
            formData.append('token', process.env.SOLO_API_TOKEN.trim());
            formData.append('tip_usluge', '1');
            formData.append('tip_racuna', '3');

            const isBusiness = !!(customer.name || session.customer_details?.name) && !!customer.tax_ids?.data?.length;
            formData.append('tip_kupca', isBusiness ? '2' : '1');

            formData.append('kupac_naziv', customer.name || session.customer_details?.name || 'Nepoznat kupac');
            formData.append('kupac_email', customerEmail || '');
            formData.append('kupac_adresa', customer.address?.line1 || '');

            const brutoAmount = session.amount_total / 100;
            const formattedAmount = brutoAmount.toFixed(2).replace('.', ',');

            formData.append('usluga', '1');
            formData.append('opis_usluge_1', session.line_items?.data[0]?.description || `Pretplata - ${planName}`);
            formData.append('cijena_1', formattedAmount);
            formData.append('kolicina_1', '1');
            formData.append('popust_1', '0');
            formData.append('porez_stopa_1', '0');

            formData.append('nacin_placanja', '3');
            formData.append('valuta_racuna', '14');
            formData.append('napomene', `Plaćeno karticom putem Stripe-a. Obveznik nije u sustavu PDV-a prema čl. 90. st. 1. i 2. Zakona o PDV-u. (Sub: ${session.id})`);

            const soloResponse = await fetch('https://api.solo.com.hr/racun', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            const result = await soloResponse.json();

            if (result.status === 0) {
                const invoiceUrl = (result.racun && result.racun.pdf) || '';
                if (customerEmail) {
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
                        subject: 'Vaš račun i potvrda pretplate - Rent a Web',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                <h2 style="color: #22c55e;">Hvala na pretplati!</h2>
                                <p>Vaša narudžba za paket <strong>${planName}</strong> je uspješno obrađena.</p>
                                <p>Sada se možete registrirati ili prijaviti na naš portal kako biste započeli s izradom vašeg weba.</p>
                                <div style="margin: 30px 0;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signup" style="background-color: #22c55e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Registriraj se i kreni</a>
                                </div>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                                <p>Vaš službeni račun:</p>
                                ${invoiceUrl ? `<a href="${invoiceUrl}">Preuzmi račun (PDF)</a>` : '<p>Račun će biti dostupan u dashboardu.</p>'}
                            </div>
                        `,
                    });
                }
            }
        } catch (error) {
            console.error('Webhook Error:', error.message);
        }
    }

    return Response.json({ received: true });
}
