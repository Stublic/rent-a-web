'use client';
import { Check, Star, Rocket, ShoppingBag, Sparkles, RefreshCw, CreditCard, Monitor, Zap } from 'lucide-react';
import { FadeIn } from './Animations';

const PricingCard = ({ title, price, originalPrice, features, recommended = false, description, icon: Icon, targetAudience, priceId, onCheckout, loading }) => (
  <div
    className="relative flex flex-col p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
    style={{
      background: 'var(--lp-card)',
      border: recommended ? '1px solid var(--lp-accent-green)' : '1px solid var(--lp-card-border)',
      boxShadow: recommended ? '0 0 40px rgba(34,197,94,0.08)' : 'none',
      transform: recommended ? 'scale(1.02)' : undefined,
      zIndex: recommended ? 10 : 1,
    }}
  >
    {recommended && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg" style={{ background: 'var(--lp-accent-green)' }}>
        Najpopularnije
      </div>
    )}

    <div className="mb-6">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: recommended ? 'rgba(34,197,94,0.1)' : 'var(--lp-surface)', color: recommended ? 'var(--lp-accent-green)' : 'var(--lp-heading)' }}>
        <Icon size={22} />
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--lp-heading)' }}>{title}</h3>
      <p className="text-sm mb-4 min-h-[40px]" style={{ color: 'var(--lp-text-muted)' }}>{description}</p>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-extrabold" style={{ color: 'var(--lp-heading)' }}>{price}€</span>
        <span className="text-sm" style={{ color: 'var(--lp-text-muted)' }}>/ mj</span>
        {originalPrice && (
          <span className="line-through text-lg" style={{ color: 'var(--lp-text-muted)', textDecorationColor: 'var(--lp-accent-red)' }}>{originalPrice}€</span>
        )}
      </div>

      {targetAudience && (
        <div className="text-xs italic pt-2 mt-2" style={{ color: 'var(--lp-text-muted)', borderTop: '1px solid var(--lp-border)' }}>
          Za: {targetAudience}
        </div>
      )}
    </div>

    <ul className="flex-1 space-y-3 mb-8">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-3 text-sm">
          <Check size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--lp-accent-green)' }} />
          <span style={{ color: 'var(--lp-text-secondary)' }}>{feature}</span>
        </li>
      ))}
    </ul>

    <button
      onClick={() => onCheckout(priceId)}
      disabled={loading}
      className="w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      style={{
        background: recommended ? 'var(--lp-accent-green)' : 'var(--lp-heading)',
        color: recommended ? '#fff' : 'var(--lp-bg)',
      }}
    >
      {loading ? <><RefreshCw className="animate-spin" size={18} /> Spajanje...</> : 'Odaberi paket'}
    </button>
  </div>
);

