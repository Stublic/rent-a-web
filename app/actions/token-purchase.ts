'use server';

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

import { TOKEN_PACKAGES } from '@/lib/constants';

export async function createTokenCheckoutSession(projectId: string, packageId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return { error: 'Niste prijavljeni.' };
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId, userId: session.user.id }
    });

    if (!project) {
        return { error: 'Projekt nije pronađen.' };
    }

    // Find package and add priceId from env
    const tokenPackage = TOKEN_PACKAGES.find(pkg => pkg.id === packageId);
    if (!tokenPackage) {
        return { error: 'Nevažeći paket tokena.' };
    }

    // Map price IDs from environment
    const priceIdMap: Record<string, string | undefined> = {
        'tokens_500': process.env.STRIPE_PRICE_TOKENS_500,
        'tokens_1500': process.env.STRIPE_PRICE_TOKENS_1500,
        'tokens_5000': process.env.STRIPE_PRICE_TOKENS_5000,
    };

    const priceId = priceIdMap[packageId];
    if (!priceId) {
        return { error: 'Stripe Price ID nije konfiguriran za ovaj paket.' };
    }

    try {
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/editor?token_purchase=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}/tokens?canceled=true`,
            metadata: {
                projectId: projectId,
                userId: session.user.id,
                tokens: tokenPackage.tokens.toString(),
                packageId: packageId,
            },
            customer_email: session.user.email,
        });

        return { url: checkoutSession.url };
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        return { error: 'Greška pri kreiranju checkout sesije.' };
    }
}
