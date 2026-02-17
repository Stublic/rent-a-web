import Link from 'next/link';
import { Sparkles, Pencil, Settings, ArrowLeft, FileText, Lock, Clock, RefreshCw } from 'lucide-react';
import RenewButton from '@/app/dashboard/components/RenewButton';
import { use } from 'react';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const GRACE_PERIOD_DAYS = 90;

export default async function ProjectLayout({ children, params }) {
    // Get session and project to check hasGenerated
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await params;
    
    // Check if user is admin for bypassing ownership check
    const currentUser = session ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    }) : null;
    const isAdmin = currentUser?.role === 'ADMIN';
    
    const project = session ? await prisma.project.findUnique({
        where: isAdmin ? { id } : { id, userId: session.user.id },
        select: { hasGenerated: true, planName: true, cancelledAt: true, name: true }
    }) : null;

    const isGrowthPlan = project?.planName?.toLowerCase().includes('growth');

    // Block access if project is cancelled
    if (project?.cancelledAt) {
        const cancelledAt = new Date(project.cancelledAt);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, GRACE_PERIOD_DAYS - daysSince);

        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col">
                <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="flex items-center h-16">
                            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                                <ArrowLeft size={16} /> Natrag na projekte
                            </Link>
                        </div>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock size={36} className="text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Projekt je otkazan</h2>
                        <p className="text-zinc-400 mb-2">
                            Pretplata za <strong className="text-white">"{project.name}"</strong> je otkazana.
                        </p>
                        <p className="text-zinc-500 text-sm mb-6">
                            Uređivanje je onemogućeno. Vaši podaci bit će sačuvani još <strong className="text-amber-400">{daysLeft} {daysLeft === 1 ? 'dan' : 'dana'}</strong>, 
                            nakon čega se trajno brišu.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <RenewButton projectId={id} />
                            <Link
                                href="/dashboard"
                                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-xl transition-all inline-flex items-center justify-center gap-2 border border-zinc-700"
                            >
                                Natrag
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
  
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
           <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between h-auto md:h-16 py-4 md:py-0 gap-4 md:gap-0">
                      
                      {/* Top Row: Back & Divider */}
                      <div className="flex items-center justify-between md:justify-start w-full md:w-auto">
                          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                            <ArrowLeft size={16} /> <span className="hidden sm:inline">Natrag na projekte</span><span className="sm:hidden">Natrag</span>
                          </Link>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center gap-1 md:gap-8 overflow-x-auto pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                          <div className="h-4 w-px bg-zinc-800 hidden md:block"></div>
                          
                          <Link 
                            href={`/dashboard/projects/${id}/content`} 
                            className="text-zinc-400 hover:text-white font-medium py-2 md:py-5 flex items-center gap-2 text-sm whitespace-nowrap px-2 md:px-0 transition-colors"
                          >
                              <Sparkles size={16} /> 
                              <span>Sadržaj (AI)</span>
                          </Link>
                          
                          {project?.hasGenerated ? (
                              <Link
                                href={`/dashboard/projects/${id}/editor`}
                                className="text-white hover:text-zinc-300 font-medium py-2 md:py-5 flex items-center gap-2 text-sm whitespace-nowrap px-2 md:px-0 transition-colors"
                              >
                                  <Pencil size={16} /> 
                                  <span>Editor</span>
                              </Link>
                          ) : (
                              <span className="text-zinc-600 font-medium py-2 md:py-5 flex items-center gap-2 text-sm whitespace-nowrap px-2 md:px-0 cursor-not-allowed opacity-50">
                                  <Pencil size={16} /> 
                                  <span>Editor</span>
                                  <span className="hidden md:inline text-xs">(Uskoro)</span>
                              </span>
                          )}

                          {isGrowthPlan && (
                              <Link
                                href={`/dashboard/projects/${id}/blog`}
                                className="text-zinc-400 hover:text-white font-medium py-2 md:py-5 flex items-center gap-2 text-sm whitespace-nowrap px-2 md:px-0 transition-colors"
                              >
                                  <FileText size={16} /> 
                                  <span>Blog</span>
                              </Link>
                          )}
                          
                          {project?.hasGenerated ? (
                              <Link
                                href={`/dashboard/projects/${id}/settings`}
                                className="text-zinc-400 hover:text-white font-medium py-2 md:py-5 flex items-center gap-2 text-sm whitespace-nowrap px-2 md:px-0 transition-colors"
                              >
                                  <Settings size={16} /> 
                                  <span>Postavke</span>
                              </Link>
                          ) : (
                              <div className="text-zinc-600 font-medium py-2 md:py-5 flex items-center gap-2 text-sm whitespace-nowrap px-2 md:px-0 cursor-not-allowed opacity-50">
                                  <Settings size={16} /> 
                                  <span>Postavke</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
           </header>
           
           <main className="flex-1">
             {children}
           </main>
        </div>
    );
}
