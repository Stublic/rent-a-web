'use client';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const reviews = [
  {
    name: 'Dario Cesarec',
    role: 'Motion rehab',
    text: 'Pacijenti sada lako nalaze sve informacije o terapijama. Stranica izgleda profesionalno i ulijeva povjerenje, što je u mom poslu ključno.',
    color: '#3b82f6',
    img: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'Danko Đurić',
    role: 'DANKO ogradni sustavi',
    text: 'Trebala mi je jednostavna stranica da prikažem naše projekte. Rent a webica je to riješio brzo, a upiti za ponude sada stižu redovito.',
    color: '#f59e0b',
    img: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'Adrijana Stjepić',
    role: 'Franjić Teks',
    text: 'Naš asortiman radne odjeće napokon izgleda profesionalno online. Klijenti nas lakše nalaze, a ja se ne moram brinuti oko tehničkog održavanja.',
    color: '#a855f7',
    img: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'Mirko Blažević',
    role: 'MB Servis d.o.o.',
    text: 'Za samo dva dana imali smo stranicu online. Profesionalan dizajn i brza isporuka su pravi adut za sve koji tek kreću.',
    color: '#10b981',
    img: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'Ivana Perković',
    role: 'Studio IP fotografija',
    text: 'Portfolio izgleda fenomenalno. Klijenti mi redovito kažu koliko je stranica dojmljiva — a sve to bez da se ja ikada bavim tehničkim dijelom.',
    color: '#ec4899',
    img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'Tomislav Jurić',
    role: 'TJ Elektro',
    text: 'Od kad imamo stranicu, broj upita je porastao. Jednostavna administracija i odlična podrška čine ovaj servis idealnim za male obrte.',
    color: '#f97316',
    img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face',
  },
];

// Duplicate for infinite scroll
const allReviews = [...reviews, ...reviews, ...reviews];

function TestimonialCard({ review }) {
  return (
    <div
      className="flex-shrink-0 w-[280px] sm:w-[300px] rounded-2xl flex flex-col relative overflow-hidden group"
      style={{
        background: 'var(--lp-card)',
        border: '1px solid var(--lp-card-border)',
      }}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${review.color}80, ${review.color}20)` }} />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top, ${review.color}08, transparent 70%)` }}
      />

      <div className="p-6 flex flex-col gap-4 relative">
        {/* Quote icon */}
        <div className="absolute top-4 right-5" style={{ color: review.color, opacity: 0.12 }}>
          <Quote size={32} fill="currentColor" stroke="none" />
        </div>

        {/* Stars */}
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={13} fill="#f59e0b" stroke="none" />
          ))}
        </div>

        {/* Text */}
        <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--lp-text-secondary)' }}>
          &ldquo;{review.text}&rdquo;
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--lp-border)' }}>
          <div className="relative flex-shrink-0">
            <img
              src={review.img}
              alt={review.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              loading="lazy"
            />
            {/* Online dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: review.color, borderColor: 'var(--lp-card)' }}
            />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: 'var(--lp-heading)' }}>{review.name}</div>
            <div className="text-[11px] font-medium uppercase tracking-wide truncate" style={{ color: review.color }}>{review.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// One animated column scrolling upward
function ScrollColumn({ items, duration, reverse = false }) {
  return (
    <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
      <motion.div
        className="flex flex-col gap-5"
        animate={{ y: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {items.map((review, idx) => (
          <TestimonialCard key={idx} review={review} />
        ))}
      </motion.div>
    </div>
  );
}

export default function Testimonials() {
  // Split reviews into 3 columns (desktop), 2 (tablet)
  const col1 = allReviews.filter((_, i) => i % 3 === 0);
  const col2 = allReviews.filter((_, i) => i % 3 === 1);
  const col3 = allReviews.filter((_, i) => i % 3 === 2);

  return (
    <section
      id="testimonials"
      className="py-24 relative overflow-hidden"
      style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--lp-grid-line, rgba(0,0,0,0.05)) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid-line, rgba(0,0,0,0.05)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-[0.06] z-0"
        style={{ background: 'radial-gradient(circle, var(--lp-accent-green) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{
              background: 'color-mix(in srgb, var(--lp-accent-green) 12%, transparent)',
              color: 'var(--lp-accent-green)',
              border: '1px solid color-mix(in srgb, var(--lp-accent-green) 25%, transparent)',
            }}
          >
            Iskustva korisnika
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: 'var(--lp-heading)' }}
          >
            Što kažu naši <span style={{ color: 'var(--lp-accent-green)' }}>korisnici</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg"
            style={{ color: 'var(--lp-text-muted)' }}
          >
            Pravi vlasnici biznisa, pravi rezultati.
          </motion.p>
        </div>

        {/* Scrolling columns — fixed height container */}
        <div className="h-[520px] sm:h-[560px] overflow-hidden">
          {/* Mobile: 2 columns, Desktop: 3 columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 h-full">
            <ScrollColumn items={col1} duration={28} reverse={false} />
            <ScrollColumn items={col2} duration={24} reverse={true} />
            <div className="hidden md:block">
              <ScrollColumn items={col3} duration={32} reverse={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
