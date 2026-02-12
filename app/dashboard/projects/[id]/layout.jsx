import Link from 'next/link';
import { Sparkles, Pencil, Settings, ArrowLeft } from 'lucide-react';
import { use } from 'react';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export default async function ProjectLayout({ children, params }) {
    // Get session and project to check hasGenerated
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await params;
    
    const project = session ? await prisma.project.findUnique({
        where: { id, userId: session.user.id },
        select: { hasGenerated: true }
    }) : null;
  
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
                          
                          <div className="text-zinc-600 font-medium py-2 md:py-5 flex items-center gap-2 text-sm whitespace-nowrap px-2 md:px-0 cursor-not-allowed opacity-50">
                              <Settings size={16} /> 
                              <span>Postavke</span>
                          </div>
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
