import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ContentForm from './ContentForm.jsx';
import PreviewPanel from './PreviewPanel';

import SubpageManager from './SubpageManager';
import { Loader2 } from 'lucide-react';

function isAdvancedPlan(planName) {
    if (!planName) return false;
    const p = planName.toLowerCase();
    return p.includes('advanced') || p.includes('growth');
}

export default async function ContentPage({ params }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/');

    const { id } = await params;
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, editorTokens: true }
    });
    const isAdmin = currentUser?.role === 'ADMIN';
    const userTokens = currentUser?.editorTokens ?? 0;

    const project = await prisma.project.findUnique({ where: isAdmin ? { id } : { id, userId: session.user.id } });
    if (!project) redirect(isAdmin ? '/admin/projects' : '/dashboard');

    const blogPostCount = await prisma.blogPost.count({
        where: { projectId: id, status: 'PUBLISHED' }
    });
    const hasBlog = blogPostCount > 0;

    const isPublished = !!project.publishedAt;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DRAFT': return { label: 'Nacrt', icon: '📝', style: 'bg-zinc-500/15 text-zinc-400' };
            case 'PROCESSING': return { label: 'Generiranje...', icon: null, pulsing: true, pulseColor: '#60a5fa', style: 'bg-blue-500/15 text-blue-400' };
            case 'PUBLISHED': return { label: 'Objavljeno', live: true };
            case 'GENERATED': return { label: isPublished ? 'Objavljeno' : 'Generirano', live: isPublished, style: 'bg-emerald-500/15 text-emerald-400' };
            default: return { label: status, icon: '•', style: 'bg-zinc-500/15 text-zinc-400' };
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'DRAFT': return 'Ispunite formu ispod i kliknite "Generiraj Web Stranicu" da Webica AI kreira vašu stranicu.';
            case 'PROCESSING': return 'AI trenutno generira vašu web stranicu. Generiranje traje u prosjeku 3–5 minuta.';
            case 'PUBLISHED': return 'Vaša web stranica je objavljena i dostupna na internetu.';
            case 'GENERATED': return isPublished
                ? 'Vaša web stranica je objavljena i dostupna na internetu.'
                : 'Vaša web stranica je spremna! Kliknite gumb ispod za preview ili idite u Editor.';
            default: return '';
        }
    };

    const badge = getStatusBadge(project.status);
    const message = getStatusMessage(project.status);

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 py-6">
            {/* Header */}
            <div className="mb-6 db-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--lp-heading)' }}>Uredite sadržaj</h1>

                    {/* Status badge */}
                    {badge.live ? (
                        // Published — green glowing pulsing pill
                        <span
                            className="flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[11px] font-bold uppercase"
                            style={{
                                background: 'rgba(34,197,94,0.12)',
                                border: '1px solid rgba(34,197,94,0.3)',
                                color: '#4ade80',
                                boxShadow: '0 0 12px rgba(34,197,94,0.15)',
                            }}
                        >
                            {/* Pulsing dot */}
                            <span className="relative flex h-2 w-2 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                            Objavljeno
                        </span>
                    ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${badge.style} flex items-center gap-1.5 w-fit`}>
                            {badge.pulsing && (
                                <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                                </span>
                            )}
                            {badge.icon && <span>{badge.icon}</span>}
                            <span>{badge.label}</span>
                        </span>
                    )}
                </div>
                <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>
                    {message || 'Ovdje unesite sve informacije o vašem poslovanju.'}
                </p>
            </div>

            {/* Preview Panel */}
            {project.generatedHtml && (
                <div className="mb-6">
                    <PreviewPanel project={project} hasBlog={hasBlog} />
                </div>
            )}

            {/* Subpage Manager — Advanced only, after homepage generated */}
            {project.generatedHtml && isAdvancedPlan(project.planName) && (
                <SubpageManager project={project} />
            )}

            {/* Processing Alert */}
            {project.status === 'PROCESSING' && (
                <div className="mb-6 rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <div className="flex items-start gap-3.5">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-bold text-blue-400 text-sm mb-1">Generiranje u tijeku</h3>
                            <p className="text-blue-300/80 text-xs leading-relaxed">
                                Webica AI trenutno stvara vašu web stranicu. Generiranje traje u prosjeku 3–5 minuta. Stranica će se osvježiti automatski.
                            </p>
                            <p className="text-blue-400/50 text-[11px] mt-2 italic">
                                Možete zatvoriti stranicu i vratiti se kasnije.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <ContentForm project={project} />
        </div>
    );
}
