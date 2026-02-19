'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FadeIn } from './Animations';

const faqs = [
  { q: 'Moram li potpisati ugovor?', a: 'Ne. Svi paketi funkcioniraju kao mjesečna pretplata bez ugovorne obveze. Pretplatu možete otkazati u bilo kojem trenutku.' },
  { q: 'Koliko brzo dobivam web stranicu?', a: 'Landing page je gotov unutar 48 sati od trenutka kada zaprimimo sve podatke.\n\nWeb stranice u roku 5–7 radnih dana, ovisno o paketu.' },
  { q: 'Što ako želim prestati koristiti uslugu?', a: 'Jednostavno otkažete pretplatu.\n\nNema penala, nema skrivenih troškova.' },
  { q: 'Mogu li kasnije otkupiti web stranicu?', a: 'Da. U bilo kojem trenutku možete otkupiti web:\n\n• Landing page: 390 €\n• Web stranica: 790 €\n• Web shop: 1.990 €\n\nUz godišnje održavanje:\n• Web stranice: 250 € / god\n• Web shop: 350 € / god' },
  { q: 'Što se događa ako ne otkupim web?', a: 'Web ostaje aktivan dok traje pretplata. Ako otkažete pretplatu i ne otkupite web, stranica se gasi.' },
  { q: 'Je li hosting uključen u cijenu?', a: 'Da. Hosting, tehničko održavanje i osnovna podrška uključeni su u sve pakete.' },
  { q: 'Mogu li koristiti vlastitu domenu?', a: 'Da. Ako već imate domenu, povezujemo je bez dodatnih troškova.\n\nAko nemate, možemo osigurati domenu uz godišnju naknadu.' },
  { q: 'Mogu li kasnije promijeniti paket?', a: 'Naravno. Paket možete nadograditi ili promijeniti u bilo kojem trenutku.' },
  { q: 'Što je s Google oglasima?', a: 'U Advanced paketu Google Ads su uključeni.\n\nZa Paket za poduzetnike Google Ads su uključeni za sve stranice. Budžet za oglase nije uključen.' },
  { q: 'Jesu li cijene konačne?', a: 'Da. Nema skrivenih troškova. Sve što je uključeno u paket jasno je navedeno.' },
  { q: 'Je li ovo rješenje za mene ako tek pokrećem posao?', a: 'Da — upravo za to je i namijenjeno.\n\nNajam weba omogućuje vam da krenete bez velikog početnog ulaganja i testirate ideju bez rizika.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-24" style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
              FAQ
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold" style={{ color: 'var(--lp-heading)' }}>Česta pitanja</h2>
          </div>

          <div className="space-y-1">
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid var(--lp-border)' }}>
                <button
                  className="w-full py-5 flex justify-between items-center text-left transition-colors"
                  onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                >
                  <span className="text-base font-semibold pr-4" style={{ color: 'var(--lp-heading)' }}>{faq.q}</span>
                  <ChevronDown
                    className="transition-transform duration-300 shrink-0"
                    style={{ color: openIndex === idx ? 'var(--lp-accent-green)' : 'var(--lp-text-muted)', transform: openIndex === idx ? 'rotate(180deg)' : 'none' }}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-[800px] opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
                  <p className="leading-relaxed whitespace-pre-line text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
