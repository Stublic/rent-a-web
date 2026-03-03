import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_TOKENS!;

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const projectId = session.metadata?.projectId;
        const tokens = session.metadata?.tokens;
        const userId = session.metadata?.userId;
        const packageId = session.metadata?.packageId;

        if (!projectId || !tokens || !userId) {
            console.log('⏭️ Skipping event with missing metadata (likely subscription):', JSON.stringify(session.metadata));
            return NextResponse.json({ received: true });
        }

        const customerEmail = session.customer_email || session.customer_details?.email;
        const amountPaid = session.amount_total ? (session.amount_total / 100).toFixed(2).replace('.', ',') : '0,00';

        console.log(`💰 Token purchase completed: ${tokens} tokens for user ${userId}`);

        try {
            // 1. Add tokens to USER (account-level, shared across all projects)
            await prisma.user.update({
                where: { id: userId },
                data: {
                    editorTokens: { increment: parseInt(tokens) }
                }
            });

            console.log(`✅ Added ${tokens} tokens to user ${userId}`);

            // 2. Fiscal receipt via Solo API
            let invoiceNumber = null;
            let invoiceUrl = null;

            try {
                const formData = new URLSearchParams();
                formData.append('token', process.env.SOLO_API_TOKEN || '');
                formData.append('tip_usluge', '1'); // Usluga (ne proizvod)
                formData.append('tip_racuna', '1'); // Račun
                formData.append('kupac_email', customerEmail || '');
                formData.append('usluga', '1');
                formData.append('opis_usluge_1', `${tokens} Editor Tokena za AI uređivanje`);
                formData.append('cijena_1', amountPaid);
                formData.append('kolicina_1', '1');
                formData.append('popust_1', '0');
                formData.append('porez_stopa_1', '0');
                formData.append('nacin_placanja', '3'); // Kartično plaćanje
                formData.append('valuta_racuna', '14'); // EUR
                formData.append('kupac_naziv', session.customer_details?.name || 'Kupac');
                formData.append('kupac_email', customerEmail || '');
                formData.append('napomene', `Plaćeno karticom putem Stripe-a. Obveznik nije u sustavu PDV-a prema čl. 90. st. 1. i 2. Zakona o PDV-u. (Session: ${session.id})`);

                const soloResponse = await fetch('https://api.solo.com.hr/racun', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString(),
                });

                const soloResult = await soloResponse.json();

                if (soloResult.status === 0) {
                    invoiceNumber = soloResult.racun?.broj_racuna;
                    invoiceUrl = soloResult.racun?.pdf;
                    console.log(`✅ Fiscal receipt created: ${invoiceNumber}`);
                } else {
                    console.error('❌ Solo API error:', soloResult);
                }
            } catch (soloError: any) {
                console.error('❌ Error creating fiscal receipt:', soloError.message);
            }

            // 3. Save invoice to database
            if (invoiceNumber) {
                try {
                    await prisma.invoice.create({
                        data: {
                            userId: userId,
                            projectId: projectId,
                            invoiceNumber: invoiceNumber,
                            amount: parseFloat(amountPaid),
                            description: `${tokens} Editor Tokena`,
                            pdfUrl: invoiceUrl,
                            stripeSessionId: session.id,
                            type: 'TOKEN_PURCHASE',
                            status: 'PAID',
                        }
                    });
                    console.log(`✅ Invoice saved to database: ${invoiceNumber}`);
                } catch (dbError: any) {
                    console.error('❌ Error saving invoice:', dbError.message);
                }
            }

            // 4. Send confirmation email
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
                                <h1 style="color: white; margin: 0;">💰 Kupnja Tokena Uspješna!</h1>
                            </div>
                            
                            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p style="font-size: 16px;">Hvala na kupnji!</p>
                                
                                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                                    <h2 style="margin-top: 0; color: #22c55e;">Detalji kupnje:</h2>
                                    <table style="width: 100%; border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tokeni:</strong></td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${tokens} tokena</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Iznos:</strong></td>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">€${amountPaid}</td>
                                        </tr>
                                        ${invoiceNumber ? `
                                        <tr>
                                            <td style="padding: 8px 0;"><strong>Broj računa:</strong></td>
                                            <td style="padding: 8px 0; text-align: right;">${invoiceNumber}</td>
                                        </tr>
                                        ` : ''}
                                    </table>
                                </div>

                                <p style="font-size: 14px; color: #666;">
                                    Tokeni su automatski dodani na vaš projekt i možete ih odmah koristiti u AI Editoru.
                                </p>

                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login?redirect=/dashboard/projects/${projectId}/editor" 
                                       style="background-color: #22c55e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                        Otvori Editor
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
                        from: process.env.SMTP_FROM || 'Rent a webica <noreply@rentaweb.hr>',
                        to: customerEmail,
                        subject: `✅ Kupnja ${tokens} tokena - Račun ${invoiceNumber || ''}`,
                        html: emailHtml,
                        attachments: invoiceUrl ? [
                            {
                                filename: `Racun-${invoiceNumber}.pdf`,
                                path: invoiceUrl
                            }
                        ] : []
                    });

                    console.log(`✅ Confirmation email sent to ${customerEmail}`);
                } catch (emailError: any) {
                    console.error('❌ Error sending email:', emailError.message);
                }
            }

        } catch (error: any) {
            console.error('❌ Error processing token purchase:', error.message);
            return NextResponse.json({ error: 'Processing error' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
