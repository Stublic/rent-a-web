'use client';
import { Check, X as XIcon } from 'lucide-react';
import { FadeIn } from './Animations';

export default function Benefits() {
  const benefits = [
    { title: 'Bez troškova unaprijed', desc: 'Sačuvaj kapital za ono što je bitno.' },
    { title: 'Otkaži bilo kada', desc: 'Bez dugoročnih ugovora i penala.' },
    { title: 'Hosting uključen', desc: 'Brzi, sigurni Vercel serveri.' },
    { title: 'Brza isporuka', desc: 'Online za 2–5 dana.' },
    { title: 'SEO Optimizacija', desc: 'Bolja vidljivost na Googleu.' },
    { title: 'Stalna podrška', desc: 'Tu smo kad nas trebaš.' },
    { title: 'Responzivan dizajn', desc: 'Savršeno na svakom uređaju.' },
    { title: 'SSL certifikat', desc: 'Sigurnost uključena.' },
  ];

  const comparison = [
    { label: 'Početna cijena', old: '800€ – 4500€', new: '0€' },
    { label: 'Rok isporuke', old: '4 – 8 tjedana', new: '2 – 5 dana' },
    { label: 'Godišnje održavanje', old: '300€ – 800€', new: 'Uključeno' },
    { label: 'Satnica programera', old: '50€ / sat', new: 'Uključeno' },
    { label: 'Sigurnost & Backup', old: 'Dodatno se plaća', new: 'Uključeno' },
    { label: 'Tehnologija', old: 'Zastarijeva', new: 'Uvijek ažurno' },
  ];

  return (
    <section id="benefits" className="py-24" style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
              Zašto najam
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight" style={{ color: 'var(--lp-heading)' }}>
              Zašto unajmiti <span style={{ color: 'var(--lp-accent-green)' }}>umjesto kupiti?</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--lp-text-secondary)' }}>
              Tradicionalna izrada weba zahtijeva tisuće eura, mjesece čekanja i zastarijeva za 2 godine. Naš model pretplate te drži u koraku s vremenom.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              {benefits.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Check size={12} style={{ color: 'var(--lp-accent-green)' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>{item.title}</h4>
                    <p className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="p-6 md:p-8 rounded-2xl relative overflow-hidden" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--lp-heading)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--lp-accent-green)' }} />
                Usporedba modela
              </h3>

              <div className="space-y-0">
                {/* Header */}
                <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider pb-3 mb-2" style={{ color: 'var(--lp-text-muted)', borderBottom: '1px solid var(--lp-border)' }}>
                  <div className="col-span-4">Stavka</div>
                  <div className="col-span-4" style={{ color: 'var(--lp-accent-red)' }}>Klasična izrada</div>
                  <div className="col-span-4 text-right" style={{ color: 'var(--lp-accent-green)' }}>Rent a Web</div>
                </div>

                {comparison.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-sm items-center py-3 px-2 -mx-2 rounded-lg transition-colors" style={{ borderBottom: idx < comparison.length - 1 ? '1px solid var(--lp-border)' : 'none' }}>
                    <div className="col-span-4 font-medium" style={{ color: 'var(--lp-text-secondary)' }}>{item.label}</div>
                    <div className="col-span-4 text-xs sm:text-sm" style={{ color: 'var(--lp-text-muted)' }}>{item.old}</div>
                    <div className="col-span-4 font-bold text-right text-xs sm:text-sm" style={{ color: 'var(--lp-heading)' }}>{item.new}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 text-center rounded-xl p-4" style={{ borderTop: '1px solid var(--lp-border)', background: 'var(--lp-bg)' }}>
                <p className="text-sm mb-1" style={{ color: 'var(--lp-text-muted)' }}>Ukupna ušteda u prvoj godini</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--lp-heading)' }}>preko <span style={{ color: 'var(--lp-accent-green)' }}>2.500 €</span></p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
