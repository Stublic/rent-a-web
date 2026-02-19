'use client';
import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { FadeIn } from './Animations';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (response.ok) { setSuccess(true); setFormData({ name: '', email: '', phone: '', company: '', message: '' }); }
      else setError(data.error || 'Došlo je do greške');
    } catch { setError('Došlo je do greške pri slanju poruke'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputStyle = { background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-text)' };

  return (
    <section id="contact" className="py-24 relative overflow-hidden" style={{ background: 'var(--lp-surface)' }}>
      <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 60%)' }} />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
              Kontakt
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" style={{ color: 'var(--lp-heading)' }}>Spremni pokrenuti posao?</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--lp-text-secondary)' }}>
              Profesionalna web stranica bez glavobolje. Ispuni formu i krećemo odmah.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-5 p-7 rounded-2xl" style={{ background: 'var(--lp-card)', border: '1px solid var(--lp-card-border)' }}>
              {success && <div className="p-4 rounded-xl text-center text-sm font-medium" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--lp-accent-green)' }}>✅ Poruka uspješno poslana! Javit ćemo vam se uskoro.</div>}
              {error && <div className="p-4 rounded-xl text-center text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--lp-accent-red)' }}>{error}</div>}

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-medium ml-1" style={{ color: 'var(--lp-text-muted)' }}>Ime i prezime</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:opacity-40" style={inputStyle} placeholder="Ivan Horvat" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="company" className="text-xs font-medium ml-1" style={{ color: 'var(--lp-text-muted)' }}>Ime tvrtke</label>
                  <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:opacity-40" style={inputStyle} placeholder="Moja Tvrtka d.o.o." />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-medium ml-1" style={{ color: 'var(--lp-text-muted)' }}>Email adresa</label>
                  <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:opacity-40" style={inputStyle} placeholder="ivan@primjer.hr" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-medium ml-1" style={{ color: 'var(--lp-text-muted)' }}>Broj telefona</label>
                  <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:opacity-40" style={inputStyle} placeholder="+385 91 123 4567" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-medium ml-1" style={{ color: 'var(--lp-text-muted)' }}>Poruka</label>
                <textarea name="message" id="message" rows="4" value={formData.message} onChange={handleChange} required className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none placeholder:opacity-40" style={inputStyle} placeholder="Zanima me paket za poduzetnike..." />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 text-white" style={{ background: 'var(--lp-accent-green)', boxShadow: '0 8px 30px rgba(34,197,94,0.12)' }}>
                {loading ? 'Šaljem...' : 'Pošalji upit'} <ArrowRight size={16} />
              </button>
              <div className="flex items-center justify-center gap-2 text-xs mt-2" style={{ color: 'var(--lp-text-muted)' }}>
                <ShieldCheck size={14} style={{ color: 'var(--lp-accent-green)' }} />
                <span>Bez skrivenih troškova. Otkažite bilo kada.</span>
              </div>
            </form>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
