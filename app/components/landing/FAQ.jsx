'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from './Animations';

const faqs = [
  {
    q: 'Što je Rent a webica?',
    a: 'Rent a webica je model najma web stranice putem mjesečne pretplate.\n\nUmjesto da platiš 1.000€ – 4.000€ unaprijed i čekaš tjednima, dobivaš profesionalnu web stranicu gotovu za 5 minuta — bez početne investicije.',
  },
  {
    q: 'Kako web može biti gotov za 5 minuta?',
    a: 'Jednostavno.\n\nUneseš osnovne podatke o svom biznisu (naziv, djelatnost, kontakt, stil), a naš AI sustav automatski generira:\n\n• Strukturu stranice\n• Profesionalan dizajn\n• Kompletan tekst prilagođen tvojoj branši\n• Slike i vizualni identitet\n• SEO optimizaciju\n\nNema čekanja developera.\nNema sastanaka.\nNema komplikacija.',
  },
  {
    q: 'Je li stvarno 0€ unaprijed?',
    a: 'Da.\n\nNema avansa.\nNema troška izrade.\nPlaćaš samo mjesečnu pretplatu.',
  },
  {
    q: 'Dobivam li svoju domenu?',
    a: 'U cijenu je uključena privremena domena u formatu:\n\n{tvoj-naziv}.webica.hr\n\nKasnije možeš spojiti i vlastitu domenu ako želiš.',
  },
  {
    q: 'Mogu li otkazati pretplatu bilo kada?',
    a: 'Da.\n\nNema minimalnog trajanja ugovora.\nMožeš otkazati bilo kada bez penala.\n\nAko prestaneš plaćati, web ostaje aktivan još 90 dana (grace period).\nNakon toga se briše.',
  },
  {
    q: 'Što je sve uključeno u cijenu?',
    a: 'U mjesečnu pretplatu uključeno je:\n\n• Hosting\n• SSL certifikat\n• Sigurnosni backup\n• Tehničko održavanje\n• Ažuriranja sustava\n• SEO tehnička optimizacija\n• Podrška\n\nNema skrivenih troškova.',
  },
  {
    q: 'Generira li AI stvarno sav tekst i slike?',
    a: 'Da.\n\nAI generira kompletan sadržaj — tekstove, opise usluga, strukturu, pa čak i vizualni stil.\n\nAli:\n• Možeš promijeniti sve.\n• Možeš uploadati svoje slike.\n• Možeš urediti svaki dio sadržaja.\n\nTi imaš potpunu kontrolu.',
  },
  {
    q: 'Kako funkcioniraju izmjene i AI Editor tokeni?',
    a: 'Osnovne izmjene su neograničene.\n\nAko često mijenjaš sadržaj i želiš koristiti napredni AI Editor, možeš kupiti dodatne tokene:\n\n• 5€ paket\n• 12€ paket\n• 35€ paket\n\nOvo je opcionalno i namijenjeno onima koji stalno optimiziraju web.',
  },
  {
    q: 'Je li web prilagođen mobitelima?',
    a: 'Da. Sve Rent a webice su 100% responzivne i optimizirane za mobilne uređaje.',
  },
  {
    q: 'Je li web optimiziran za Google?',
    a: 'Da.\n\nSvaka webica dolazi tehnički SEO optimizirana (brzina, struktura, meta podaci, mobile-ready).\n\nZa napredne SEO kampanje preporučuje se dodatna strategija.',
  },
  {
    q: 'Za koga je Rent a webica idealna?',
    a: '• Obrtnike\n• Freelancere\n• Male poduzetnike\n• Startupe\n• Lokalne biznise\n• Sve koji žele web bez velikog ulaganja i čekanja',
  },
  {
    q: 'Hoće li postojati webshop opcija?',
    a: 'Da.\n\nWeb shop Start paket uskoro dolazi i vjerojatno će podržavati do 100 proizvoda, uz jednostavno upravljanje i integraciju plaćanja.',
  },
];

const objectionFaq = {
  q: 'Po čemu se razlikujete od klasične izrade weba?',
  cols: [
    {
      label: 'Klasična izrada',
      color: '#f87171',
      items: ['800€ – 4.500€ unaprijed', '4–8 tjedana čekanja', 'Dodatni troškovi održavanja', 'Svaka izmjena se naplaćuje'],
      negative: true,
    },
    {
      label: 'Rent a webica',
      color: 'var(--lp-accent-green)',
      items: ['0€ unaprijed', 'Web u 5 minuta', 'Sve uključeno', 'Otkazivanje bilo kada'],
      negative: false,
    },
  ],
};

