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
        if (user.stripeCustomerId) {
            try {
                const invoiceList = await stripe.invoices.list({
                    customer: user.stripeCustomerId,
                    limit: 12, // Last 12 invoices
                });

                invoices = invoiceList.data.map(invoice => ({
                    id: invoice.id,
                    date: new Date(invoice.created * 1000).toLocaleDateString("hr-HR"),
                    amount: (invoice.total / 100).toFixed(2),
                    currency: invoice.currency.toUpperCase(),
                    status: invoice.status,
                    pdfUrl: invoice.hosted_invoice_url
                }));
            } catch (stripeError) {
                console.error("Stripe fetch error:", stripeError);
                // Return empty list on error to not break page
            }
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
