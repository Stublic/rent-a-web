import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET — fetch project settings (contactEmail, etc.)
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

        const isAdmin = (session.user as any).role === 'ADMIN';
        const project = isAdmin
            ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, contactEmail: true, contentData: true, planName: true, reactFiles: true, generatedHtml: true, buyoutStatus: true, stripeSubscriptionId: true } })
            : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true, name: true, contactEmail: true, contentData: true, planName: true, reactFiles: true, generatedHtml: true, buyoutStatus: true, stripeSubscriptionId: true } });

        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const seoSettings = (project.contentData as any)?.seoSettings || null;
        const subpageKeys = project.reactFiles ? Object.keys(project.reactFiles as Record<string, string>) : [];

        // Auto-extract SEO from generated HTML if seoSettings.pages is empty
        let autoSeo: Record<string, { title?: string; description?: string }> = {};
        const extractMeta = (html: string | null) => {
            if (!html) return {};
            const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
            const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
            return {
                title: titleMatch ? titleMatch[1] : undefined,
                description: descMatch ? descMatch[1] : undefined,
            };
        };
        // Extract from homepage
        autoSeo['home'] = extractMeta(project.generatedHtml as string | null);
        // Extract from subpages
        const rf = (project.reactFiles as Record<string, string>) || {};
        for (const key of subpageKeys) {
            autoSeo[key] = extractMeta(rf[key]);
        }
        // Fetch maintenance subscription info if applicable
        let maintenanceInfo = null;
        if (project.buyoutStatus === 'MAINTAINED' && project.stripeSubscriptionId) {
            try {
                const { stripe } = await import('@/lib/stripe');
                const sub = await (stripe as any).subscriptions.retrieve(project.stripeSubscriptionId);

                // Newer Stripe API uses billing_cycle_anchor (no current_period_end)
                const anchorTs = sub.billing_cycle_anchor || sub.created;
                let nextBillingDate = null;
                if (anchorTs) {
                    const nextDate = new Date(anchorTs * 1000);
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    while (nextDate < new Date()) {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    }
                    nextBillingDate = nextDate.toISOString();
                }

                maintenanceInfo = {
                    nextBillingDate: sub.cancel_at_period_end ? null : nextBillingDate, // No next billing if cancelling
                    status: sub.status,
                    startDate: anchorTs ? new Date(anchorTs * 1000).toISOString() : null,
                    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
                    periodEndDate: sub.cancel_at_period_end ? nextBillingDate : null, // When access ends
                };
            } catch (e) {
                console.error('Failed to fetch maintenance sub info:', e);
            }
        }

        return NextResponse.json({ contactEmail: project.contactEmail ?? '', seoSettings, planName: project.planName || '', projectName: project.name || '', subpageKeys, autoSeo, buyoutStatus: project.buyoutStatus || 'NONE', hasSubscription: !!project.stripeSubscriptionId, maintenanceInfo });
    } catch (err) {
        console.error('GET project-settings error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PATCH — update contactEmail (and other project settings)
export async function PATCH(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { projectId, contactEmail } = body;

        if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

        // Validate email if provided
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            return NextResponse.json({ error: 'Email adresa nije ispravna.' }, { status: 400 });
        }

        // Verify ownership
        const isAdmin = (session.user as any).role === 'ADMIN';
        const existing = isAdmin
            ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
            : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id }, select: { id: true } });

        if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                contactEmail: contactEmail || null, // null = fall back to user.email
            },
            select: { id: true, contactEmail: true },
        });

        return NextResponse.json({ contactEmail: updated.contactEmail ?? '' });
    } catch (err) {
        console.error('PATCH project-settings error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
