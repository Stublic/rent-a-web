'use client';
import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, Layout } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FadeIn } from './Animations';

const TrendingUpIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

export default function AIConsultant() {
  const [businessInput, setBusinessInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generateIdeas = async (e) => {
    e.preventDefault();
    if (!businessInput.trim()) return;
    setLoading(true); setError(null); setResult(null);
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) { setError('Greška: API ključ nije pronađen.'); setLoading(false); return; }
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Ti si vrhunski prodajni strateg i web dizajner. Korisnik opisuje svoj posao: "${businessInput}".
        Tvoj cilj je oduševiti korisnika i pokazati mu da je web stranica investicija, a ne trošak. Guraj najčešće Advanced paket, Paket za poduzetnike za korisnike koji trebaju više web stranica.
        Vrati SAMO JSON objekt (bez markdowna) sa sljedećim poljima na hrvatskom:
        { "slogan": "Kreativan i pamtljiv slogan", "package": "Starter, Advanced ili Paket za poduzetnike", "reason": "Zašto baš taj paket",
          "roi_analysis": { "break_even": "Koliko prodaja/usluga je potrebno da se pokrije mjesečna pretplata", "potential": "Konzervativna procjena zarade uz dobar web", "value_proposition": "Jedna rečenica koja naglašava povrat uloženog" },
          "visual_style": { "primary_color": "Hex kod", "secondary_color": "Hex kod", "vibe": "Opis atmosfere" }
        }
        Budi optimističan, ali realan s brojkama i cijene prikaži u €.`;
      const res = await model.generateContent(prompt);
      let text = (await res.response).text().replace(/```json/g, '').replace(/```/g, '').trim();
      setResult(JSON.parse(text));
    } catch (err) { console.error('AI Error:', err); setError('Došlo je do greške. Pokušajte ponovno.'); }
    finally { setLoading(false); }
  };

  return (
    <section id="ai-consultant" className="py-24 relative overflow-hidden" style={{ background: 'var(--lp-bg-alt)', borderTop: '1px solid var(--lp-border)' }}>
      <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', color: '#a78bfa' }}>
              <Sparkles size={13} /> AI POSLOVNI SAVJETNIK
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'var(--lp-heading)' }}>Saznajte potencijal svoje ideje</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--lp-text-secondary)' }}>Unesite čime se bavite, a mi ćemo vam izračunati isplativost.</p>
          </div>

          <div className="p-6 md:p-8 rounded-2xl" style={{ background: 'var(--lp-card)', border: '1px solid var(--lp-card-border)' }}>
            <form onSubmit={generateIdeas} className="flex flex-col md:flex-row gap-4 mb-8">
              <input type="text" value={businessInput} onChange={e => setBusinessInput(e.target.value)}
                placeholder="Npr. Apartmani na moru, Instrukcije iz matematike..."
                className="flex-1 rounded-xl px-5 py-4 focus:outline-none transition-all text-sm placeholder:opacity-40"
                style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-text)' }} />
              <button type="submit" disabled={loading || !businessInput.trim()}
                className="text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                style={{ background: '#7c3aed' }}>
                {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Analiziraj 🚀</>}
              </button>
            </form>

            {error && <div className="p-4 rounded-xl text-center text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--lp-accent-red)' }}>{error}</div>}

            {result && (
              <div className="space-y-6" style={{ animation: 'fade-up 0.5s ease-out' }}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold lp-gradient-text mb-2">&ldquo;{result.slogan}&rdquo;</h3>
                  <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--lp-text-muted)' }}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: result.visual_style?.primary_color }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: result.visual_style?.secondary_color }} />
                    <span>Stil: {result.visual_style?.vibe}</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl" style={{ background: 'var(--lp-bg)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div className="flex items-center gap-2 font-bold mb-4 text-xs uppercase tracking-wider" style={{ color: 'var(--lp-accent-green)' }}>
                      <TrendingUpIcon size={16} /> Procjena Zarade
                    </div>
                    <div className="space-y-3">
                      <div><div className="text-xs uppercase font-bold" style={{ color: 'var(--lp-text-muted)' }}>Točka pokrića</div><div className="font-medium text-base" style={{ color: 'var(--lp-heading)' }}>{result.roi_analysis?.break_even}</div></div>
                      <div><div className="text-xs uppercase font-bold" style={{ color: 'var(--lp-text-muted)' }}>Potencijal</div><div className="text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{result.roi_analysis?.potential}</div></div>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)' }}>
                    <div className="flex items-center gap-2 font-bold mb-4 text-xs uppercase tracking-wider" style={{ color: 'var(--lp-accent-blue)' }}>
                      <Layout size={16} /> Preporuka: {result.package}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--lp-text-secondary)' }}>{result.reason}</p>
                  </div>
                </div>
                <div className="text-center mt-6">
                  <a href="#contact" className="inline-flex items-center gap-2 px-8 py-4 font-bold rounded-xl transition-all" style={{ background: 'var(--lp-heading)', color: 'var(--lp-bg)' }}>
                    Zatraži ponudu <ArrowRight size={18} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
