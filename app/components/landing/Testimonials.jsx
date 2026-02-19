'use client';
import { Star, Quote } from 'lucide-react';
import { FadeIn } from './Animations';

const reviews = [
  { name: 'Dario Cesarec', role: 'Motion rehab', text: 'Pacijenti sada lako nalaze sve informacije o terapijama. Stranica izgleda profesionalno i ulijeva povjerenje, što je u mom poslu ključno.', color: '#3b82f6' },
  { name: 'Danko Đurić', role: 'DANKO ogradni sustavi', text: 'Trebala mi je jednostavna stranica da prikažem naše projekte. Rent a Web je to riješio brzo, a upiti za ponude sada stižu redovito.', color: '#f59e0b' },
  { name: 'Adrijana Stjepić', role: 'Franjić Teks', text: 'Naš asortiman radne odjeće napokon izgleda profesionalno online. Klijenti nas lakše nalaze, a ja se ne moram brinuti oko tehničkog održavanja.', color: '#a855f7' },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24" style={{ background: 'var(--lp-bg-alt)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
              Iskustva
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold" style={{ color: 'var(--lp-heading)' }}>Što kažu naši korisnici</h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <FadeIn key={idx} delay={idx * 120} className="h-full">
              <div className="group relative p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full" style={{ background: 'var(--lp-card)', border: '1px solid var(--lp-card-border)' }}>
                <div className="absolute top-5 right-7 transition-colors" style={{ color: 'var(--lp-border)' }}>
                  <Quote size={40} fill="currentColor" stroke="none" />
                </div>
                <div className="flex gap-1 mb-5 relative z-10" style={{ color: 'var(--lp-accent-orange)' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="mb-6 leading-relaxed relative z-10 flex-grow text-sm" style={{ color: 'var(--lp-text-secondary)' }}>
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-auto pt-5" style={{ borderTop: '1px solid var(--lp-border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: review.color }}>
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>{review.name}</div>
                    <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--lp-text-muted)' }}>{review.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
