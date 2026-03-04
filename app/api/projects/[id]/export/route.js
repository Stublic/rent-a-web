import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        // Find the project — must be owned by user (or admin) and EXPORTED_LOCKED
        const isAdmin = session.user.role === 'ADMIN';
        const project = isAdmin
            ? await prisma.project.findUnique({
                where: { id },
                select: { generatedHtml: true, buyoutStatus: true, name: true, exportExpiresAt: true },
            })
            : await prisma.project.findFirst({
                where: { id, userId: session.user.id },
                select: { generatedHtml: true, buyoutStatus: true, name: true, exportExpiresAt: true },
            });

        if (!project) {
            return new Response('Projekt nije pronađen.', { status: 404 });
        }

        if (project.buyoutStatus !== 'EXPORTED_LOCKED') {
            return new Response('Ovaj projekt nije otkupljen za preuzimanje.', { status: 403 });
        }

        // Check if the export period has expired
        if (project.exportExpiresAt && new Date(project.exportExpiresAt) < new Date()) {
            return new Response('Rok za preuzimanje je istekao.', { status: 410 });
        }

        if (!project.generatedHtml) {
            return new Response('Nema generiranog koda za preuzimanje.', { status: 404 });
        }

        // Sanitize filename
        const safeName = (project.name || 'website')
            .replace(/[^a-zA-Z0-9\u0161\u0111\u010d\u0107\u017e\u0160\u0110\u010c\u0106\u017d\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 50);

        return new Response(project.generatedHtml, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="${safeName}.html"`,
                'Cache-Control': 'no-store',
            },
        });

    } catch (error) {
        console.error('Export error:', error);
        return new Response('Greška pri preuzimanju.', { status: 500 });
    }
}
