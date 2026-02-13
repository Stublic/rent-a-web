import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let invoices = [];
        try {
            console.log(`🔍 Fetching invoices for user: ${session.user.id}`);
            const dbInvoices = await prisma.invoice.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' },
                take: 12
            });

            invoices = dbInvoices.map(inv => ({
                id: inv.id,
                date: new Date(inv.createdAt).toLocaleDateString("hr-HR"),
                amount: inv.amount.toFixed(2),
                currency: "EUR",
                status: inv.status,
                pdfUrl: inv.pdfUrl
            }));
        } catch (dbError) {
            console.error("Database invoice fetch error:", dbError);
        }

        return NextResponse.json({
            subscriptionStatus: user.subscriptionStatus,
            planName: user.planName,
            invoices
        });

    } catch (error) {
        console.error("Subscription API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