export default function Pricing({ onCheckout, checkoutLoading }) {
  return (
    <section id="pricing" className="py-24 relative" style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
              Cijene
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--lp-heading)' }}>
              Jednostavne, <span style={{ color: 'var(--lp-accent-green)' }}>transparentne</span> cijene
            </h2>
            <p className="text-lg mb-6" style={{ color: 'var(--lp-text-secondary)' }}>Bez ugovorne obveze. Otkaži bilo kada.</p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold animate-pulse" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--lp-accent-orange)' }}>
              <Sparkles size={16} /> AKCIJA: Posebna cijena za prvih 1000 korisnika!
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16 text-sm" style={{ color: 'var(--lp-text-muted)' }}>
            {['Mjesečna pretplata', 'Bez ugovorne obveze', 'Otkaži bilo kada', 'Brza isporuka'].map(t => (
              <div key={t} className="flex items-center gap-2 font-medium">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--lp-accent-green)' }} /> {t}
              </div>
            ))}
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
          <FadeIn delay={100} className="h-full">
            <PricingCard title="Starter" price="39" originalPrice="49" icon={Star} priceId="price_1SxaGbKhkXukXczcwVqlzrOx" onCheckout={onCheckout} loading={checkoutLoading} description="Za testiranje poslovne ideje i jednostavan nastup." targetAudience="Poduzetnici početnici, obrti" features={['Jednostavna landing stranica', 'Kontakt sekcija / forma', 'Moderan i responzivan dizajn', 'Hosting (Vercel)', 'Povezivanje vlastite domene', 'Osnovne animacije (scroll, hover)', 'Email notifikacije']} />
          </FadeIn>
          <FadeIn delay={200} className="h-full">
            <PricingCard title="Advanced" price="89" originalPrice="99" icon={Rocket} priceId="price_1SxaHAKhkXukXczc0cPpLMH2" onCheckout={onCheckout} loading={checkoutLoading} recommended={true} description="Za aktivne biznise koji žele brzo doći do klijenata." targetAudience="Mali biznisi, uslužne djelatnosti" features={['Više podstranica (Naslovna, Usluge...)', 'Moderan dizajn + animacije', 'Hosting i domena uključeni', 'Google Ads kampanja (postavljanje)', 'Održavanje i tehnička podrška', 'Brza isporuka']} />
          </FadeIn>
          <FadeIn delay={300} className="h-full">
            <PricingCard title="Paket za poduzetnike" price="399" icon={ShoppingBag} priceId="price_1T0S19KhkXukXczcZhmjaqSF" onCheckout={onCheckout} loading={checkoutLoading} description="Za poduzetnike s više brendova ili lokacija." targetAudience="Agencije, franšize, više lokacija" features={['5 profesionalnih web stranica', 'Sve iz Advanced paketa × 5', 'Zajednički dashboard za upravljanje', 'Google Ads za sve stranice', 'Prioritetna podrška', 'Hosting i domene uključeni']} />
          </FadeIn>
        </div>

        {/* Extras */}
        <FadeIn delay={350}>
          <div className="max-w-4xl mx-auto mb-20">
            <h3 className="text-lg font-bold mb-6 text-center" style={{ color: 'var(--lp-heading)' }}>Dodatne opcije</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              {[
                { icon: Zap, title: 'Google Ads Vođenje', price: '+50€ / mjesečno' },
                { icon: Monitor, title: '3 AI SEO Članka', price: '+60€ / mjesečno' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-xl flex-1" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
                  <div className="p-2 rounded-lg" style={{ background: 'var(--lp-bg)', color: 'var(--lp-heading)' }}><item.icon size={20} /></div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--lp-heading)' }}>{item.title}</div>
                    <div className="text-xs" style={{ color: 'var(--lp-text-muted)' }}>{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Buyout */}
        <FadeIn delay={400}>
          <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
            <div className="p-8 text-center" style={{ borderBottom: '1px solid var(--lp-border)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--lp-heading)' }}>Želite otkupiti web? Pogledajte opcije.</h3>
              <p style={{ color: 'var(--lp-text-muted)' }}>Nudimo i opciju jednokratnog otkupa stranice.</p>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--lp-border)' }}>
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--lp-accent-blue)' }}><CreditCard size={20} /></div>
                  <h4 className="text-base font-bold" style={{ color: 'var(--lp-heading)' }}>Otkup weba (Jednokratno)</h4>
                </div>
                {[
                  { label: 'Landing Page', price: '390 €' },
                  { label: 'Web Stranica', price: '790 €' },
                  { label: 'Web Shop', price: '1.990 €' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}>
                    <span style={{ color: 'var(--lp-text-secondary)' }}>{item.label}</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--lp-heading)' }}>{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--lp-accent-orange)' }}><RefreshCw size={20} /></div>
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
                      <span className="font-bold" style={{ color: 'var(--lp-heading)' }}>{item.price} <span className="text-xs font-normal" style={{ color: 'var(--lp-text-muted)' }}>{item.period}</span></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--lp-bg)', color: 'var(--lp-text-muted)' }}>{tag}</span>
                      ))}
                    </div>
                    {idx === 0 && <div className="w-full h-px my-4" style={{ background: 'var(--lp-border)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
