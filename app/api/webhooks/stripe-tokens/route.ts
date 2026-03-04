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
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Uspješna kupnja!</h1>
                                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Vaši AI tokeni su spremni</p>
                            </div>
                            
                            <div style="background: #fafafa; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
                                <p style="font-size: 16px; margin-top: 0;">Pozdrav,</p>
                                <p style="font-size: 15px; line-height: 1.6;">Vaša kupnja dodatnih tokena je uspješno provedena. Sada imate još više slobode za kreativno oblikovanje vaše web stranice uz našeg AI asistenta!</p>
                                
                                <div style="background: white; border: 1px solid #e5e5e5; border-left: 4px solid #7c3aed; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                    <h2 style="margin-top: 0; color: #7c3aed; font-size: 18px;">Detalji kupnje:</h2>
                                    <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Količina:</strong></td>
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

                                <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                                    Tokeni su već na vašem računu. Podsjećamo da svaka strukturna ili dizajnerska AI promjena u Editoru troši samo 50 tokena, dok brze uređivačke poteze uvijek možete raditi u potpuno besplatnom Vizualnom Editoru.
                                </p>

                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login?redirect=/dashboard/projects/${projectId}/editor" 
                                       style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
                                        Otvori AI Editor
                                    </a>
                                </div>

                                ${invoiceUrl ? `
                                <p style="font-size: 13px; color: #666; text-align: center; margin-top: 20px;">
                                    <a href="${invoiceUrl}" style="color: #7c3aed; text-decoration: none; font-weight: 500;">Preuzmite račun (PDF) ↓</a>
                                </p>
                                ` : ''}

                                <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                                    Srdačan pozdrav,<br><strong>Rent a webica tim</strong>
                                </p>
                            </div>
                        </div>
                    `;

                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || 'Rent a webica <noreply@rentaweb.hr>',
                        to: customerEmail,
                        subject: `🚀 Uspješna kupnja ${tokens} AI tokena${invoiceNumber ? ` - Račun ${invoiceNumber}` : ''}`,
                        html: emailHtml,
                        attachments: invoiceUrl ? [
                            {
                                filename: `Racun - ${invoiceNumber}.pdf`,
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
