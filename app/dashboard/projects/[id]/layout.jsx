import Link from 'next/link';
import { Sparkles, Layout, Settings, ArrowLeft } from 'lucide-react';

export default function ProjectLayout({ children, params }) {
  // In Next.js 15+ params are async, but for now assuming standard behavior or handling it if broken.
  // Actually, let's just use the children and simple nav for now.
  
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
       <header className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-950/50 backdrop-blur-md">
          <Link href="/dashboard" className="mr-8 text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft size={18} /> Natrag
          </Link>
          <div className="h-6 w-px bg-zinc-800 mr-8"></div>
          <nav className="flex items-center gap-6">
            <Link href={`/dashboard/projects/${params.id}/content`} className="text-white font-bold border-b-2 border-green-500 py-5 flex items-center gap-2">
                <Sparkles size={16} /> Sadržaj (AI)
            </Link>
            <span className="text-zinc-600 flex items-center gap-2 cursor-not-allowed">
                <Layout size={16} /> Editor (Uskoro)
            </span>
             <span className="text-zinc-600 flex items-center gap-2 cursor-not-allowed">
                <Settings size={16} /> Postavke
            </span>
          </nav>
       </header>
       <main className="flex-1 overflow-y-auto">
         {children}
       </main>
    </div>
  );
}
