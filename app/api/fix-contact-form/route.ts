import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { injectContactFormScript } from '@/lib/contact-form-script';

/**
 * POST /api/fix-contact-form
 * 
 * Injects the functional contact form JS into a project's generatedHtml.
 * Uses the shared helper from lib/contact-form-script.ts.
 * Safe to call multiple times — detects version marker.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const isAdmin = (session.user as any).role === 'ADMIN';
    const project = isAdmin
      ? await prisma.project.findUnique({ where: { id: projectId } })
      : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (!project.generatedHtml) return NextResponse.json({ error: 'No generated HTML' }, { status: 400 });

    // Use shared helper — handles version detection, old script removal, and injection
    const updatedHtml = injectContactFormScript(project.generatedHtml, projectId);

    // If nothing changed, already up to date
    if (updatedHtml === project.generatedHtml) {
      return NextResponse.json({ alreadyFixed: true, message: 'Contact form already up to date' });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { generatedHtml: updatedHtml },
    });

    console.log(`✅ Contact form fixed for project ${projectId}`);
    return NextResponse.json({ success: true, message: 'Contact form is now functional' });

  } catch (err: any) {
    console.error('fix-contact-form error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
