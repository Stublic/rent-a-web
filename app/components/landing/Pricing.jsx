'use client';
import { Check, Star, Rocket, ShoppingBag, Sparkles, RefreshCw, CreditCard, MonitorIcon, Zap, TrendingUp, FileText, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn } from './Animations';

const plans = [
  {
    id: 'starter',
    title: 'Starter',
    subtitle: 'Prodajna landing stranica',
    price: '39',
    accent: 'var(--lp-accent-green)',
    icon: Star,
    priceId: 'price_1SxaGbKhkXukXczcwVqlzrOx',
    description: 'Idealno za male obrte i lokalne usluge koji žele brzo biti online.',
    highlights: ['Brzo', 'Jednostavno', 'Bez ugovora'],
    features: [
      'AI generirana one-page (landing) stranica',
      'Kontakt forma i napredni SEO',
      '500 AI tokena za uređivanje',
      'Hosting na poddomeni',
      'Custom domena',
      'SSL & sigurnosne nadogradnje',
      'Prodajna struktura stranice (conversion flow)',
      'Stranica gotova u 45 sekundi, neograničen broj revizija',
    ],
    available: true,
  },
  {
    id: 'advanced',
    title: 'Advanced',
    subtitle: 'Ozbiljan biznis',
    price: '99',
    accent: '#3b82f6',
    icon: Rocket,
    priceId: 'price_1SxaHAKhkXukXczc0cPpLMH2',
    recommended: true,
    description: 'Za tvrtke koje žele više: ozbiljniji web i SEO potencijal.',
    highlights: ['Autoritet', 'SEO rast', 'Dinamičan web'],
    features: [
      'Sve iz Starter paketa',
      'Kompleksna struktura (Naslovnica, Usluge, O nama, Kontakt)',
      'CMS za Blog (objave + kategorije + tagovi)',
      '10 AI članaka mjesečno (SEO friendly)',
      'Custom domena',
      'Napredne animacije & UX efekti',
      'Napredna AI SEO optimizacija',
      'Generiranje slika za web (Nano Banana)',
      'Pravni aspekti (GDPR, Uvjeti korištenja)',
    ],
    available: true,
  },
  {
    id: 'webshop',
    title: 'Web Shop Start',
    subtitle: 'Prodaja 0–24',
    price: '199',
    accent: '#a855f7',
    icon: ShoppingBag,
    priceId: null,
    description: 'Online prodaja bez kompliciranog sustava plaćanja.',
    highlights: ['Online prodaja bez stresa', 'Jednostavno za upravljanje'],
    features: [
      'Katalog + košarica + checkout',
      'Upravljanje proizvodima i narudžbama',
      'Sve metode plaćanja',
      'AI SEO optimizacija i opis proizvoda',
      'Hosting + CMS + SSL',
      'Generiranje slika za web (Nano Banana)',
      'Integracija sa SOLO servisom (fiskalizacija)',
      'Pravni aspekti (GDPR, Uvjeti korištenja)',
    ],
    available: false,
    comingSoon: true,
  },
];

const whySubscription = [
  'Nema tisuća eura upfront',
  'Hosting, sigurnost i podrška uključeni',
  'Automatske AI izmjene',
  'Bez ugovornih obveza',
  'Mogućnost nadogradnje u svako doba',
];

const miniFaqs = [
  { q: 'Mogu li otkazati kad god želim?', a: 'Da — bez penala i ugovora.' },
  { q: 'Što ako mi treba više izmjena?', a: 'Tokeni ili AI Content paket ti omogućuju fleksibilnost bez stalnih troškova.' },
  { q: 'Kako funkcionira blog u Advanced paketu?', a: 'Uključen je CMS + 10 AI članaka mjesečno koji se mogu objaviti ili urediti.' },
];