// Defined OUTSIDE to prevent remounting on state change
function FAQItem({ faq, globalIdx, isOpen, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay: (globalIdx % 6) * 0.04 }}
      className="rounded-2xl overflow-hidden"
      style={{
        border: isOpen
          ? '1px solid color-mix(in srgb, var(--lp-accent-green) 35%, var(--lp-border))'
          : '1px solid var(--lp-border)',
        background: 'var(--lp-surface)',
        boxShadow: isOpen ? '0 8px 24px -8px rgba(0,0,0,0.15)' : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      <button
        className="w-full px-6 py-5 flex justify-between items-start gap-4 text-left focus:outline-none"
        onClick={() => onToggle(globalIdx)}
      >
        <span
          className="text-base font-semibold leading-snug"
          style={{ color: isOpen ? 'var(--lp-heading)' : 'var(--lp-text-secondary)', transition: 'color 0.2s' }}
        >
          {faq.q}
        </span>
        <div
          className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isOpen
              ? 'color-mix(in srgb, var(--lp-accent-green) 20%, transparent)'
              : 'color-mix(in srgb, var(--lp-text-muted) 10%, transparent)',
            color: isOpen ? 'var(--lp-accent-green)' : 'var(--lp-text-muted)',
            transition: 'background 0.25s, color 0.25s',
          }}
        >
          {isOpen ? <Minus size={15} /> : <Plus size={15} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <p className="leading-relaxed whitespace-pre-line text-sm" style={{ color: 'var(--lp-text-secondary)' }}>
                {faq.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const [objOpen, setObjOpen] = useState(false);

  const handleToggle = (idx) => setOpenIndex(prev => (prev === idx ? -1 : idx));

  const mid = Math.ceil(faqs.length / 2);
  const col1 = faqs.slice(0, mid);
  const col2 = faqs.slice(mid);

  return (
    <section id="faq" className="py-24 relative overflow-hidden" style={{ background: 'var(--lp-bg)' }}>
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--lp-grid-line, rgba(0,0,0,0.05)) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid-line, rgba(0,0,0,0.05)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
        }}
      />
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none opacity-[0.07] z-0"
        style={{ background: 'radial-gradient(circle, var(--lp-accent-green) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-16 max-w-2xl mx-auto">
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
              Odgovori na pitanja
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4"
              style={{ color: 'var(--lp-heading)' }}
            >
              Često postavljena pitanja
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="text-lg"
              style={{ color: 'var(--lp-text-muted)' }}
            >
              Sve što trebaš znati o Rent a webici — jasno i bez marketinškog žargona.
            </motion.p>
          </div>
        </FadeIn>

        {/* Two-column FAQ grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="space-y-3">
            {col1.map((faq, idx) => (
              <FAQItem
                key={idx}
                faq={faq}
                globalIdx={idx}
                isOpen={openIndex === idx}
                onToggle={handleToggle}
              />
            ))}
          </div>
          <div className="space-y-3">
            {col2.map((faq, idx) => (
              <FAQItem
                key={mid + idx}
                faq={faq}
                globalIdx={mid + idx}
                isOpen={openIndex === mid + idx}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>

        {/* Objection killer FAQ — full width, special design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden"
          style={{
            border: objOpen
              ? '1px solid color-mix(in srgb, var(--lp-accent-green) 35%, var(--lp-border))'
              : '1px solid var(--lp-border)',
            background: 'var(--lp-surface)',
            boxShadow: objOpen ? '0 8px 30px -10px rgba(0,0,0,0.2)' : 'none',
            transition: 'border-color 0.25s, box-shadow 0.25s',
          }}
        >
          <button
            className="w-full px-6 py-5 flex justify-between items-start gap-4 text-left focus:outline-none"
            onClick={() => setObjOpen(v => !v)}
          >
            <div className="flex items-center gap-3">
              <div
                className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest"
                style={{ background: 'color-mix(in srgb, var(--lp-accent-green) 12%, transparent)', color: 'var(--lp-accent-green)', border: '1px solid color-mix(in srgb, var(--lp-accent-green) 25%, transparent)' }}
              >
                Usporedba
              </div>
              <span className="text-base font-semibold" style={{ color: objOpen ? 'var(--lp-heading)' : 'var(--lp-text-secondary)', transition: 'color 0.2s' }}>
                {objectionFaq.q}
              </span>
            </div>
            <div
              className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: objOpen ? 'color-mix(in srgb, var(--lp-accent-green) 20%, transparent)' : 'color-mix(in srgb, var(--lp-text-muted) 10%, transparent)',
                color: objOpen ? 'var(--lp-accent-green)' : 'var(--lp-text-muted)',
                transition: 'background 0.25s, color 0.25s',
              }}
            >
              {objOpen ? <Minus size={15} /> : <Plus size={15} />}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {objOpen && (
              <motion.div
                key="obj-answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {objectionFaq.cols.map((col, ci) => (
                      <div
                        key={ci}
                        className="rounded-xl p-5"
                        style={{
                          background: 'var(--lp-bg)',
                          border: `1px solid ${col.color}40`,
                        }}
                      >
                        <div className="font-extrabold text-sm mb-4 pb-3 uppercase tracking-widest" style={{ color: col.color, borderBottom: `1px solid ${col.color}30` }}>
                          {col.label}
                        </div>
                        <ul className="space-y-2.5">
                          {col.items.map((item, ii) => (
                            <li key={ii} className="flex items-center gap-2.5 text-sm">
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                                style={{ background: `${col.color}20`, color: col.color }}
                              >
                                {col.negative ? '✕' : '✓'}
                              </span>
                              <span style={{ color: 'var(--lp-text-secondary)' }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
