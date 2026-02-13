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
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const customerEmail = session.customer_email || session.customer_details?.email;

        // Skip if this is a token purchase (no subscription)
        if (!subscriptionId) {
            console.log('⏭️ Skipping token purchase event (no subscription ID)');
            return Response.json({ received: true });
        }

        try {
            // 1. Fetch subscription details
            // 1. Fetch subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0].price.id;

            console.log(`🔍 Processing Subscription: ${subscriptionId}`);
            console.log(`💰 Price ID from Stripe: ${priceId}`);
            console.log(`📋 Env Starter: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER}`);
            console.log(`📋 Env Advanced: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED}`);
            console.log(`📋 Env Webshop: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_WEBSHOP}`);

            // Map price ID to plan name
            let planName = "Custom";
            if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER) planName = "Starter - Landing stranica";
            else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED) planName = "Advanced - Landing stranica + Google oglasi";
            else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_WEBSHOP) planName = "Web Shop Start";

            console.log(`🏷️ Determined Plan Name: ${planName}`);

            console.log(`💰 Subscription created: ${planName} for ${customerEmail}`);

            // 2. Find or create user
            let user = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId }
            });

            if (!user && session.customer_email) {
                user = await prisma.user.findUnique({
                    where: { email: session.customer_email }
                });
            }

            if (user) {
                // Create new project for this subscription
                const projectCount = await prisma.project.count({
                    where: { userId: user.id }
                });
                const newProjectName = `${planName} Web`;

                const newProject = await prisma.project.create({
                    data: {
                        userId: user.id,
                        name: newProjectName,
                        planName: planName,
                        stripeSubscriptionId: subscriptionId,
                        status: 'DRAFT',
                    }
                });

                // Update user subscription status
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionStatus: subscription.status,
                        stripeCustomerId: customerId,
                        planName: planName
                    }
                });

                console.log(`✅ Created project: ${newProject.name} (${newProject.id})`);

                // 3. Solo fiscal receipt
                let invoiceNumber = null;
                let invoiceUrl = null;

                try {
                    const customer = await stripe.customers.retrieve(customerId);
                    const brutoAmount = session.amount_total / 100;
                    const formattedAmount = brutoAmount.toFixed(2).replace('.', ',');

                    console.log(`🧾 Creating Solo Invoice... Amount: ${formattedAmount}, Email: ${customerEmail}`);

                    const formData = new URLSearchParams();
                    formData.append('token', process.env.SOLO_API_TOKEN || '');
                    formData.append('tip_usluge', '1'); // Usluga (ne proizvod)
                    formData.append('tip_racuna', '1'); // Račun
                    formData.append('kupac_email', customerEmail || '');
                    formData.append('usluga', '1');
                    formData.append('opis_usluge_1', `Mjesečna pretplata - ${planName}`);
                    formData.append('cijena_1', formattedAmount);
                    formData.append('kolicina_1', '1');
                    formData.append('popust_1', '0');
                    formData.append('porez_stopa_1', '0');
                    formData.append('nacin_placanja', '3'); // Kartično
                    formData.append('valuta_racuna', '14'); // EUR
                    formData.append('napomene', `Plaćeno karticom putem Stripe-a. Obveznik nije u sustavu PDV-a prema čl. 90. st. 1. i 2. Zakona o PDV-u. (Sub: ${subscriptionId})`);

                    const soloResponse = await fetch('https://api.solo.com.hr/racun', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData.toString(),
                    });

                    const soloResult = await soloResponse.json();

                    console.log(`🧾 Solo API Response:`, JSON.stringify(soloResult));

                    if (soloResult.status === 0) {
                        invoiceNumber = soloResult.broj_racuna;
                        invoiceUrl = soloResult.pdf_url;
                        console.log(`✅ Fiscal receipt created: ${invoiceNumber}`);
                    } else {
                        console.error('❌ Solo API error:', soloResult);
                    }
                } catch (soloError) {
                    console.error('❌ Error creating fiscal receipt:', soloError.message);
                }

                // 4. Save invoice to database
                if (invoiceNumber) {
                    try {
                        await prisma.invoice.create({
                            data: {
                                userId: user.id,
                                projectId: newProject.id,
                                invoiceNumber: invoiceNumber,
                                amount: session.amount_total / 100,
                                description: `Pretplata - ${planName}`,
                                pdfUrl: invoiceUrl,
                                stripeSessionId: session.id,
                                type: 'SUBSCRIPTION',
                                status: 'PAID',
                            }
                        });
                        console.log(`✅ Invoice saved: ${invoiceNumber}`);
                    } catch (dbError) {
                        console.error('❌ Error saving invoice:', dbError.message);
                    }
                }

                // 5. Send confirmation email with invoice
                if (customerEmail) {
                    try {
                        const nodemailer = (await import('nodemailer')).default;
                        const transporter = nodemailer.createTransport({
                            host: process.env.SMTP_HOST,
                            port: parseInt(process.env.SMTP_PORT || '587'),
                            secure: process.env.SMTP_PORT === '465',
                            auth: {
                                user: process.env.SMTP_USER,
                                pass: process.env.SMTP_PASSWORD,
                            },
                        });

                        const emailHtml = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                    <h1 style="color: white; margin: 0;">✅ Vaša narudžba je potvrđena!</h1>
                                </div>
                                
                                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                                    <p style="font-size: 16px;">Hvala na povjerenju! Vaša pretplata je aktivna.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                                        <h2 style="margin-top: 0; color: #22c55e;">Detalji paketa:</h2>
                                        <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">${planName}</p>
                                        ${invoiceNumber ? `
                                        <p style="font-size: 14px; color: #666; margin: 5px 0;">Broj računa: <strong>${invoiceNumber}</strong></p>
                                        <p style="font-size: 14px; color: #666; margin: 5px 0;">Iznos: <strong>€${(session.amount_total / 100).toFixed(2).replace('.', ',')}</strong></p>
                                        ` : ''}
                                    </div>

                                    <p style="font-size: 14px; color: #666;">
                                        Sada se možete prijaviti na portal i nastaviti s radom.
                                    </p>

                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" 
                                           style="background-color: #22c55e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                            Prijavi se u Dashboard
                                        </a>
                                    </div>

                                    ${invoiceUrl ? `
                                    <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
                                        <a href="${invoiceUrl}" style="color: #22c55e;">Preuzmite račun (PDF)</a>
                                    </p>
                                    ` : ''}

                                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                                    
                                    <p style="font-size: 12px; color: #888;">
                                        Račun možete uvijek preuzeti u dashboardu pod "Povijest računa".
                                    </p>
                                </div>
                            </div>
                        `;

                        await transporter.sendMail({
                            from: process.env.SMTP_FROM || 'Rent a Web <noreply@rentaweb.hr>',
                            to: customerEmail,
                            subject: `✅ Potvrda narudžbe - ${planName} - Račun ${invoiceNumber || ''}`,
                            html: emailHtml,
                        });

                        console.log(`✅ Confirmation email sent to ${customerEmail}`);
                    } catch (emailError) {
                        console.error('❌ Error sending email:', emailError.message);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Webhook processing error:', error.message);
        }
    }

    return Response.json({ received: true });
}