function PricingCard({ plan, onCheckout, loading, idx }) {
  const { title, subtitle, price, accent, icon: Icon, description, highlights, features, recommended, priceId, available, comingSoon } = plan;
  const isDisabled = !available || loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'var(--lp-card)',
        border: `1px solid ${recommended ? accent : 'var(--lp-card-border)'}`,
        boxShadow: recommended ? `0 0 60px -15px ${accent}55` : 'none',
        opacity: comingSoon ? 0.75 : 1,
      }}
    >
      {/* Recommended badge */}
      {recommended && (
        <div
          className="absolute -top-0 left-0 right-0 py-1.5 text-center text-xs font-extrabold uppercase tracking-widest text-white"
          style={{ background: accent }}
        >
          Najpopularnije
        </div>
      )}

      {/* Coming soon overlay */}
      {comingSoon && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl" style={{ backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.35)' }}>
          <div className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl text-center" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
            <Clock size={28} style={{ color: accent }} />
            <div className="font-extrabold text-white text-lg">Uskoro dostupno</div>
            <p className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>Web Shop paket je u izradi.<br />Ostani u tijeku!</p>
          </div>
        </div>
      )}

      {/* Top color accent bar */}
      <div className="h-1 w-full" style={{ background: accent }} />

      <div className={`flex flex-col flex-1 p-7 ${recommended ? 'pt-10' : 'pt-7'}`}>
        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}22`, color: accent }}
          >
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold leading-tight" style={{ color: 'var(--lp-heading)' }}>{title}</h3>
            <p className="text-sm font-semibold mt-0.5" style={{ color: accent }}>{subtitle}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-extrabold tracking-tight" style={{ color: 'var(--lp-heading)' }}>{price}€</span>
          <span className="text-sm font-medium" style={{ color: 'var(--lp-text-muted)' }}>/ mj</span>
        </div>

        {/* Description */}
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--lp-text-muted)' }}>{description}</p>

        {/* Divider */}
        <div className="w-full h-px mb-5" style={{ background: 'var(--lp-border)' }} />

        {/* Features */}
        <ul className="flex-1 space-y-3 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${accent}22` }}
              >
                <Check size={11} style={{ color: accent }} strokeWidth={3} />
              </div>
              <span style={{ color: 'var(--lp-text-secondary)' }}>{f}</span>
            </li>
          ))}
        </ul>

        {/* Highlights row */}
        <div className="flex flex-wrap gap-2 mb-6">
          {highlights.map((h, i) => (
            <span
              key={i}
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
            >
              ✔ {h}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => available && onCheckout && onCheckout(priceId)}
          disabled={isDisabled}
          className="w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          style={{
            background: isDisabled ? 'var(--lp-border)' : accent,
            color: isDisabled ? 'var(--lp-text-muted)' : '#fff',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            boxShadow: !isDisabled ? `0 8px 20px -4px ${accent}55` : 'none',
          }}
        >
          {comingSoon
            ? <><Lock size={16} /> Uskoro dostupno</>
            : loading
              ? <><RefreshCw className="animate-spin" size={16} /> Spajanje...</>
              : 'Odaberi paket'}
        </button>
      </div>
    </motion.div>
  );
}

