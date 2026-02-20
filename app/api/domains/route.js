import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
    addDomainToVercel,
    removeDomainFromVercel,
    getDomainConfig,
    verifyDomain,
    generateSubdomain,
} from '@/lib/vercel-domains';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'webica.hr';

// ─── POST: Publish site / Add custom domain ─────────────────────────

export async function POST(req) {
    let session;
    try {
        session = await auth.api.getSession({ headers: await headers() });
    } catch (e) {
        console.error('Domain API auth error:', e);
        return NextResponse.json({ error: 'Auth error' }, { status: 500 });
    }
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, action, customDomain } = await req.json();

    // Check if user is admin for bypass
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });
    const isAdmin = currentUser?.role === 'ADMIN';

    const project = isAdmin
        ? await prisma.project.findUnique({ where: { id: projectId } })
        : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    try {
        if (action === 'publish') {
            // Generate subdomain and publish
            if (project.publishedAt && project.subdomain) {
                return NextResponse.json({ error: 'Site is already published. Use republish to push content changes.' }, { status: 400 });
            }

            let subdomain = project.subdomain || generateSubdomain(project.name);

            // Ensure uniqueness
            const existing = await prisma.project.findFirst({
                where: { subdomain, id: { not: projectId } }
            });
            if (existing) {
                subdomain = `${subdomain}-${projectId.slice(-4)}`;
            }

            // Add subdomain to Vercel
            const domain = `${subdomain}.${ROOT_DOMAIN}`;
            await addDomainToVercel(domain);

            // Update project
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    subdomain,
                    publishedAt: new Date(),
                    status: 'PUBLISHED',
                }
            });

            return NextResponse.json({
                success: true,
                subdomain,
                url: `https://${domain}`,
            });

        } else if (action === 'republish') {
            // Content has changed — just bump publishedAt (HTML is already updated in DB)
            if (!project.subdomain || !project.publishedAt) {
                return NextResponse.json({ error: 'Site must be published first' }, { status: 400 });
            }

            await prisma.project.update({
                where: { id: projectId },
                data: { publishedAt: new Date() },
            });

            return NextResponse.json({ success: true });

        } else if (action === 'unpublish') {
            if (!project.subdomain) {
                return NextResponse.json({ error: 'Site is not published' }, { status: 400 });
            }

            // Remove subdomain from Vercel
            try {
                await removeDomainFromVercel(`${project.subdomain}.${ROOT_DOMAIN}`);
            } catch (e) {
                console.error('Error removing subdomain:', e);
            }

            // Remove custom domain if any
            if (project.customDomain) {
                try {
                    await removeDomainFromVercel(project.customDomain);
                } catch (e) {
                    console.error('Error removing custom domain:', e);
                }
            }

            await prisma.project.update({
                where: { id: projectId },
                data: {
                    publishedAt: null,
                    status: 'GENERATED',
                    // Keep subdomain for future re-publish
                }
            });

            return NextResponse.json({ success: true });

        } else if (action === 'add-custom-domain') {
            if (!customDomain) {
                return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
            }

            if (!project.publishedAt) {
                return NextResponse.json({ error: 'Publish the site first' }, { status: 400 });
            }

            // Clean domain
            const cleanDomain = customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/^www\./, '');

            // Check if already used
            const existingProject = await prisma.project.findFirst({
                where: { customDomain: cleanDomain, id: { not: projectId } }
            });
            if (existingProject) {
                return NextResponse.json({ error: 'Domain already in use' }, { status: 400 });
            }

            // Add to Vercel
            await addDomainToVercel(cleanDomain);

            // Update project
            await prisma.project.update({
                where: { id: projectId },
                data: { customDomain: cleanDomain }
            });

            return NextResponse.json({ success: true, customDomain: cleanDomain });

        } else if (action === 'remove-custom-domain') {
            if (!project.customDomain) {
                return NextResponse.json({ error: 'No custom domain' }, { status: 400 });
            }

            try {
                await removeDomainFromVercel(project.customDomain);
            } catch (e) {
                console.error('Error removing custom domain:', e);
            }

            await prisma.project.update({
                where: { id: projectId },
                data: { customDomain: null }
            });

            return NextResponse.json({ success: true });

        } else if (action === 'verify-domain') {
            if (!project.customDomain) {
                return NextResponse.json({ error: 'No custom domain' }, { status: 400 });
            }

            const config = await getDomainConfig(project.customDomain);
            const verification = await verifyDomain(project.customDomain);

            return NextResponse.json({
                domain: project.customDomain,
                config,
                verification,
                verified: verification?.verified || false,
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error) {
        console.error('Domain API error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

// ─── GET: Check domain status ────────────────────────────────────────

export async function GET(req) {
    let session;
    try {
        session = await auth.api.getSession({ headers: await headers() });
    } catch (e) {
        console.error('Domain API auth error:', e);
        return NextResponse.json({ error: 'Auth error' }, { status: 500 });
    }
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });
    const isAdmin = currentUser?.role === 'ADMIN';

    const selectFields = { subdomain: true, customDomain: true, publishedAt: true, updatedAt: true, status: true };
    const project = isAdmin
        ? await prisma.project.findUnique({ where: { id: projectId }, select: selectFields })
        : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id }, select: selectFields });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    let customDomainStatus = null;
    if (project.customDomain) {
        try {
            const config = await getDomainConfig(project.customDomain);
            customDomainStatus = {
                domain: project.customDomain,
                configured: config?.misconfigured === false,
                config,
            };
        } catch (e) {
            customDomainStatus = { domain: project.customDomain, configured: false, error: e.message };
        }
    }

    return NextResponse.json({
        published: !!project.publishedAt,
        publishedAt: project.publishedAt,
        updatedAt: project.updatedAt,
        hasUnpushedChanges: project.publishedAt && project.updatedAt
            ? (new Date(project.updatedAt).getTime() - new Date(project.publishedAt).getTime()) > 2000
            : false,
        subdomain: project.subdomain,
        subdomainUrl: project.subdomain ? `https://${project.subdomain}.${ROOT_DOMAIN}` : null,
        customDomain: project.customDomain,
        customDomainUrl: project.customDomain ? `https://${project.customDomain}` : null,
        customDomainStatus,
        status: project.status,
    });
}
