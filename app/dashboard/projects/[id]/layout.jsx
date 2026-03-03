import Link from 'next/link';
import { Sparkles, Pencil, Settings, ArrowLeft, FileText, Lock, Clock, Inbox, ExternalLink, Coins } from 'lucide-react';
import RenewButton from '@/app/dashboard/components/RenewButton';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import ProjectOnboarding from './ProjectOnboarding';
import PublishIndicator from './PublishIndicator';

const GRACE_PERIOD_DAYS = 90;

export default async function ProjectLayout({ children, params }) {
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await params;
    
    const currentUser = session ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, editorTokens: true }
    }) : null;
    const isAdmin = currentUser?.role === 'ADMIN';
    const userTokens = currentUser?.editorTokens ?? 0;
    
    const project = session ? await prisma.project.findUnique({
        where: isAdmin ? { id } : { id, userId: session.user.id },
        select: { hasGenerated: true, planName: true, cancelledAt: true, name: true, subdomain: true, customDomain: true }
    }) : null;

    // Block access if project is cancelled
    if (project?.cancelledAt) {
        const cancelledAt = new Date(project.cancelledAt);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, GRACE_PERIOD_DAYS - daysSince);

        return (
            <div className="min-h-screen text-white flex flex-col" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
                <header className="sticky top-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--lp-border)' }}>
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="flex items-center h-14">
                            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--lp-text-muted)' }}>
                                <ArrowLeft size={16} /> Natrag na projekte
                            </Link>
                        </div>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-md db-fade-in">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Lock size={28} className="text-amber-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--lp-heading)' }}>Projekt je otkazan</h2>
                        <p className="text-sm mb-1.5" style={{ color: 'var(--lp-text-secondary)' }}>
                            Pretplata za <strong style={{ color: 'var(--lp-heading)' }}>"{project.name}"</strong> je otkazana.
                        </p>
                        <p className="text-xs mb-5" style={{ color: 'var(--lp-text-muted)' }}>
                            Uređivanje je onemogućeno. Podaci se čuvaju još <strong className="text-amber-400">{daysLeft} {daysLeft === 1 ? 'dan' : 'dana'}</strong>.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                            <RenewButton projectId={id} />
                            <Link href="/dashboard" className="font-semibold text-sm px-5 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-105" style={{ background: 'var(--lp-surface)', color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}>
                                Natrag
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const isAdvancedPlan = (project?.planName?.toLowerCase().includes('growth') || project?.planName?.toLowerCase().includes('advanced'));

    // Build live preview URL
    const previewUrl = project?.customDomain
        ? `https://${project.customDomain}`
        : project?.subdomain
            ? `https://${project.subdomain}.webica.hr`
            : null;

    const navItems = [
        { href: `/dashboard/projects/${id}/content`, icon: Pencil, label: 'Sadržaj', always: true },
        { href: `/dashboard/projects/${id}/editor`, icon: Sparkles, label: isAdvancedPlan ? 'AI Editor' : 'Editor', requires: 'generated' },
        { href: `/dashboard/projects/${id}/inquiries`, icon: Inbox, label: 'Upiti', requires: 'generated' },
        ...(isAdvancedPlan ? [{ href: `/dashboard/projects/${id}/blog`, icon: FileText, label: 'Blog', always: true }] : []),
        { href: `/dashboard/projects/${id}/settings`, icon: Settings, label: 'Postavke', requires: 'generated' },
    ];
  
    return (
        <div className="min-h-screen text-white flex flex-col" data-landing="true" style={{ background: 'var(--lp-bg)' }}>
           {/* ── TOP HEADER ── */}
           <header className="sticky top-0 z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--lp-border)' }}>
              <div className="max-w-7xl mx-auto px-4 md:px-6">
                  <div className="flex items-center justify-between h-14">
                      {/* Left: Back */}
                      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--lp-text-muted)' }}>
                        <ArrowLeft size={16} /> <span className="hidden sm:inline">Natrag na projekte</span><span className="sm:hidden">Natrag</span>
                      </Link>

                      {/* Center: Desktop-only navigation */}
                      <div className="hidden md:flex items-center gap-1.5">
                          {navItems.map(item => {
                              const isDisabled = item.requires === 'generated' && !project?.hasGenerated;
                              const Icon = item.icon;

                              if (isDisabled) {
                                  return (
                                      <span key={item.href} className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2.5 py-1.5 rounded-lg cursor-not-allowed opacity-40" style={{ color: 'var(--lp-text-muted)' }}>
                                          <Icon size={14} /> {item.label}
                                      </span>
                                  );
                              }

                              return (
                                  <Link
                                      key={item.href}
                                      href={item.href}
                                      className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/5"
                                      style={{ color: 'var(--lp-text-secondary)' }}
                                  >
                                      <Icon size={14} /> {item.label}
                                  </Link>
                              );
                          })}
                      </div>

                      {/* Right: publish + tokens + preview */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Publish indicator */}
                          {project?.hasGenerated && (
                              <PublishIndicator projectId={id} />
                          )}

                          {/* Token count badge */}
                          <Link
                              href={`/dashboard/projects/${id}/tokens`}
                              className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 transition-all hover:bg-white/5"
                              style={{ color: userTokens < 50 ? '#f87171' : '#ca8a04', border: '1px solid var(--lp-border)' }}
                              title="Klikni za kupnju tokena"
                          >
                              <Coins size={13} />
                              <span className="font-mono font-bold">{userTokens}</span>
                              <span className="hidden sm:inline" style={{ color: 'var(--lp-text-muted)' }}>tokena</span>
                          </Link>

                          {/* Preview in new tab — desktop only */}
                          {project?.hasGenerated && previewUrl && (
                              <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hidden md:flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-all hover:bg-white/5"
                                  style={{ color: 'var(--lp-text-secondary)', border: '1px solid var(--lp-border)' }}
                                  title="Otvori živu preview u novom prozoru"
                              >
                                  <ExternalLink size={13} />
                                  <span>Preview</span>
                              </a>
                          )}
                      </div>
                  </div>
              </div>
           </header>
           
           {/* ── MAIN CONTENT ── */}
           <main className="flex-1 pb-[4.5rem] md:pb-0">
             {children}
           </main>

           {/* ── MOBILE BOTTOM TAB BAR ── */}
           <nav
               id="mobile-tab-bar"
               className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around"
               style={{
                   background: 'rgba(0,0,0,0.85)',
                   backdropFilter: 'blur(20px)',
                   WebkitBackdropFilter: 'blur(20px)',
                   borderTop: '1px solid var(--lp-border)',
                   paddingBottom: 'env(safe-area-inset-bottom, 0px)',
               }}
           >
               {navItems.map(item => {
                   const isDisabled = item.requires === 'generated' && !project?.hasGenerated;
                   const Icon = item.icon;

                   if (isDisabled) {
                       return (
                           <span
                               key={item.href}
                               className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 opacity-30 cursor-not-allowed"
                               style={{ color: 'var(--lp-text-muted)' }}
                           >
                               <Icon size={20} />
                               <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                           </span>
                       );
                   }

                   return (
                       <Link
                           key={item.href}
                           href={item.href}
                           className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:bg-white/10"
                           style={{ color: 'var(--lp-text-secondary)' }}
                       >
                           <Icon size={20} />
                           <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                       </Link>
                   );
               })}
           </nav>
           
           <ProjectOnboarding projectId={id} />
        </div>
    );
}
