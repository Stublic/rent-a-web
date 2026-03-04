'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// ─── Create a support ticket with chat history ─────────────────────────────────
export async function createSupportTicket(data: {
    subject: string;
    type: 'TECHNICAL' | 'BILLING';
    projectId?: string;
    chatHistory: Array<{ role: 'USER' | 'AI'; content: string }>;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: 'Niste prijavljeni.' };

    try {
        const ticket = await prisma.ticket.create({
            data: {
                userId: session.user.id,
                subject: data.subject,
                type: data.type,
                projectId: data.projectId || null,
                status: 'ESCALATED',
                messages: {
                    create: data.chatHistory.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                },
            },
            include: { messages: true },
        });

        console.log(`🎫 Support ticket created: ${ticket.id} — "${ticket.subject}" (${ticket.type})`);

        revalidatePath('/dashboard');
        return { success: true, ticketId: ticket.id };
    } catch (error: any) {
        console.error('❌ Error creating support ticket:', error);
        return { error: 'Greška pri kreiranju ticketa.' };
    }
}

// ─── Get current user's tickets ────────────────────────────────────────────────
export async function getMyTickets() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: 'Niste prijavljeni.' };

    try {
        const tickets = await prisma.ticket.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 1, // only latest for list preview
                },
                _count: { select: { messages: true } },
            },
        });

        return { tickets };
    } catch (error: any) {
        console.error('❌ Error fetching tickets:', error);
        return { error: 'Greška pri dohvaćanju ticketa.' };
    }
}

// ─── Get all messages for a specific ticket ────────────────────────────────────
export async function getTicketMessages(ticketId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: 'Niste prijavljeni.' };

    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id: ticketId, userId: session.user.id },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });

        if (!ticket) return { error: 'Ticket nije pronađen.' };

        return { ticket };
    } catch (error: any) {
        console.error('❌ Error fetching ticket messages:', error);
        return { error: 'Greška.' };
    }
}

// ─── Add a user reply to an existing ticket ────────────────────────────────────
export async function addTicketReply(ticketId: string, content: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: 'Niste prijavljeni.' };

    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id: ticketId, userId: session.user.id },
        });

        if (!ticket) return { error: 'Ticket nije pronađen.' };

        await prisma.ticketMessage.create({
            data: {
                ticketId,
                role: 'USER',
                content,
            },
        });

        // If ticket was resolved, reopen it
        if (ticket.status === 'RESOLVED') {
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { status: 'OPEN' },
            });
        }

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error adding ticket reply:', error);
        return { error: 'Greška.' };
    }
}
