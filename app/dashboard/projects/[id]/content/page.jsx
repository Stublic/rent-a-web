import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ContentForm from './ContentForm.jsx';
import PreviewPanel from './PreviewPanel';
import { Loader2 } from 'lucide-react';

export default async function ContentPage({ params }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/');
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { 
            id: id,
            userId: session.user.id
        }
    });

    if (!project) {
        redirect('/dashboard');
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DRAFT':
                return { color: 'bg-zinc-800 text-zinc-400 border-zinc-700', label: 'Nacrt', icon: '📝' };
            case 'PROCESSING':
                return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Generiranje...', icon: '⏳' };
            case 'GENERATED':
                return { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Gotovo', icon: '✅' };
            default:
                return { color: 'bg-zinc-800 text-zinc-400 border-zinc-700', label: status, icon: '•' };
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'DRAFT':
                return 'Ispunite formu ispod i kliknite "Generiraj Web Stranicu" da AI kreira vašu stranicu.';
            case 'PROCESSING':
                return 'AI trenutno generira vašu web stranicu. Ovo može potrajati 15-20 sekundi. Molimo pričekajte...';
            case 'GENERATED':
                return 'Vaša web stranica je spremna! Kliknite gumb ispod za preview ili otvorite u novom tabu.';
            default:
                return '';
        }
    };

    const badge = getStatusBadge(project.status);
    const message = getStatusMessage(project.status);

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">Uredite sadržaj</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${badge.color} flex items-center gap-1.5`}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                        </span>
                    </div>
                </div>
                <p className="text-zinc-400">
                    {message || 'Ovdje unesite sve informacije o vašem poslovanju.'}
                </p>
            </div>

            {/* Preview Panel */}
            {project.generatedHtml && (
                <div className="mb-8">
                    <PreviewPanel project={project} />
                </div>
            )}

            {/* Processing Alert */}
            {project.status === 'PROCESSING' && (
                <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="font-bold text-blue-400 mb-2">Generiranje u tijeku</h3>
                            <p className="text-blue-300 text-sm leading-relaxed">
                                AI trenutno stvara vašu web stranicu na temelju unesenih podataka. 
                                Proces može potrajati 15-20 sekundi. Stranica će se automatski osvježiti kada bude spremno.
                            </p>
                            <p className="text-blue-400/70 text-xs mt-3 italic">
                                Možete zatvoriti ovu stranicu i vratiti se kasnije - generiranje će se nastaviti u pozadini.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <ContentForm project={project} />
        </div>
    );
}
