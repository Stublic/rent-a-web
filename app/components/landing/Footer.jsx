'use client';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="relative pt-20" style={{ background: 'var(--lp-bg)' }}>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* CTA Section */}
        <div className="mb-20 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
          {/* Inner gradient fills the box fully */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center bottom, color-mix(in srgb, var(--lp-accent-green) 25%, transparent) 0%, transparent 65%)' }}
          ></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight" style={{ color: 'var(--lp-heading)' }}>
              Spremni za <span style={{ color: 'var(--lp-accent-green)' }}>vašu novu</span> web stranicu?
            </h2>
            <p className="text-lg md:text-xl mb-10" style={{ color: 'var(--lp-text-muted)' }}>
              Prestani razmišljati o kodiranju, dizajnu i održavanju. Fokusiraj se na svoj posao, a mi ćemo se pobrinuti da te klijenti lakše pronađu.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="#pricing"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 w-full sm:w-auto transform hover:-translate-y-1 hover:shadow-xl"
                style={{ background: 'var(--lp-accent-green)', color: 'var(--lp-bg)' }}
              >
                Kreni odmah
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="/auth/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 w-full sm:w-auto"
                style={{ background: 'transparent', color: 'var(--lp-heading)', border: '1px solid var(--lp-border)' }}
              >
                Prijava za korisnike
              </a>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 pb-16" style={{ borderBottom: '1px solid var(--lp-border)' }}>

          <div className="md:col-span-5 lg:col-span-4">
            <div className="flex items-center gap-3 font-extrabold text-2xl mb-6" style={{ color: 'var(--lp-heading)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shadow-lg border" style={{ borderColor: 'var(--lp-border)' }}>
                <img src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png" alt="Rent a webica Logo" className="w-full h-full object-cover" />
              </div>
              <span className="tracking-tight">Rent a webica</span>
            </div>
            <p className="leading-relaxed text-base pr-4" style={{ color: 'var(--lp-text-muted)' }}>
              Omogućujemo poduzetnicima da imaju vrhunsku web stranicu bez velikih početnih ulaganja. Najam weba koji raste s vašim poslovanjem.
            </p>
          </div>

          <div className="col-span-1 md:col-span-3 lg:col-span-2 lg:col-start-7">
            <h4 className="font-bold text-lg mb-6" style={{ color: 'var(--lp-heading)' }}>Navigacija</h4>
            <ul className="space-y-4 font-medium">
              <li><a href="#how-it-works" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Kako radi</a></li>
              <li><a href="#showcase" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Primjeri</a></li>
              <li><a href="#pricing" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Cjenik</a></li>
              <li><a href="#faq" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Česta pitanja</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-4 lg:col-span-3 lg:col-start-10">
            <h4 className="font-bold text-lg mb-6" style={{ color: 'var(--lp-heading)' }}>Korisnici i pravno</h4>
            <ul className="space-y-4 font-medium">
              <li><a href="/auth/login" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Prijava korisnika</a></li>
              <li><a href="/auth/signup" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Registracija</a></li>
              <li><a href="/politika-privatnosti" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Politika privatnosti</a></li>
              <li><a href="/uvjeti-koristenja" className="transition-opacity hover:opacity-80 inline-block" style={{ color: 'var(--lp-text-muted)' }}>Uvjeti korištenja</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright Bar */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium" style={{ color: 'var(--lp-text-secondary)' }}>
          <p>© {new Date().getFullYear()} Rent a webica. Sva prava pridržana.</p>
          <a
            href="https://webica.hr"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-70"
            style={{ color: 'var(--lp-text-muted)' }}
          >
            Powered by <span style={{ color: 'var(--lp-accent-green)' }}>webica.hr</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
