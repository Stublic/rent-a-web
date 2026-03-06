import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const BUG_REPORT_REWARD = 50;
const MAX_BUG_REPORTS = 20;

export async function POST(req) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check limit
        const existingCount = await prisma.bugReport.count({ where: { userId: session.user.id } });
        if (existingCount >= MAX_BUG_REPORTS) {
            return NextResponse.json({ error: 'Dosegnuli ste maksimalan broj bug reportova (20).' }, { status: 429 });
        }

        const formData = await req.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const severity = formData.get('severity');
        const page = formData.get('page');
        const screenshot = formData.get('screenshot');

        if (!title || !description) {
            return NextResponse.json({ error: 'Naslov i opis su obavezni.' }, { status: 400 });
        }

        const validSeverities = ['low', 'medium', 'high', 'critical'];
        const sev = validSeverities.includes(severity) ? severity : 'medium';

        // Upload screenshot to Vercel Blob if provided
        let screenshotUrl = null;
        if (screenshot && screenshot instanceof File && screenshot.size > 0) {
            const ext = screenshot.name.split('.').pop() || 'png';
            const filename = `bug-screenshots/${Date.now()}-${session.user.id}.${ext}`;
            const blob = await put(filename, screenshot, {
                access: 'public',
                contentType: screenshot.type || 'image/png',
            });
            screenshotUrl = blob.url;
        }

        await prisma.bugReport.create({
            data: {
                userId: session.user.id,
                title: title.trim(),
                description: description.trim(),
                severity: sev,
                page: page || null,
                screenshotUrl,
            },
        });

        // Reward: +50 tokens for every bug report
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
