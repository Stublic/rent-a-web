import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Rate limiting ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { windowStart: number; count: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now - entry.windowStart > RATE_WINDOW) {
        rateLimitMap.set(key, { windowStart: now, count: 1 });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// ─── POST — receive contact form submission ────────────────────
export async function POST(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        // CORS — allow requests from any webica.hr subdomain or custom domain
        const origin = req.headers.get('origin') ?? '';
        const allowedOrigin =
            origin.endsWith('.webica.hr') ||
                origin === 'https://webica.hr' ||
                process.env.NODE_ENV === 'development'
                ? origin
                : 'https://webica.hr';

        const body = await req.json();
        const { name, email, phone, message, _gotcha } = body;

        // Honeypot — bots fill this hidden field
        if (_gotcha) {
            return NextResponse.json({ success: true }); // Silently discard
        }

        // Validate required fields
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return NextResponse.json(
                { error: 'Ime, email i poruka su obavezni.' },
                { status: 400 }
            );
        }

        // Basic email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Email adresa nije ispravna.' },
                { status: 400 }
            );
        }

        // Rate limit per IP per project
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(`contact:${projectId}:${ip}`)) {
            return NextResponse.json(
                { error: 'Previše zahtjeva. Pokušajte ponovno za sat vremena.' },
                { status: 429 }
            );
        }

        // Verify project exists and get owner email
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, name: true, user: { select: { email: true } } },
        });

        if (!project) {
            return NextResponse.json({ error: 'Projekt nije pronađen.' }, { status: 404 });
        }

        // Save to DB
        await prisma.contactSubmission.create({
            data: {
                projectId,
                name: name.trim().slice(0, 200),
                email: email.trim().slice(0, 200),
                phone: phone?.trim().slice(0, 50) || null,
                message: message.trim().slice(0, 5000),
            },
        });

        // Send email to site owner via Resend
        const ownerEmail = project.user.email;
        if (ownerEmail && process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'Webica <noreply@webica.hr>',
                to: ownerEmail,
                replyTo: email,
                subject: `📩 Novi upit — ${project.name} (${name})`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 32px 24px;">
                        <div style="background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                            <div style="margin-bottom: 24px;">
                                <span style="background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Novi upit</span>
                                <h1 style="margin: 12px 0 4px; font-size: 22px; color: #111827;">${project.name}</h1>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">Netko je ispunio kontakt formu na vašoj web stranici.</p>
                            </div>

                            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 100px; font-weight: 500;">Ime</td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500;">Email</td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
                                </tr>
                                ${phone ? `<tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-weight: 500;">Telefon</td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${phone}</td>
                                </tr>` : ''}
                                <tr>
                                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500; vertical-align: top;">Poruka</td>
                                    <td style="padding: 12px 0; color: #111827; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
                                </tr>
                            </table>

                            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center;">
                                <a href="https://webica.hr/dashboard" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Pogledaj u dashboardu →</a>
                            </div>
                        </div>
                        <p style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                            Webica · <a href="https://webica.hr" style="color: #9ca3af;">webica.hr</a>
                        </p>
                    </div>
                `,
            }).catch(err => console.error('Resend error:', err.message));
        }

        return NextResponse.json(
            { success: true },
            {
                headers: {
                    'Access-Control-Allow-Origin': allowedOrigin,
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            }
        );

    } catch (error: any) {
        console.error('Contact submission error:', error);
        return NextResponse.json(
            { error: 'Greška pri slanju. Pokušajte ponovno.' },
            { status: 500 }
        );
    }
}

// ─── GET — list submissions for project owner ──────────────────
export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const { auth } = await import('@/lib/auth');
        const { headers } = await import('next/headers');
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership (admin can see all)
        const isAdmin = (session.user as any).role === 'ADMIN';
        const project = isAdmin
            ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
            : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true } });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        const submissions = await prisma.contactSubmission.findMany({
            where: { projectId, ...(unreadOnly ? { read: false } : {}) },
            orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await prisma.contactSubmission.count({
            where: { projectId, read: false },
        });

        return NextResponse.json({ submissions, unreadCount });

    } catch (error: any) {
        console.error('Get submissions error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// ─── OPTIONS — CORS preflight ──────────────────────────────────
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
