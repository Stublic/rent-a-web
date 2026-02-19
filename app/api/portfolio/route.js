import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min cache

const PORTFOLIO_EMAIL = 'stublic.jurica@gmail.com';

export async function GET() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: PORTFOLIO_EMAIL },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ projects: [] });
        }

        const projects = await prisma.project.findMany({
            where: {
                userId: user.id,
                status: { in: ['LIVE', 'PUBLISHED', 'GENERATED'] },
                hasGenerated: true,
            },
            select: {
                id: true,
                name: true,
                subdomain: true,
                customDomain: true,
                publishedAt: true,
                contentData: true,
            },
            orderBy: { publishedAt: 'desc' },
        });

        // Build public URL for each project
        const result = projects.map((p) => {
            const url = p.customDomain
                ? `https://${p.customDomain}`
                : p.subdomain
                    ? `https://${p.subdomain}.webica.hr`
                    : null;

            // Try to extract industry from contentData
            let industry = null;
            if (p.contentData && typeof p.contentData === 'object') {
                industry = p.contentData.industry || p.contentData.businessType || p.contentData.niche || null;
            }

            return {
                id: p.id,
                name: p.name,
                url,
                subdomain: p.subdomain,
                industry,
                publishedAt: p.publishedAt,
            };
        }).filter((p) => p.url); // only those with a URL

        return NextResponse.json({ projects: result });
    } catch (error) {
        console.error('[Portfolio API]', error);
        return NextResponse.json({ projects: [] });
    }
}
