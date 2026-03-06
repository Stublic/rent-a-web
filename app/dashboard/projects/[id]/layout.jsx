import Link from 'next/link';
import { Sparkles, Pencil, Settings, ArrowLeft, FileText, Lock, Clock, Inbox, ExternalLink, Coins, Download, ShieldAlert } from 'lucide-react';
import RenewButton from '@/app/dashboard/components/RenewButton';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import ProjectOnboarding from './ProjectOnboarding';
import PublishIndicator from './PublishIndicator';
import UpgradeBanner from './UpgradeBanner';
import SwitchToMaintenanceButton from './SwitchToMaintenanceButton';
import ExportDownloadButton from './ExportDownloadButton';

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
        select: { hasGenerated: true, planName: true, cancelledAt: true, name: true, subdomain: true, customDomain: true, buyoutStatus: true, exportExpiresAt: true, userId: true, stripeSubscriptionId: true }
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

    // Auto-lock MAINTAINED projects whose subscription has expired
    if (project?.buyoutStatus === 'MAINTAINED' && project?.stripeSubscriptionId) {
        try {
            const { stripe } = await import('@/lib/stripe');
            const sub = await stripe.subscriptions.retrieve(project.stripeSubscriptionId);
            
            // If Stripe subscription is canceled (period ended), lock the project
            if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'past_due') {
                await prisma.project.update({
                    where: { id },
                    data: {
                        buyoutStatus: 'EXPORTED_LOCKED',
                        stripeSubscriptionId: null,
                        exportExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                    },
                });
                console.log(`🔒 MAINTAINED subscription expired → EXPORTED_LOCKED: ${project.name} (${id})`);
                const { redirect } = await import('next/navigation');
                redirect(`/dashboard/projects/${id}/settings`);
            }
        } catch (err) {
            if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
            // If Stripe sub doesn't exist anymore, lock it
            if (err?.statusCode === 404 || err?.code === 'resource_missing') {
                await prisma.project.update({
                    where: { id },
                    data: {
                        buyoutStatus: 'EXPORTED_LOCKED',
                        stripeSubscriptionId: null,
                        exportExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    },
                });
                console.log(`🔒 MAINTAINED subscription missing → EXPORTED_LOCKED: ${project.name} (${id})`);
                const { redirect } = await import('next/navigation');
                redirect(`/dashboard/projects/${id}/settings`);
            }
            console.error('Auto-lock check error:', err.message);
        }
    }

    // Check for maintained_advanced_upgrade checkout completion
    if (project?.buyoutStatus === 'MAINTAINED' && project?.planName?.toLowerCase().includes('starter')) {
        try {
            const { stripe } = await import('@/lib/stripe');
            const checkoutSessions = await stripe.checkout.sessions.list({ limit: 5 });
            const upgradeSession = checkoutSessions.data.find(s =>
                s.metadata?.type === 'maintained_advanced_upgrade' &&
                s.metadata?.projectId === id &&
                s.payment_status === 'paid' &&
                (Date.now() / 1000 - s.created) < 600
            );

            if (upgradeSession) {
                const advancedPlanName = 'Advanced - Landing stranica + Google oglasi';
                await prisma.project.update({
                    where: { id },
                    data: { planName: advancedPlanName },
                });
                await prisma.user.update({
                    where: { id: project.userId },
                    data: {
                        planName: advancedPlanName,
                        editorTokens: { increment: 500 },
                    },
                });
                console.log(`🚀 MAINTAINED project ${id} upgraded to Advanced (from layout)`);
                const { redirect } = await import('next/navigation');
                redirect(`/dashboard/projects/${id}/settings`);
            }
        } catch (err) {
            if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
            console.error('Maintained upgrade check error:', err.message);
        }
    }

    // Block access if project is EXPORTED_LOCKED (Buyout Option 2)
    if (project?.buyoutStatus === 'EXPORTED_LOCKED') {
        // Check if user just completed maintenance switch checkout
        const headerList = await headers();
        const referer = headerList.get('referer') || '';
        const currentUrl = headerList.get('x-url') || headerList.get('x-invoke-path') || '';
        
        // Try to detect ?switched=success from the URL
        // We need to check Stripe for a recent completed switch checkout
        try {
            const { stripe } = await import('@/lib/stripe');
            const checkoutSessions = await stripe.checkout.sessions.list({ limit: 5 });
            const matchingSession = checkoutSessions.data.find(s =>
                s.metadata?.type === 'switch_to_maintenance' &&
                s.metadata?.projectId === id &&
                s.payment_status === 'paid' &&
                // Only match sessions from the last 10 minutes
                (Date.now() / 1000 - s.created) < 600
            );

            if (matchingSession) {
                // Clear this subscription ID from any other project first (unique constraint)
                if (matchingSession.subscription) {
                    await prisma.project.updateMany({
                        where: { stripeSubscriptionId: matchingSession.subscription, id: { not: id } },
                        data: { stripeSubscriptionId: null },
                    });
                }

                // Finalize the switch synchronously
                await prisma.project.update({
                    where: { id },
                    data: {
                        buyoutStatus: 'MAINTAINED',
                        stripeSubscriptionId: matchingSession.subscription,
                        exportExpiresAt: null,
                    },
                });
                console.log(`✅ Project ${id} switched to MAINTAINED (sync, from layout)`);
                // Redirect to remove the stale page
                const { redirect } = await import('next/navigation');
                redirect(`/dashboard/projects/${id}/settings`);
            }
        } catch (err) {
            // Next.js redirect() throws NEXT_REDIRECT — re-throw it
            if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
            console.error('Switch check error:', err.message);
        }
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
                            <ExportDownloadButton projectId={id} projectName={project.name} />
                            <Link href="/dashboard" className="font-semibold text-sm px-5 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-105" style={{ background: 'var(--db-surface)', color: 'var(--db-text-secondary)', border: '1px solid var(--db-border)' }}>
                                Natrag
                            </Link>
                        </div>

                        {/* Switch to maintenance option */}
                        {daysLeft > 0 && (
                            <div className="mt-8 rounded-xl p-5 text-left max-w-md mx-auto" style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                                        <ShieldAlert size={18} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold mb-0.5" style={{ color: 'var(--db-heading)' }}>Predomislili ste se?</h3>
                                        <p className="text-xs leading-relaxed" style={{ color: 'var(--db-text-muted)' }}>
                                            Prebacite se na godišnje održavanje (250€/god) i vaša stranica će ponovo biti objavljena. Mi brinemo o hostingu, domeni i tehničkoj podršci.
                                        </p>
                                    </div>
                                </div>
                                <SwitchToMaintenanceButton projectId={id} />
                            </div>
                        )}
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
