'use client';
import { Check, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  { title: 'Bez troškova unaprijed',    desc: 'Pokreni web bez ulaganja od 1.000€+.' },
  { title: 'Web spreman za 5 minuta',   desc: 'Uneseš podatke → sustav generira dizajn, tekst i strukturu automatski.' },
  { title: 'Hosting i domena uključeni', desc: 'Brzi i sigurni serveri bez dodatnih briga.' },
  { title: 'SEO optimizacija',           desc: 'Stranica tehnički spremna za Google od prvog dana.' },
  { title: 'Responzivan dizajn',         desc: 'Savršeno izgleda na mobitelu, tabletu i računalu.' },
  { title: 'Otkazivanje bilo kada',      desc: 'Bez dugoročnih ugovora i penala.' },
  { title: 'Stalna podrška',             desc: '24/7 i uvijek ažurna.' },
  { title: 'SSL & sigurnost',            desc: 'Backup i zaštita uključeni.' },
];

const comparison = [
  { label: 'Početna cijena',       old: '800€ – 4.500€',    neu: '0€' },
  { label: 'Vrijeme izrade',       old: '4 – 8 tjedana',     neu: '5 minuta' },
  { label: 'Godišnje održavanje',  old: '300€ – 800€',       neu: 'Uključeno' },
  { label: 'Satnica developera',   old: '50€ / sat',          neu: 'Uključeno' },
  { label: 'Sigurnost & Backup',   old: 'Dodatno se plaća',  neu: 'Uključeno' },
  { label: 'Tehnologija',          old: 'Često zastarijeva', neu: 'Uvijek ažurno' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function Benefits() {
  return (
    <section
      id="benefits"
      className="py-24 relative overflow-hidden"
      style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}
    >
      {/* Background grid — identical to Hero */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--lp-grid-line, rgba(0,0,0,0.06)) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid-line, rgba(0,0,0,0.06)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
        }}
      />
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none z-0 opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, var(--lp-accent-green) 0%, transparent 70%)', filter: 'blur(70px)' }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* ── LEFT COLUMN ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{
                background: 'color-mix(in srgb, var(--lp-accent-green) 12%, transparent)',
                color: 'var(--lp-accent-green)',
                border: '1px solid color-mix(in srgb, var(--lp-accent-green) 25%, transparent)',
              }}
            >
              Zašto najam
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-[1.1]"
              style={{ color: 'var(--lp-heading)' }}
            >
              Zašto unajmiti{' '}
              <span style={{ color: 'var(--lp-accent-green)' }}>umjesto kupiti?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="text-lg leading-relaxed mb-10"
              style={{ color: 'var(--lp-text-secondary)' }}
            >
              Klasična izrada weba košta tisuće eura, traje tjednima i brzo zastarijeva.{' '}
              <strong style={{ color: 'var(--lp-heading)' }}>Rent a webica</strong> model ti daje gotovu, aktivnu web stranicu za 5 minuta — bez početnih troškova i bez rizika.
            </motion.p>

            {/* Benefits grid */}
            <motion.div
              className="grid sm:grid-cols-2 gap-x-6 gap-y-5"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {benefits.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants} className="flex gap-3.5 group">
                  <div
                    className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
                    style={{ background: 'color-mix(in srgb, var(--lp-accent-green) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--lp-accent-green) 25%, transparent)' }}
                  >
                    <Check size={13} style={{ color: 'var(--lp-accent-green)' }} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-0.5" style={{ color: 'var(--lp-heading)' }}>{item.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--lp-text-muted)' }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Power quote */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 p-5 rounded-2xl relative overflow-hidden"
              style={{ background: 'color-mix(in srgb, var(--lp-accent-green) 8%, var(--lp-surface))', border: '1px solid color-mix(in srgb, var(--lp-accent-green) 20%, var(--lp-border))' }}
            >
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: 'var(--lp-accent-green)' }} />
              <p className="pl-4 text-base font-semibold italic leading-relaxed" style={{ color: 'var(--lp-heading)' }}>
                "Dok drugi čekaju ponudu developera, ti već primaš upite."
              </p>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — Comparison table ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
          >
            {/* Table header */}
            <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--lp-border)' }}>
              <h3 className="text-lg font-extrabold flex items-center gap-3" style={{ color: 'var(--lp-heading)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--lp-accent-green)' }} />
                Usporedba modela
              </h3>
            </div>

            {/* Column headers */}
            <div
              className="grid grid-cols-12 text-xs font-extrabold uppercase tracking-widest px-6 py-3"
              style={{ borderBottom: '1px solid var(--lp-border)', background: 'var(--lp-bg)' }}
            >
              <div className="col-span-4" style={{ color: 'var(--lp-text-muted)' }}>Stavka</div>
              <div className="col-span-4" style={{ color: '#f87171' }}>Klasična izrada</div>
              <div className="col-span-4 text-right" style={{ color: 'var(--lp-accent-green)' }}>Rent a webica</div>
            </div>

            {/* Rows */}
            <div>
              {comparison.map((item, idx) => (
                <motion.div
                  key={idx}
                  custom={idx}
                  variants={rowVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-12 text-sm items-center px-6 py-4 transition-colors hover:bg-[var(--lp-surface-hover)]"
                  style={{ borderBottom: idx < comparison.length - 1 ? '1px solid var(--lp-border)' : 'none' }}
                >
                  <div className="col-span-4 font-semibold" style={{ color: 'var(--lp-text-secondary)' }}>{item.label}</div>
                  <div className="col-span-4 text-xs sm:text-sm line-through opacity-60" style={{ color: 'var(--lp-text-muted)' }}>{item.old}</div>
                  <div className="col-span-4 font-bold text-right text-xs sm:text-sm" style={{ color: 'var(--lp-heading)' }}>{item.neu}</div>
                </motion.div>
              ))}
            </div>

            {/* Bottom savings box */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mx-4 mb-4 mt-2 p-5 rounded-xl text-center relative overflow-hidden"
              style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ background: 'radial-gradient(ellipse at center, var(--lp-accent-green) 0%, transparent 70%)' }}
              />
              <p className="text-xs font-bold uppercase tracking-widest mb-2 relative z-10" style={{ color: 'var(--lp-text-muted)' }}>
                Ukupna ušteda u prvoj godini
              </p>
              <p className="text-3xl font-extrabold relative z-10" style={{ color: 'var(--lp-heading)' }}>
                preko <span style={{ color: 'var(--lp-accent-green)' }}>2.500 €</span>
              </p>
              <p className="text-xs mt-2 relative z-10" style={{ color: 'var(--lp-text-muted)' }}>
                Pokreneš danas. Bez čekanja. Bez rizika.
              </p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