export default function Pricing({ onCheckout, checkoutLoading }) {
  return (
    <section
      id="pricing"
      className="py-24 relative overflow-hidden"
      style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--lp-grid-line, rgba(0,0,0,0.05)) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid-line, rgba(0,0,0,0.05)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 100%)',
        }}
      />
      {/* Top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none z-0 opacity-15"
        style={{ background: 'radial-gradient(ellipse at top, var(--lp-accent-green), transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* ── Header ── */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
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
            Odaberi svoj paket
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: 'var(--lp-heading)' }}
          >
            Profesionalnu web stranicu možeš imati{' '}
            <span style={{ color: 'var(--lp-accent-green)' }}>već danas</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="text-lg leading-relaxed"
            style={{ color: 'var(--lp-text-muted)' }}
          >
            Bez ugovora, bez stručnog znanja i bez velikog troška. Izaberi paket koji ti
            najbolje odgovara i kreni online brzo i sigurno.
          </motion.p>
        </div>

        {/* ── Cards ── */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-7 max-w-6xl mx-auto mb-20 items-start">
          {plans.map((plan, idx) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              idx={idx}
              onCheckout={onCheckout}
              loading={checkoutLoading}
            />
          ))}
        </div>

        {/* ── Why subscription? ── */}
        <FadeIn>
          <div
            className="max-w-4xl mx-auto mb-20 rounded-2xl p-8 md:p-10"
            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
          >
            <h3 className="text-xl font-extrabold mb-6 text-center" style={{ color: 'var(--lp-heading)' }}>
              🔎 Zašto mjesečna pretplata?
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {whySubscription.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--lp-accent-green) 15%, transparent)' }}
                  >
                    <Check size={11} style={{ color: 'var(--lp-accent-green)' }} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--lp-text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── Add-ons ── */}
        <FadeIn delay={100}>
          <div className="max-w-4xl mx-auto mb-20">
            <h3 className="text-xl font-extrabold mb-2 text-center" style={{ color: 'var(--lp-heading)' }}>🚀 Dodaci i nadogradnje</h3>
            <p className="text-sm text-center mb-8" style={{ color: 'var(--lp-text-muted)' }}>Nadogradi svoj paket kada želiš:</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: TrendingUp,
                  title: 'Google Ads Setup & Vođenje',
                  desc: 'Povećaj promet i dobivaj upite brže.',
                  color: '#f59e0b',
                },
                {
                  icon: FileText,
                  title: 'AI Content Paket (jednokratno)',
                  desc: '10 ili 20 SEO optimiziranih blog članaka.',
                  color: '#3b82f6',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                >
                  <div
                    className="p-3 rounded-xl flex-shrink-0"
                    style={{ background: `${item.color}20`, color: item.color }}
                  >
                    <item.icon size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1" style={{ color: 'var(--lp-heading)' }}>{item.title}</div>
                    <div className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── Mini FAQ ── */}
        <FadeIn delay={120}>
          <div className="max-w-3xl mx-auto mb-20">
            <h3 className="text-xl font-extrabold mb-6 text-center" style={{ color: 'var(--lp-heading)' }}>📍 Česta pitanja</h3>
            <div className="space-y-3">
              {miniFaqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl"
                  style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
                >
                  <p className="font-bold text-sm mb-1.5" style={{ color: 'var(--lp-heading)' }}>{faq.q}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-text-muted)' }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── Buyout table ── */}
        <FadeIn delay={150}>
          <div
            className="max-w-5xl mx-auto rounded-2xl overflow-hidden mb-20"
            style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}
          >
            <div className="p-8 text-center" style={{ borderBottom: '1px solid var(--lp-border)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--lp-heading)' }}>Želite otkupiti web? Pogledajte opcije.</h3>
              <p style={{ color: 'var(--lp-text-muted)' }}>Nudimo i opciju jednokratnog otkupa stranice.</p>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--lp-border)' }}>
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--lp-accent-blue)' }}>
                    <CreditCard size={20} />
                  </div>
                  <h4 className="text-base font-bold" style={{ color: 'var(--lp-heading)' }}>Otkup weba (Jednokratno)</h4>
                </div>
                {[
                  { label: 'Landing Page', price: '390 €' },
                  { label: 'Web Stranica', price: '990 €' },
                  { label: 'Web Shop', price: '1.990 €' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}>
                    <span style={{ color: 'var(--lp-text-secondary)' }}>{item.label}</span>
                    <span className="text-lg font-extrabold" style={{ color: 'var(--lp-heading)' }}>{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--lp-accent-orange)' }}>
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: 'var(--lp-heading)' }}>Godišnje održavanje</h4>
                    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--lp-accent-orange)' }}>Obavezno uz otkup</div>
                  </div>
                </div>
                {[
                  { label: 'Za web stranice', price: '250 €', period: '/ god', tags: ['.com domena', 'Hosting', 'Održavanje', 'Podrška'] },
                  { label: 'Za web shop', price: '350 €', period: '/ god', tags: ['Hosting', 'Sigurnost', 'Updateovi', 'Održavanje'] },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>{item.label}</span>
                      <span className="font-extrabold" style={{ color: 'var(--lp-heading)' }}>
                        {item.price} <span className="text-xs font-normal" style={{ color: 'var(--lp-text-muted)' }}>{item.period}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'var(--lp-bg)', color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    {idx === 0 && <div className="w-full h-px my-5" style={{ background: 'var(--lp-border)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Bottom CTA ── */}
        <FadeIn delay={160}>
          <div className="text-center">
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--lp-heading)' }}>
              Ne čekaj — tvoja web stranica može biti online već danas.
            </p>
            <p className="mb-8" style={{ color: 'var(--lp-text-muted)' }}>Odaberi paket i kreni s izradom.</p>
            <a
              href="/try"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: 'var(--lp-accent-green)', color: '#fff', boxShadow: '0 8px 20px -4px color-mix(in srgb, var(--lp-accent-green) 40%, transparent)' }}
            >
              <Sparkles size={18} /> Isprobaj besplatno
            </a>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
