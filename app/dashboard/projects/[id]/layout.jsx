import Link from 'next/link';
import { Sparkles, Pencil, Settings, ArrowLeft, FileText, Lock, Clock, Inbox, ExternalLink, Coins, Download, ShieldAlert } from 'lucide-react';
import RenewButton from '@/app/dashboard/components/RenewButton';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import ProjectOnboarding from './ProjectOnboarding';
import PublishIndicator from './PublishIndicator';
import UpgradeBanner from './UpgradeBanner';

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
        select: { hasGenerated: true, planName: true, cancelledAt: true, name: true, subdomain: true, customDomain: true, buyoutStatus: true, exportExpiresAt: true }
    }) : null;

    // Block access if project is cancelled
    if (project?.cancelledAt) {
        const cancelledAt = new Date(project.cancelledAt);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, GRACE_PERIOD_DAYS - daysSince);

        return (
            <div className="min-h-screen flex flex-col" data-dashboard="true" style={{ background: 'var(--db-bg)', color: 'var(--db-text)' }}>
                <header className="sticky top-0 z-50" style={{ background: 'var(--db-header-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--db-border)' }}>
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="flex items-center h-14">
                            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--db-text-muted)' }}>
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
                        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--db-heading)' }}>Projekt je otkazan</h2>
                        <p className="text-sm mb-1.5" style={{ color: 'var(--db-text-secondary)' }}>
                            Pretplata za <strong style={{ color: 'var(--db-heading)' }}>"{project.name}"</strong> je otkazana.
                        </p>
                        <p className="text-xs mb-5" style={{ color: 'var(--db-text-muted)' }}>
                            Uređivanje je onemogućeno. Podaci se čuvaju još <strong className="text-amber-400">{daysLeft} {daysLeft === 1 ? 'dan' : 'dana'}</strong>.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                            <RenewButton projectId={id} />
                            <Link href="/dashboard" className="font-semibold text-sm px-5 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-105" style={{ background: 'var(--db-surface)', color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                                Natrag
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Block access if project is EXPORTED_LOCKED (Buyout Option 2)
    if (project?.buyoutStatus === 'EXPORTED_LOCKED') {
        const expiresAt = project.exportExpiresAt ? new Date(project.exportExpiresAt) : null;
        const now = new Date();
        const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

        return (
            <div className="min-h-screen flex flex-col" data-dashboard="true" style={{ background: 'var(--db-bg)', color: 'var(--db-text)' }}>
                <header className="sticky top-0 z-50" style={{ background: 'var(--db-header-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--db-border)' }}>
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="flex items-center h-14">
                            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--db-text-muted)' }}>
                                <ArrowLeft size={16} /> Natrag na projekte
                            </Link>
                        </div>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-lg db-fade-in">
                        <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                            <ShieldAlert size={28} className="text-orange-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--db-heading)' }}>Projekt je otkupljen</h2>
                        <p className="text-sm mb-1.5" style={{ color: 'var(--db-text-secondary)' }}>
                            Vaša stranica <strong style={{ color: 'var(--db-heading)' }}>"{project.name}"</strong> je otkupljena i spremna za preuzimanje.
                        </p>
                        {daysLeft > 0 ? (
                            <p className="text-xs mb-6" style={{ color: 'var(--db-text-muted)' }}>
                                Imate još <strong className="text-orange-400">{daysLeft} {daysLeft === 1 ? 'dan' : 'dana'}</strong> za preuzimanje koda prije trajnog brisanja.
                            </p>
                        ) : (
                            <p className="text-xs mb-6 text-red-400">
                                Rok za preuzimanje je istekao. Projekt će uskoro biti obrisan.
                            </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                            <a
                                href={`/api/projects/${id}/export`}
                                download
                                className="font-semibold text-sm px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}
                            >
                                <Download size={18} />
                                Preuzmi kod (index.html)
                            </a>
                            <Link href="/dashboard" className="font-semibold text-sm px-5 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-105" style={{ background: 'var(--db-surface)', color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                                Natrag
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const isAdvancedPlan = (project?.planName?.toLowerCase().includes('growth') || project?.planName?.toLowerCase().includes('advanced'));
    const isStarterPlan = project?.planName?.toLowerCase().includes('starter');
    const showUpgradeBanner = isStarterPlan && !isAdvancedPlan && project?.stripeSubscriptionId;

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
        <div className="min-h-screen flex flex-col" data-dashboard="true" style={{ background: 'var(--db-bg)', color: 'var(--db-text)' }}>
           {/* ── TOP HEADER ── */}
           <header className="sticky top-0 z-50" style={{ background: 'var(--db-header-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--db-border)' }}>
              <div className="max-w-7xl mx-auto px-4 md:px-6">
                  <div className="flex items-center justify-between h-14">
                      {/* Left: Back */}
                      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--db-text-muted)' }}>
                        <ArrowLeft size={16} /> <span className="hidden sm:inline">Natrag na projekte</span><span className="sm:hidden">Natrag</span>
                      </Link>

                      {/* Center: Desktop-only navigation */}
                      <div className="hidden md:flex items-center gap-1.5">
                          {navItems.map(item => {
                              const isDisabled = item.requires === 'generated' && !project?.hasGenerated;
                              const Icon = item.icon;

                              if (isDisabled) {
                                  return (
                                      <span key={item.href} className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2.5 py-1.5 rounded-lg cursor-not-allowed opacity-40" style={{ color: 'var(--db-text-muted)' }}>
                                          <Icon size={14} /> {item.label}
                                      </span>
                                  );
                              }

                              return (
                                  <Link
                                      key={item.href}
                                      href={item.href}
                                      className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/5"
                                      style={{ color: 'var(--db-text-secondary)' }}
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
                              style={{ color: userTokens < 50 ? '#f87171' : '#ca8a04', border: '1px solid var(--db-border)' }}
                              title="Klikni za kupnju tokena"
                          >
                              <Coins size={13} />
                              <span className="font-mono font-bold">{userTokens}</span>
                              <span className="hidden sm:inline" style={{ color: 'var(--db-text-muted)' }}>tokena</span>
                          </Link>

                          {/* Preview in new tab — desktop only */}
                          {project?.hasGenerated && previewUrl && (
                              <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hidden md:flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-all hover:bg-white/5"
                                  style={{ color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}
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

           {/* ── UPGRADE BANNER (Starter → Advanced) ── */}
           {showUpgradeBanner && (
               <UpgradeBanner projectId={id} projectName={project?.name} />
           )}
           
           {/* ── MAIN CONTENT ── */}
           <main className="flex-1 pb-[4.5rem] md:pb-0">
             {children}
           </main>

           {/* ── MOBILE BOTTOM TAB BAR ── */}
           <nav
               id="mobile-tab-bar"
               className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around"
               style={{
                   background: 'var(--db-header-bg)',
                   backdropFilter: 'blur(20px)',
                   WebkitBackdropFilter: 'blur(20px)',
                   borderTop: '1px solid var(--db-border)',
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
                               style={{ color: 'var(--db-text-muted)' }}
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
                           style={{ color: 'var(--db-text-secondary)' }}
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
