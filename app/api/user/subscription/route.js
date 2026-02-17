import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

        // Fetch all projects with subscription info
        const projects = await prisma.project.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                name: true,
                planName: true,
                stripeSubscriptionId: true,
                status: true,
                editorTokens: true,
                hasGenerated: true,
                cancelledAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch invoices
        let invoices = [];
        try {
            const dbInvoices = await prisma.invoice.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            invoices = dbInvoices.map(inv => ({
                id: inv.id,
                date: new Date(inv.createdAt).toLocaleDateString("hr-HR"),
                amount: inv.amount.toFixed(2),
                currency: "EUR",
                status: inv.status,
                pdfUrl: inv.pdfUrl,
                description: inv.description,
            }));
        } catch (dbError) {
            console.error("Database invoice fetch error:", dbError);
        }

        return NextResponse.json({
            subscriptionStatus: user.subscriptionStatus,
            planName: user.planName,
            projects,
            invoices
        });

    } catch (error) {
        console.error("Subscription API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
