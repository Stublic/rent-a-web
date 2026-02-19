'use client';
import { ArrowRight, Star } from 'lucide-react';
import WebsiteShowcase from './WebsiteShowcase';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 overflow-hidden" style={{ background: 'var(--lp-bg)' }}>

      {/* ── Background pattern — light mode: subtle grid, dark mode: dot grid ── */}
      {/* Grid lines (light mode) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--lp-grid-line, rgba(0,0,0,0.06)) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid-line, rgba(0,0,0,0.06)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />
      {/* Dot grid overlay (dark mode via --lp-dot-color) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--lp-dot-color, transparent) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />
      {/* Radial gradient glow in the center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center top, var(--lp-hero-glow, transparent), transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* Text Content */}
        <div className="text-center lg:text-left">
          {/* Badge */}
          <div className="flex justify-center lg:justify-start mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm"
              style={{
                background: 'var(--lp-surface)',
                border: '1px solid var(--lp-border)',
                animation: 'fade-up 0.7s ease-out',
                color: 'var(--lp-text)'
              }}
            >
              <span className="flex h-2 w-2 rounded-full animate-pulse bg-current" />
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                Dostupno odmah · Bez obveze
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]"
            style={{ color: 'var(--lp-heading)', animation: 'fade-up 0.7s ease-out 0.1s both' }}
          >
            Pokreni web stranicu u <span className="underline decoration-wavy decoration-2 underline-offset-4 decoration-current opacity-80">5 minuta</span>,
            <br className="hidden lg:block"/>već od 39€/mjesečno.
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed"
            style={{ color: 'var(--lp-text-secondary)', animation: 'fade-up 0.7s ease-out 0.2s both' }}
          >
            Samo ispuni podatke o svom biznisu i objavi svoju web stranicu u 5 minuta. Plaćaj mjesečno, otkaži bilo kada. Bez velikih početnih troškova i bez ugovorne obveze.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4" style={{ animation: 'fade-up 0.7s ease-out 0.3s both' }}>
            <a
              href="/try"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center gap-2"
              style={{
                background: 'var(--lp-heading)',
                color: 'var(--lp-bg)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }}
            >
              Isprobaj besplatno
              <ArrowRight size={18} />
            </a>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:bg-[var(--lp-surface-hover)]"
              style={{
                border: '1px solid var(--lp-border)',
                color: 'var(--lp-text)',
              }}
            >
              Pogledaj cijene
            </a>
          </div>

          {/* Social Proof */}
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4" style={{ animation: 'fade-up 0.7s ease-out 0.4s both' }}>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" className="w-10 h-10 rounded-full border-2 border-[var(--lp-bg)] grayscale" />
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-0.5" style={{ color: 'var(--lp-heading)' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--lp-text-muted)' }}>
                <strong style={{ color: 'var(--lp-heading)' }}>500+</strong> sretnih klijenata
              </span>
            </div>
          </div>
        </div>

        {/* Showcase */}
        <div className="relative mt-12 lg:mt-0" style={{ animation: 'fade-up 0.7s ease-out 0.5s both' }}>
          <WebsiteShowcase />
        </div>
      </div>
    </section>
  );
}
