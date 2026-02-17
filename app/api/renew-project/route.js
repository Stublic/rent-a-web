import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        // Find the project
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id }
        });

        if (!project) {
            return NextResponse.json({ error: "Projekt nije pronađen" }, { status: 404 });
        }

        // If the project has an active subscription but is still marked cancelled, reactivate it
        if (project.cancelledAt && project.stripeSubscriptionId) {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    cancelledAt: null,
                    deletionReminders: '',
                }
            });
            return NextResponse.json({ success: true, reactivated: true });
        }

        // If the project has cancelledAt but no subscription yet (webhook pending),
        // just clear cancelledAt optimistically — the webhook will set the subscription ID
        if (project.cancelledAt) {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    cancelledAt: null,
                    deletionReminders: '',
                }
            });
            return NextResponse.json({ success: true, reactivated: true });
        }

        return NextResponse.json({ success: true, reactivated: false });

    } catch (error) {
        console.error("Renew Project Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
