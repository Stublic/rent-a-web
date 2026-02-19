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
            return NextResponse.json({ error: 'Niste prijavljeni.' }, { status: 401 });
        }

        const { projectId, generatedHtml, businessName, businessDescription } = await req.json();

        if (!projectId || !generatedHtml) {
            return NextResponse.json(
                { error: 'Nedostaju podaci za preuzimanje trial projekta.' },
                { status: 400 }
            );
        }

        // Find the project (must belong to user and not yet have generated HTML)
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id }
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Projekt nije pronađen.' },
                { status: 404 }
            );
        }

        // Only claim if not already generated
        if (project.hasGenerated && project.generatedHtml) {
            return NextResponse.json(
                { error: 'Projekt već ima generiranu stranicu.' },
                { status: 400 }
            );
        }

        // Update project with trial data
        const contentData = {
            businessName: businessName || project.name,
            businessDescription: businessDescription || '',
        };

        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: generatedHtml,
                hasGenerated: true,
                status: 'GENERATED',
                name: businessName || project.name,
                contentData: contentData,
                aiVersion: 1,
            }
        });

        console.log(`✅ Trial claimed for project ${projectId} by user ${session.user.id}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Trial claim error:', error);
        return NextResponse.json(
            { error: 'Greška pri preuzimanju projekta.' },
            { status: 500 }
        );
    }
}
