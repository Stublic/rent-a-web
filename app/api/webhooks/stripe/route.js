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

        // ── Handle Google Ads Boost subscription ──
        if (session.metadata?.type === 'google_ads_boost') {
            const projectId = session.metadata?.projectId;
            console.log(`🎯 Google Ads Boost subscription for project: ${projectId}`);

            if (projectId) {
                try {
                    await prisma.googleAdsCampaign.upsert({
                        where: { projectId },
                        create: {
                            projectId,
                            status: 'PENDING',
                            stripeSubscriptionId: subscriptionId,
                        },
                        update: {
                            stripeSubscriptionId: subscriptionId,
                        },
                    });
                    console.log(`✅ Google Ads campaign linked to subscription: ${subscriptionId}`);
                } catch (err) {
                    console.error('❌ Error linking Google Ads subscription:', err.message);
                }
            }
            return Response.json({ received: true });
        }

        // ── Handle Website Buyout ──
        if (session.metadata?.type === 'website_buyout') {
            const projectId = session.metadata?.projectId;
            const buyoutOption = session.metadata?.option; // 'maintain' or 'export'
            const oldSubscriptionId = session.metadata?.oldSubscriptionId;

            console.log(`🏠 Website Buyout: option=${buyoutOption}, project=${projectId}`);

            if (projectId) {
                try {
                    // 1. Cancel the old monthly subscription
                    if (oldSubscriptionId) {
                        try {
                            await stripe.subscriptions.cancel(oldSubscriptionId);
                            console.log(`✅ Cancelled old monthly subscription: ${oldSubscriptionId}`);
                        } catch (cancelErr) {
                            // If already cancelled, that's fine
                            if (cancelErr.code !== 'resource_missing' && cancelErr.statusCode !== 404) {
                                console.error('⚠️ Error cancelling old subscription:', cancelErr.message);
                            }
                        }
                    }

                    if (buyoutOption === 'maintain') {
                        // Option 1: Buyout + Yearly Maintenance
                        // The new yearly subscription was created by Stripe Checkout
                        await prisma.project.update({
                            where: { id: projectId },
                            data: {
                                buyoutStatus: 'MAINTAINED',
                                stripeSubscriptionId: subscriptionId || null,
                                cancelledAt: null,
                                deletionReminders: '',
                            },
                        });
                        console.log(`✅ Project ${projectId} set to MAINTAINED with yearly sub: ${subscriptionId}`);
                    } else if (buyoutOption === 'export') {
                        // Option 2: Buyout & Code Export → Lock project
                        const exportExpiry = new Date();
                        exportExpiry.setDate(exportExpiry.getDate() + 90);

                        await prisma.project.update({
                            where: { id: projectId },
                            data: {
                                buyoutStatus: 'EXPORTED_LOCKED',
                                exportExpiresAt: exportExpiry,
                                stripeSubscriptionId: null,
                                cancelledAt: null,
                                deletionReminders: '',
                            },
                        });

                        // Unpublish the site (remove from Vercel)
                        try {
                            const project = await prisma.project.findUnique({
                                where: { id: projectId },
                                select: { subdomain: true, customDomain: true },
                            });

                            if (project?.subdomain) {
                                // Remove subdomain from Vercel
                                const vercelHeaders = {
                                    Authorization: `Bearer ${process.env.AUTH_VERCEL_TOKEN}`,
                                    'Content-Type': 'application/json',
                                };
                                const teamParam = process.env.TEAM_ID_VERCEL ? `?teamId=${process.env.TEAM_ID_VERCEL}` : '';

                                const fullDomain = `${project.subdomain}.${process.env.ROOT_DOMAIN || 'webica.hr'}`;
                                await fetch(
                                    `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains/${fullDomain}${teamParam}`,
                                    { method: 'DELETE', headers: vercelHeaders }
                                ).catch(() => { });

                                if (project.customDomain) {
                                    await fetch(
                                        `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains/${project.customDomain}${teamParam}`,
                                        { method: 'DELETE', headers: vercelHeaders }
                                    ).catch(() => { });
                                }
                                console.log(`✅ Unpublished site for project ${projectId}`);
                            }
                        } catch (unpubErr) {
                            console.error('⚠️ Error unpublishing site:', unpubErr.message);
                        }

                        // Clear publish state
                        await prisma.project.update({
                            where: { id: projectId },
                            data: {
                                publishedAt: null,
                                subdomain: null,
                                customDomain: null,
                            },
                        });

                        console.log(`✅ Project ${projectId} set to EXPORTED_LOCKED, expires: ${exportExpiry.toISOString()}`);
                    }

                    // Create Solo fiscal receipt for buyout
                    const buyoutAmount = session.amount_total / 100;
                    const buyoutEmail = session.customer_email || session.customer_details?.email;
                    try {
                        const formattedAmount = buyoutAmount.toFixed(2).replace('.', ',');
                        const formData = new URLSearchParams();
                        formData.append('token', process.env.SOLO_API_TOKEN || '');
                        formData.append('tip_usluge', '1');
                        formData.append('tip_racuna', '1');
                        formData.append('kupac_naziv', session.customer_details?.name || 'Kupac');
                        formData.append('kupac_email', buyoutEmail || '');
                        formData.append('usluga', '1');
                        formData.append('opis_usluge_1', `Otkup web stranice${buyoutOption === 'maintain' ? ' + godišnje održavanje' : ''}`);
                        formData.append('cijena_1', formattedAmount);
                        formData.append('kolicina_1', '1');
                        formData.append('popust_1', '0');
                        formData.append('porez_stopa_1', '0');
                        formData.append('nacin_placanja', '3');
                        formData.append('valuta_racuna', '14');
                        formData.append('napomene', `Otkup web stranice. Obveznik nije u sustavu PDV-a prema čl. 90. st. 1. i 2. Zakona o PDV-u.`);

                        const soloResponse = await fetch('https://api.solo.com.hr/racun', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: formData.toString(),
                        });
                        const soloResult = await soloResponse.json();
                        if (soloResult.status === 0) {
                            console.log(`✅ Buyout fiscal receipt: ${soloResult.racun?.broj_racuna}`);

                            // Find user for invoice record
                            const buyoutUser = await prisma.user.findFirst({
                                where: {
                                    OR: [
                                        { stripeCustomerId: session.customer },
                                        ...(buyoutEmail ? [{ email: buyoutEmail }] : []),
                                    ]
                                },
                                select: { id: true },
                            });

                            if (buyoutUser && soloResult.racun?.broj_racuna) {
                                await prisma.invoice.create({
                                    data: {
                                        userId: buyoutUser.id,
                                        projectId: projectId,
                                        invoiceNumber: soloResult.racun.broj_racuna,
                                        amount: buyoutAmount,
                                        description: `Otkup web stranice${buyoutOption === 'maintain' ? ' + godišnje održavanje' : ''}`,
                                        pdfUrl: soloResult.racun?.pdf || null,
                                        stripeSessionId: session.id,
                                        type: 'SUBSCRIPTION',
                                        status: 'PAID',
                                    },
                                });
                            }
                        }
                    } catch (soloErr) {
                        console.error('⚠️ Buyout Solo invoice error:', soloErr.message);
                    }
                } catch (err) {
                    console.error('❌ Error processing website buyout:', err.message);
                }
            }
            return Response.json({ received: true });
        }

        // ── Handle Switch to Maintenance (export → maintained) ──
        if (session.metadata?.type === 'switch_to_maintenance') {
            const projectId = session.metadata?.projectId;
            console.log(`🔄 Switch to Maintenance: project=${projectId}`);

            if (projectId) {
                try {
                    const project = await prisma.project.findUnique({
                        where: { id: projectId },
                        select: { buyoutStatus: true, exportExpiresAt: true, name: true },
                    });

                    if (project && project.buyoutStatus === 'EXPORTED_LOCKED') {
                        // Clear this subscription ID from other projects first (unique constraint)
                        if (subscriptionId) {
                            await prisma.project.updateMany({
                                where: { stripeSubscriptionId: subscriptionId, id: { not: projectId } },
                                data: { stripeSubscriptionId: null },
                            });
                        }

                        // Update project: switch to MAINTAINED, link new subscription
                        await prisma.project.update({
                            where: { id: projectId },
                            data: {
                                buyoutStatus: 'MAINTAINED',
                                stripeSubscriptionId: subscriptionId,
                                exportExpiresAt: null,
                            },
                        });

                        console.log(`✅ Project ${projectId} switched from EXPORTED_LOCKED to MAINTAINED`);
                    } else {
                        console.warn(`⚠️ Project ${projectId} is not in EXPORTED_LOCKED state, skipping.`);
                    }
                } catch (err) {
                    console.error('❌ Error switching to maintenance:', err.message);
                }
            }
            return Response.json({ received: true });
        }

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
            console.log(`📋 Env Business: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS}`);

            // Map price ID to plan name using env vars + hardcoded fallback
            const PRICE_PLAN_MAP = {
                [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER]: "Starter - Landing stranica",
                [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED]: "Advanced - Landing stranica + Google oglasi",
                [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS]: "Growth",
                // Hardcoded fallbacks in case env vars are not set
                'price_1SxaGbKhkXukXczcwVqlzrOx': "Starter - Landing stranica",
                'price_1SxaHAKhkXukXczc0cPpLMH2': "Advanced - Landing stranica + Google oglasi",
                'price_1T0S19KhkXukXczcZhmjaqSF': "Growth",
            };

            // Check if this is a renewal — use planName from metadata if available
            const renewProjectId = session.metadata?.renewProjectId;
            const metadataPlanName = session.metadata?.planName;

            let planName = metadataPlanName || PRICE_PLAN_MAP[priceId] || "Custom";

            // Skip yearly maintenance subscriptions — they're handled by switch_to_maintenance
            const yearlyMaintenancePrice = process.env.STRIPE_PRICE_YEARLY_MAINTENANCE || 'price_1T7JUUKhkXukXczc9nP3lKSW';
            if (priceId === yearlyMaintenancePrice) {
                console.log('⏭️ Skipping yearly maintenance price (handled by switch_to_maintenance)');
                return Response.json({ received: true });
            }

            // Also skip if metadata explicitly marks this as a maintenance switch or buyout
            if (session.metadata?.type === 'switch_to_maintenance' || session.metadata?.type === 'website_buyout') {
                console.log(`⏭️ Skipping ${session.metadata.type} (already handled above)`);
                return Response.json({ received: true });
            }

            // Skip "Custom" plan subscriptions that aren't renewals (likely unknown/maintenance prices)
            if (planName === 'Custom' && !renewProjectId && !metadataPlanName) {
                console.log('⏭️ Skipping unknown price ID (no matching plan, not a renewal):', priceId);
                return Response.json({ received: true });
            }

            console.log(`🏷️ Determined Plan Name: ${planName} (from ${metadataPlanName ? 'metadata' : 'price map'})`);
            console.log(`💰 Subscription created: ${planName} for ${customerEmail}`);
            if (renewProjectId) console.log(`🔄 Renewal request for project: ${renewProjectId}`);

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
                let newProject;

                if (renewProjectId) {
                    // Reactivate existing cancelled project
                    const existingProject = await prisma.project.findFirst({
                        where: { id: renewProjectId, userId: user.id }
                    });

                    if (existingProject) {
                        newProject = await prisma.project.update({
                            where: { id: renewProjectId },
                            data: {
                                stripeSubscriptionId: subscriptionId,
                                cancelledAt: null,
                                deletionReminders: '',
                                planName: planName,
                            }
                        });
                        console.log(`🔄 Renewed project: ${newProject.name} (${newProject.id})`);
                    } else {
                        // Project not found — try without userId filter (maybe user was found via different path)
                        const projectAny = await prisma.project.findUnique({
                            where: { id: renewProjectId }
                        });
                        if (projectAny) {
                            newProject = await prisma.project.update({
                                where: { id: renewProjectId },
                                data: {
                                    stripeSubscriptionId: subscriptionId,
                                    cancelledAt: null,
                                    deletionReminders: '',
                                    planName: planName,
                                }
                            });
                            console.log(`🔄 Renewed project (cross-user match): ${newProject.name} (${newProject.id})`);
                        } else {
                            console.log(`⚠️ Renewal requested but project ${renewProjectId} not found — skipping project creation`);
                        }
                    }
                    // NEVER create a new project for renewals — either reactivate or skip
                }


                if (!newProject && !renewProjectId) {
                    // Create new project ONLY for fresh subscriptions (NOT renewals)
                    const trialBusinessName = session.metadata?.trialBusinessName;
                    const trialBusinessDescription = session.metadata?.trialBusinessDescription;
                    const newProjectName = trialBusinessName || `${planName} Web`;

                    const projectData = {
                        userId: user.id,
                        name: newProjectName,
                        planName: planName,
                        stripeSubscriptionId: subscriptionId,
                        status: 'DRAFT',
                    };

                    // If trial data exists, pre-fill contentData
                    if (trialBusinessName) {
                        projectData.contentData = {
                            businessName: trialBusinessName,
                            businessDescription: trialBusinessDescription || '',
                        };
                        console.log(`🆓 Trial data attached: "${trialBusinessName}"`);
                    }

                    newProject = await prisma.project.create({ data: projectData });
                    console.log(`✅ Created project: ${newProject.name} (${newProject.id})${trialBusinessName ? ' [from trial]' : ''}`);
                }

                // Update user subscription status
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionStatus: subscription.status,
                        stripeCustomerId: customerId,
                        planName: planName
                    }
                });

                // Grant 500 initial tokens for new subscriptions (not renewals)
                if (!renewProjectId) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { editorTokens: { increment: 500 } }
                    });
                    console.log(`🎁 Granted 500 initial tokens to user ${user.id}`);

                    // ── Referral reward processing ──
                    const referralCode = session.metadata?.referralCode;
                    if (referralCode) {
                        try {
                            const referrer = await prisma.user.findUnique({
                                where: { referralCode },
                                select: { id: true, email: true }
                            });

                            if (referrer && referrer.id !== user.id) {
                                // Check the new user hasn't already been referred
                                const currentUser = await prisma.user.findUnique({
                                    where: { id: user.id },
                                    select: { referredById: true }
                                });

                                if (!currentUser?.referredById) {
                                    const REFERRAL_BONUS = 5000;

                                    // Award tokens to both users
                                    await prisma.user.update({
                                        where: { id: user.id },
                                        data: {
                                            editorTokens: { increment: REFERRAL_BONUS },
                                            referredById: referrer.id,
                                        }
                                    });

                                    await prisma.user.update({
                                        where: { id: referrer.id },
                                        data: {
                                            editorTokens: { increment: REFERRAL_BONUS },
                                            referralsCount: { increment: 1 },
                                        }
                                    });

                                    console.log(`🎉 Referral reward! ${referrer.email} → ${user.email || customerEmail} (+${REFERRAL_BONUS} tokens each)`);
                                } else {
                                    console.log(`ℹ️ User ${user.id} already referred — skipping referral reward`);
                                }
                            } else if (referrer?.id === user.id) {
                                console.log(`⚠️ Self-referral attempt by ${user.email || customerEmail} — skipping`);
                            } else {
                                console.log(`⚠️ Referral code "${referralCode}" not found — skipping reward`);
                            }
                        } catch (refErr) {
                            console.error('❌ Error processing referral reward:', refErr.message);
                        }
                    }
                }


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
                    formData.append('kupac_naziv', session.customer_details?.name || user.name || 'Kupac');
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
                        invoiceNumber = soloResult.racun?.broj_racuna;
                        invoiceUrl = soloResult.racun?.pdf;
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
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                                    <h1 style="color: white; margin: 0; font-size: 24px;">Dobrodošli!</h1>
                                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Vaša web stranica je u pripremi</p>
                                </div>
                                
                                <div style="background: #fafafa; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
                                    <p style="font-size: 16px; margin-top: 0;">Pozdrav,</p>
                                    <p style="font-size: 15px; line-height: 1.6;">Hvala vam na povjerenju! Vaša pretplata za paket <strong>${planName}</strong> je uspješno aktivirana i vaš je radni prostor spreman.</p>
                                    
                                    <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                        <p style="margin: 0; color: #6b21a8; font-size: 15px;">
                                            Kako bismo vam olakšali početak, na račun smo vam dodali <strong>500 AI tokena</strong> kao dobrodošlicu.
                                        </p>
                                    </div>

                                    <div style="background: white; border: 1px solid #e5e5e5; border-left: 4px solid #7c3aed; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                        <h2 style="margin-top: 0; color: #7c3aed; font-size: 16px;">Brzi savjet za uređivanje</h2>
                                        <p style="font-size: 14px; margin-bottom: 12px;">Rent a webica nudi dva sjajna načina za prilagodbu stranice:</p>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #4b5563;">
                                            <li><strong>Besplatni Vizualni Editor (Tab 'Sadržaj'):</strong> Savršen za trenutne izmjene tekstova, slika i kontakt podataka (ne troši tokene).</li>
                                            <li><strong>Moćni AI Editor:</strong> Vaš osobni asistent za dodavanje novih sekcija, promjenu cjelokupnog stila i strukture (troši 50 tokena po izmjeni).</li>
                                        </ul>
                                    </div>

                                    <p style="font-size: 15px;">Sada se možete prijaviti u svoj dashboard i oblikovati stranicu iz snova.</p>

                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" 
                                           style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
                                            Prijavi se u Dashboard
                                        </a>
                                    </div>

                                    ${invoiceUrl ? `
                                    <p style="font-size: 13px; color: #666; text-align: center; margin-top: 20px;">
                                        <a href="${invoiceUrl}" style="color: #7c3aed; text-decoration: none; font-weight: 500;">Preuzmite račun (PDF) ↓</a>
                                    </p>
                                    ` : ''}

                                    <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                                        Dobrodošli u obitelj!<br><strong>Rent a webica tim</strong>
                                    </p>
                                </div>
                            </div>
                        `;

                        await transporter.sendMail({
                            from: process.env.SMTP_FROM || 'Rent a webica <noreply@rentaweb.hr>',
                            to: customerEmail,
                            subject: `Dobrodošli! Vaša pretplata je aktivna${invoiceNumber ? ` - Račun ${invoiceNumber}` : ''}`,
                            html: emailHtml,
                            attachments: invoiceUrl ? [
                                {
                                    filename: `Racun - ${invoiceNumber}.pdf`,
                                    path: invoiceUrl
                                }
                            ] : []
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

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        console.log(`🗑️ Subscription deleted: ${subscriptionId}`);

        try {
            const project = await prisma.project.findFirst({
                where: { stripeSubscriptionId: subscriptionId }
            });

            if (project) {
                await prisma.project.update({
                    where: { id: project.id },
                    data: {
                        stripeSubscriptionId: null,
                        cancelledAt: project.cancelledAt || new Date(),
                        deletionReminders: project.deletionReminders || '',
                    }
                });
                console.log(`✅ Cleared subscription from project: ${project.name}(${project.id})`);
            } else {
                console.log(`⚠️ No project found for subscription: ${subscriptionId} `);
            }
        } catch (error) {
            console.error('❌ Error handling subscription deletion:', error.message);
        }
    }

    // Handle subscription status updates (e.g. canceled but not yet deleted, or plan upgrades)
    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        // ── Handle plan upgrade (Starter → Advanced) ──
        const newPriceId = subscription.items?.data?.[0]?.price?.id;
        const isUpgradeToAdvanced = newPriceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED
            || newPriceId === 'price_1SxaHAKhkXukXczc0cPpLMH2'; // hardcoded fallback

        if (isUpgradeToAdvanced && subscription.status === 'active') {
            console.log(`🚀 Plan upgrade detected for subscription: ${subscriptionId}`);

            try {
                const project = await prisma.project.findFirst({
                    where: { stripeSubscriptionId: subscriptionId }
                });

                if (project) {
                    const isCurrentlyStarter = project.planName?.toLowerCase().includes('starter');

                    if (isCurrentlyStarter) {
                        const advancedPlanName = 'Advanced - Landing stranica + Google oglasi';

                        // Update project plan
                        await prisma.project.update({
                            where: { id: project.id },
                            data: { planName: advancedPlanName }
                        });

                        // Update user plan + grant 500 bonus tokens (idempotent safety net)
                        await prisma.user.update({
                            where: { id: project.userId },
                            data: {
                                planName: advancedPlanName,
                                editorTokens: { increment: 500 }
                            }
                        });

                        console.log(`✅ Webhook: Project ${project.id} upgraded to Advanced + 500 bonus tokens`);
                    } else {
                        console.log(`ℹ️ Project ${project.id} already on plan: ${project.planName} — skipping upgrade`);
                    }
                }
            } catch (error) {
                console.error('❌ Error handling plan upgrade:', error.message);
            }
        }

        // ── Handle cancellation ──
        if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
            console.log(`⚠️ Subscription canceled / canceling: ${subscriptionId} `);

            try {
                const project = await prisma.project.findFirst({
                    where: { stripeSubscriptionId: subscriptionId }
                });

                if (project && subscription.status === 'canceled') {
                    await prisma.project.update({
                        where: { id: project.id },
                        data: {
                            stripeSubscriptionId: null,
                            cancelledAt: project.cancelledAt || new Date(),
                            deletionReminders: project.deletionReminders || '',
                        }
                    });
                    console.log(`✅ Cleared subscription from project: ${project.name} (${project.id})`);
                }
            } catch (error) {
                console.error('❌ Error handling subscription update:', error.message);
            }
        }
    }

    return Response.json({ received: true });
}
