'use client';
import { FileText, Zap, Rocket } from 'lucide-react';
import { FadeIn } from './Animations';

export default function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: '1. Ispuni kratku formu',
      desc: 'Odgovori na par pitanja o svom poslu. Treba ti doslovno 2 minute.',
    },
    {
      icon: Zap,
      title: '2. Mi generiramo web',
      desc: 'Naš sustav automatski kreira dizajn, tekstove i slike prilagođene tebi.',
    },
    {
      icon: Rocket,
      title: '3. Online si za 5 min!',
      desc: 'Tvoja stranica je spremna za primanje prvih klijenata odmah.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative" style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
              Kako funkcionira
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--lp-heading)' }}>
              Od ideje do weba u <span style={{ color: 'var(--lp-accent-green)' }}>3 koraka</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--lp-text-secondary)' }}>
              Mi rješavamo tehničke stvari. Ti se fokusiraj na zarađivanje.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--lp-border-hover), transparent)' }} />

          {steps.map((step, idx) => (
            <FadeIn key={idx} delay={idx * 150} className="relative z-10">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--lp-bg)' }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                  <step.icon size={32} strokeWidth={1.5} style={{ color: 'var(--lp-heading)' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--lp-heading)' }}>{step.title}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--lp-text-muted)' }}>{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
