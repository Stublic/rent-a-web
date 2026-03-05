import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const BUG_REPORT_REWARD = 500;

export async function POST(req) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, description, severity, page } = await req.json();

        if (!title || !description) {
            return NextResponse.json({ error: 'Naslov i opis su obavezni.' }, { status: 400 });
        }

        const validSeverities = ['low', 'medium', 'high', 'critical'];
        const sev = validSeverities.includes(severity) ? severity : 'medium';

        await prisma.bugReport.create({
            data: {
                userId: session.user.id,
                title: title.trim(),
                description: description.trim(),
                severity: sev,
                page: page || null,
            },
        });

        // Reward: +500 tokens for every bug report
        await prisma.user.update({
            where: { id: session.user.id },
            data: { editorTokens: { increment: BUG_REPORT_REWARD } },
        });

        return NextResponse.json({ success: true, tokensAwarded: BUG_REPORT_REWARD });
    } catch (error) {
        console.error('Bug Report API Error:', error);
        return NextResponse.json({ error: 'Greška pri spremanju.' }, { status: 500 });
    }
}
