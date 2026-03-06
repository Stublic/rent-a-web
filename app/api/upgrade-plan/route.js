import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: 'Niste prijavljeni.' }, { status: 401 });
        }

        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Nedostaje ID projekta.' }, { status: 400 });
        }

        // 1. Find the project and verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id }
        });

        if (!project) {
            return NextResponse.json({ error: 'Projekt nije pronađen.' }, { status: 404 });
        }

        // 2. Verify the project is on Starter plan
        const isStarter = project.planName?.toLowerCase().includes('starter');
        if (!isStarter) {
            return NextResponse.json({ error: 'Ovaj projekt već ima Advanced paket.' }, { status: 400 });
        }

        // 3. Verify project has an active Stripe subscription
        if (!project.stripeSubscriptionId) {
            return NextResponse.json({ error: 'Projekt nema aktivnu pretplatu.' }, { status: 400 });
        }

        const advancedPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED;
        if (!advancedPriceId) {
            return NextResponse.json({ error: 'Advanced cijena nije konfigurirana.' }, { status: 500 });
        }

        // 4. Retrieve the current subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(project.stripeSubscriptionId);

        if (subscription.status !== 'active') {
            return NextResponse.json({ error: 'Pretplata nije aktivna.' }, { status: 400 });
        }

        // 5. Update the subscription: swap the price with proration
        const currentItemId = subscription.items.data[0].id;

        const updatedSubscription = await stripe.subscriptions.update(
            project.stripeSubscriptionId,
            {
                items: [
                    {
                        id: currentItemId,
                        price: advancedPriceId,
                    },
                ],
                proration_behavior: 'create_prorations',
                metadata: {
                    ...(subscription.metadata || {}),
                    upgradeFromStarter: 'true',
                    projectId: projectId,
                },
            }
        );

        console.log(`🚀 Upgraded subscription ${project.stripeSubscriptionId} to Advanced for project ${projectId}`);

        // 6. Immediately update the project in our database
        //    (Don't wait for webhook — the API call was synchronous and successful)
        const advancedPlanName = 'Advanced - Landing stranica + Google oglasi';

        await prisma.project.update({
            where: { id: projectId },
            data: {
                planName: advancedPlanName,
            }
        });

        // 7. Update user plan name
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                planName: advancedPlanName,
            }
        });

        // 8. Grant 500 bonus AI tokens for upgrade
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                editorTokens: { increment: 500 }
            }
        });

        console.log(`🎁 Granted 500 upgrade bonus tokens to user ${session.user.id}`);
        console.log(`✅ Project ${projectId} upgraded to Advanced plan`);

        return NextResponse.json({
            success: true,
            newPlan: advancedPlanName,
            message: 'Uspješno ste nadogradili na Advanced paket! Dobili ste 500 bonus AI tokena.',
        });

    } catch (error) {
        console.error('❌ Upgrade error:', error);

        // Handle specific Stripe errors
        if (error.type === 'StripeCardError') {
            return NextResponse.json(
                { error: 'Kartica je odbijena. Molimo ažurirajte podatke za plaćanje.' },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Greška pri nadogradnji paketa.' },
            { status: 500 }
        );
    }
}
