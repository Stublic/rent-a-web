import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 1. Find users with a planName but NO projects
        const usersToMigrate = await prisma.user.findMany({
            where: {
                planName: { not: null },
                projects: { none: {} }
            }
        });

        const results = [];

        for (const user of usersToMigrate) {
            // Create a project for this user based on their profile data
            const project = await prisma.project.create({
                data: {
                    name: `${user.name || 'Moj'} Projekt`,
                    planName: user.planName,
                    status: 'DRAFT', // Or 'LIVE' if we assume they are active, but DRAFT is safer to trigger content gen
                    userId: user.id,
                    stripeSubscriptionId: null // We don't have this easily unless we fetch from Stripe, but let's leave it null for now or try to match if possible
                    // In a real scenario we might query StripeSubscription table, let's check that.
                }
            });

            // Try to link StripeSubscription if exists
            const sub = await prisma.stripeSubscription.findUnique({
                where: { email: user.email }
            });

            if (sub) {
                // Technically we should update the project with this ID if we had it, 
                // but the current StripeSubscription model doesn't strictly have the sub ID string as a primary key, 
                // it just has stripeCustomerId. 
                // For now, just creating the project record is enough to make it show up in the UI.
            }

            results.push({ email: user.email, projectId: project.id });
        }

        return NextResponse.json({
            message: `Migrated ${results.length} users.`,
            details: results
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
