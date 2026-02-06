'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  ChevronDown,
  ArrowRight,
  Monitor,
  ShoppingBag,
  Rocket,
  ShieldCheck,
  CreditCard,
  Menu,
  X,
  Star,
  Zap,
  Layout,
  ExternalLink,
  Quote,
  RefreshCw,
  Server,
  Lock,
  MessageCircle,
  Sparkles,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadStripe } from '@stripe/stripe-js';

// Init Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// --- Components ---

// 1. Intersection Observer Hook for Scroll Animations
const useOnScreen = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // Only trigger once
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref, options]);

  return [ref, isVisible];
};

// Wrapper for animated sections
const FadeIn = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      // 'will-change-transform' helps iOS Safari prepare the GPU
      className={`transform-gpu will-change-transform transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// 2. Navigation
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-zinc-800 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#" className="flex items-center gap-3 group">
          {/* Updated Logo Image */}
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img
              src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png"
              alt="Rent a Web Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-2xl text-white tracking-tight">
            Rent a Web
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 font-medium text-zinc-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">Kako radi</a>
          <a href="#examples" className="hover:text-white transition-colors">Primjeri</a>
          <a href="#pricing" className="hover:text-white transition-colors">Cijene</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Iskustva</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <a href="#ai-consultant" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"><Sparkles size={14} /> AI Analiza</a>

          {/* Removed "Kontakt" link */}
          <a href="#contact" className="px-5 py-2.5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95">
            Započni
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 p-6 flex flex-col gap-4 shadow-xl">
          <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Kako radi</a>
          <a href="#examples" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Primjeri</a>
          <a href="#ai-consultant" onClick={() => setIsOpen(false)} className="text-lg font-medium text-purple-400 flex items-center gap-2"><Sparkles size={16} /> AI Analiza</a>
          <a href="#pricing" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Cijene</a>
          <a href="#testimonials" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Iskustva</a>
          <a href="#faq" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">FAQ</a>
          <a href="#contact" onClick={() => setIsOpen(false)} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-center block">Započni</a>
        </div>
      )}
    </nav>
  );
};

// --- AI Consultant Component (Delight Version) ---
const AIConsultant = () => {
  const [businessInput, setBusinessInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generateIdeas = async (e) => {
    e.preventDefault();
    if (!businessInput.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Dohvaćamo API ključ
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      setError("Greška: API ključ nije pronađen. Kontaktirajte administratora.");
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Ti si vrhunski prodajni strateg i web dizajner. Korisnik opisuje svoj posao: "${businessInput}".
        
        Tvoj cilj je oduševiti korisnika i pokazati mu da je web stranica investicija, a ne trošak.
        Vrati SAMO JSON objekt (bez markdowna) sa sljedećim poljima na hrvatskom:

        {
          "slogan": "Kreativan i pamtljiv slogan",
          "structure": ["Sekcija 1", "Sekcija 2", "Sekcija 3"],
          "package": "Starter, Advanced ili Web Shop Start",
          "reason": "Zašto baš taj paket",
          "roi_analysis": {
             "break_even": "Koliko prodaja/usluga je potrebno da se pokrije mjesečna pretplata (npr. 'Samo 2 šišanja mjesečno pokrivaju trošak!')",
             "potential": "Konzervativna procjena zarade uz dobar web (npr. 'Uz 500 posjeta i 2% konverzije, to je 10 novih klijenata mjesečno.')",
             "value_proposition": "Jedna rečenica koja naglašava povrat uloženog (npr. 'Jedan novi klijent plaća cijelu godinu hostinga.')"
          },
          "visual_style": {
             "primary_color": "Hex kod (npr. #22c55e)",
             "secondary_color": "Hex kod (npr. #1da1f2)",
             "vibe": "Opis atmosfere (npr. Luksuzno i minimalistički)"
          }
        }
        
        Budi optimističan, ali realan s brojkama i cijene prikaži u €.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean JSON
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);

      // Safety checks
      if (!parsed.structure) parsed.structure = ["Naslovna", "Ponuda", "Kontakt"];
      if (!Array.isArray(parsed.structure)) parsed.structure = [parsed.structure];

      setResult(parsed);

    } catch (err) {
      console.error("AI Error:", err);
      setError("Došlo je do greške. Pokušajte ponovno.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-consultant" className="py-24 bg-zinc-900 border-t border-zinc-800 relative overflow-hidden">
      {/* iOS Optimized Backgrounds - Reduced size and blur */}
      <div className="absolute top-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-purple-900/20 rounded-full blur-[40px] md:blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-indigo-900/20 rounded-full blur-[40px] md:blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold mb-4">
              <Sparkles size={14} /> AI POSLOVNI SAVJETNIK
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Saznajte potencijal svoje ideje</h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Unesite čime se bavite, a mi ćemo vam izračunati isplativost.
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-zinc-700 rounded-3xl p-6 md:p-8 shadow-2xl">
            <form onSubmit={generateIdeas} className="flex flex-col md:flex-row gap-4 mb-8">
              <input
                type="text"
                value={businessInput}
                onChange={(e) => setBusinessInput(e.target.value)}
                placeholder="Npr. Apartmani na moru, Instrukcije iz matematike..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={loading || !businessInput.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Analiziraj 🚀</>}
              </button>
            </form>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                {error}
              </div>
            )}

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-2">
                    "{result.slogan}"
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: result.visual_style?.primary_color }}></span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: result.visual_style?.secondary_color }}></span>
                    <span>Stil: {result.visual_style?.vibe}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-zinc-800/30 border border-green-500/30 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 text-green-400 font-bold mb-4 text-sm uppercase tracking-wider">
                      <TrendingUpIcon size={18} /> Procjena Zarade
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-zinc-400 text-xs uppercase font-bold">Točka pokrića</div>
                        <div className="text-white font-medium text-lg">{result.roi_analysis?.break_even}</div>
                      </div>
                      <div>
                        <div className="text-zinc-400 text-xs uppercase font-bold">Potencijal</div>
                        <div className="text-zinc-300 text-sm">{result.roi_analysis?.potential}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-800/30 border border-zinc-700/50 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 text-blue-400 font-bold mb-4 text-sm uppercase tracking-wider">
                      <Layout size={18} /> Preporuka: {result.package}
                    </div>
                    <p className="text-zinc-300 text-sm mb-4">{result.reason}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.structure.map((sec, i) => (
                        <span key={i} className="text-xs bg-black border border-zinc-700 px-2 py-1 rounded text-zinc-400">
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <a href="#contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all">
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
};

// Pomoćna ikona za ROI karticu (dodajte ovo na vrh gdje su importi ako želite, ili koristite postojeću)
const TrendingUpIcon = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

// 3. Pricing Card Component
const PricingCard = ({ title, price, features, recommended = false, description, icon: Icon, targetAudience, priceId, onCheckout, loading }) => (
  <div className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 border ${recommended ? 'bg-zinc-900 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] scale-105 z-10' : 'bg-black border-zinc-800 hover:border-zinc-700'}`}>
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">
        Najpopularnije
      </div>
    )}

    <div className="mb-6">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${recommended ? 'bg-green-600/20 text-green-500' : 'bg-zinc-800 text-white'}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-sm mb-4 text-zinc-400 min-h-[40px]">{description}</p>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-extrabold text-white">{price}€</span>
        <span className="text-sm text-zinc-500">/ mj</span>
      </div>

      {targetAudience && (
        <div className="text-xs text-zinc-500 italic border-t border-zinc-800/50 pt-2 mt-2">
          Za: {targetAudience}
        </div>
      )}
    </div>

    <ul className="flex-1 space-y-3 mb-8">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-3 text-sm">
          <Check size={16} className="shrink-0 text-green-500 mt-0.5" />
          <span className="text-zinc-300 leading-snug">{feature}</span>
        </li>
      ))}
    </ul>

    <button
      onClick={() => onCheckout(priceId)}
      disabled={loading}
      className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${recommended ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-white text-black hover:bg-zinc-200'} disabled:opacity-50`}
    >
      {loading ? (
        <>
          <RefreshCw className="animate-spin" size={18} />
          <span>Spajanje...</span>
        </>
      ) : (
        "Odaberi paket"
      )}
    </button>
  </div>
);

// 4. Accordion Component
const AccordionItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-zinc-800 last:border-0">
    <button
      className="w-full py-6 flex justify-between items-center text-left hover:text-green-500 transition-colors"
      onClick={onClick}
    >
      <span className="text-lg font-semibold text-white">{question}</span>
      <ChevronDown className={`transition-transform duration-300 text-zinc-500 ${isOpen ? 'rotate-180 text-green-500' : ''}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
      <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{answer}</p>
    </div>
  </div>
);

// 5. Review Card (New Design)
const ReviewCard = ({ name, role, text, stars = 5, avatarColor }) => (
  <div className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl transition-all duration-300 hover:border-zinc-700 hover:shadow-xl hover:shadow-green-900/10 flex flex-col h-full">
    {/* Quote Icon Background */}
    <div className="absolute top-6 right-8 text-zinc-800 group-hover:text-green-900/30 transition-colors">
      <Quote size={48} fill="currentColor" stroke="none" />
    </div>

    {/* Stars */}
    <div className="flex gap-1 text-green-500 mb-6 relative z-10">
      {[...Array(stars)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
    </div>

    {/* Text */}
    <p className="text-zinc-300 mb-8 leading-relaxed relative z-10 flex-grow">
      "{text}"
    </p>

    {/* User Info */}
    <div className="flex items-center gap-4 mt-auto border-t border-zinc-800/50 pt-6">
      <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center font-bold text-white text-lg shadow-inner`}>
        {name.charAt(0)}
      </div>
      <div>
        <div className="font-bold text-white text-base">{name}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{role}</div>
      </div>
    </div>
  </div>
);

// 6. Contact Form Component
const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', company: '', message: '' });
      } else {
        setError(data.error || 'Došlo je do greške');
      }
    } catch (err) {
      setError('Došlo je do greške pri slanju poruke');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-black/50 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 shadow-2xl">
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center">
          ✅ Poruka uspješno poslana! Javit ćemo vam se uskoro.
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-400 ml-1">Ime i prezime</label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600"
            placeholder="Ivan Horvat"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium text-zinc-400 ml-1">Ime tvrtke</label>
          <input
            type="text"
            name="company"
            id="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600"
            placeholder="Moja Tvrtka d.o.o."
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-400 ml-1">Email adresa</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600"
            placeholder="ivan@primjer.hr"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-zinc-400 ml-1">Broj telefona</label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600"
            placeholder="+385 91 123 4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-zinc-400 ml-1">Poruka</label>
        <textarea
          name="message"
          id="message"
          rows="4"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600 resize-none"
          placeholder="Zanima me paket Web Shop Start..."
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.01] shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
      >
        {loading ? 'Šaljem...' : 'Pošalji upit'} <ArrowRight size={18} />
      </button>

      <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm mt-4">
        <ShieldCheck size={16} className="text-green-500" />
        <span>Bez skrivenih troškova. Otkažite bilo kada.</span>
      </div>
    </form>
  );
};

// --- Main App Component ---

const App = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? -1 : index);
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async (priceId) => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const session = await response.json();

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error(session.error || 'Greška pri kreiranju sesije');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Došlo je do greške pri povezivanju sa Stripeom. Pokušajte ponovno.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="font-sans antialiased text-white bg-black selection:bg-green-900 selection:text-green-100 overflow-x-hidden" style={{ fontFamily: "'Satoshi', sans-serif" }}>

      {/* Load Satoshi Font */}
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap');
      `}</style>

      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* iOS Optimized Background Effects (Reduced Blur radius) */}
        <div className="absolute top-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-green-900/10 rounded-full blur-[40px] md:blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-zinc-800/20 rounded-full blur-[40px] md:blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* REMOVED FadeIn from Hero Text for Instant Paint on Mobile */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm mb-8 animate-in fade-in zoom-in duration-700">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-zinc-300">Web stranice gotove za 48 sati</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700 delay-100">
            Prestanite kupovati stranice. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              Počnite ih unajmljivati.
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-200">
            Profesionalne web stranice za male poduzetnike.
            Plaćajte mjesečno, otkažite bilo kada. Bez velikih početnih troškova i bez ugovorne obveze.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all transform hover:-translate-y-1">
              Odaberi paket
            </a>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-black hover:bg-zinc-900 text-white border border-zinc-700 rounded-xl font-bold transition-all hover:border-zinc-500 flex items-center justify-center gap-2 group">
              Kako radi
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <FadeIn delay={500} className="mt-16 flex flex-col items-center gap-4">
            <div className="text-sm font-semibold text-zinc-500 tracking-widest uppercase">VIŠE OD 500 ZADOVOLJNIH KORISNIKA</div>
            <div className="flex gap-1 text-green-500 opacity-80">
              {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-24 bg-black relative border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Jednostavnije ne može</h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">Mi rješavamo tehničke stvari. Vi se fokusirajte na svoj posao.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent z-0"></div>

            {[
              { icon: CreditCard, title: "1. Odaberi paket", desc: "Odaberite paket koji odgovara vašim potrebama. Jednostavna stranica ili web shop." },
              { icon: Rocket, title: "2. Mi izrađujemo", desc: "Naši stručnjaci dizajniraju i postavljaju vašu stranicu. Većina je gotova za 2-5 radnih dana." },
              { icon: Monitor, title: "3. Tvoja stranica je live", desc: "Stranica se objavljuje. Mi vodimo brigu o hostingu, ažuriranjima i održavanju zauvijek." }
            ].map((step, idx) => (
              <FadeIn key={idx} delay={idx * 200} className="relative z-10 bg-black p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-black border border-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <div className="w-12 h-12 text-white">
                      <step.icon size={48} strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- EXAMPLES / PORTFOLIO --- */}
      <section id="examples" className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Naši radovi</h2>
                <p className="text-zinc-400 text-lg">Inspirirajte se stvarnim projektima koje smo realizirali. Moderan dizajn prilagođen vašem brendu.</p>
              </div>
              <a href="https://webica.hr/projects" target="_blank" rel="noopener noreferrer" className="text-green-500 font-bold hover:text-green-400 flex items-center gap-2 transition-colors">
                Pogledaj sve projekte <ArrowRight size={18} />
              </a>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                type: "GPS Nadzor",
                title: "BeeDigital",
                desc: "Robert Idlbek",
                image: "https://framerusercontent.com/images/fxB4wAs94zelUEeHov4f7Uz1zCQ.jpg?width=1280&height=1920",
                link: "https://www.beedigital.hr/"
              },
              {
                type: "Radna obuća i odjeća",
                title: "Franjić Teks",
                desc: "Adrijana Stjepić",
                image: "https://framerusercontent.com/images/I8jySdxIGn7Oarf2fG2udvv8VM.jpg?scale-down-to=2048&width=5760&height=3840",
                link: "https://franjic-teks.com/"
              },
              {
                type: "Fizikalna terapija",
                title: "Motion rehab",
                desc: "Dario Cesarec",
                image: "https://framerusercontent.com/images/ujHzFRoyQhaCk2fISaq0mnrmJIQ.jpeg?width=1365&height=2048",
                link: "https://motionrehab.hr/"
              },
              {
                type: "Ogradni sustavi",
                title: "DANKO",
                desc: "Danko Đurić",
                image: "https://framerusercontent.com/images/cDcL8UNK1dYJUT7My86P8E8jtAw.png?width=2048&height=1921",
                link: "https://danko-trgovina.hr/"
              },
              {
                type: "Dječje igračke",
                title: "Spretno djetinjstvo",
                desc: "Marija Krišto",
                image: "https://framerusercontent.com/images/WQzUVneLpD2GesTxVokqZw8.png?width=1024&height=683",
                link: "https://spretnodjetinjstvo.com/"
              },
              {
                type: "Jedrenje i turizam",
                title: "Serenity",
                desc: "Domagoj Gašparić",
                image: "https://framerusercontent.com/images/picDScvwhZzkFEkNYOjyxr1au8.webp?width=1600&height=1067",
                link: "https://nautic-sailcroatia.com/"
              }
            ].map((item, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="group relative block bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer h-full flex flex-col">
                  {/* Real Image Placeholder */}
                  <div className="aspect-video w-full overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60"></div>
                  </div>

                  {/* Overlay Button */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <ExternalLink size={16} />
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-end relative z-10 -mt-8">
                    <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">{item.type}</div>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
                  </div>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --- BENEFITS --- */}
      <section id="benefits" className="py-24 bg-black border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <FadeIn>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Zašto unajmiti umjesto kupiti?
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                Tradicionalna izrada web stranica zahtijeva tisuće eura unaprijed, a stranica zastari za dvije godine. Naš model pretplate vas drži u koraku s vremenom.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Bez troškova unaprijed", desc: "Sačuvajte svoj kapital." },
                  { title: "Otkaži bilo kada", desc: "Bez dugoročnih ugovora." },
                  { title: "Hosting uključen", desc: "Brzi i sigurni serveri." },
                  { title: "Brza isporuka", desc: "Online za nekoliko dana." },
                  { title: "SEO Optimizacija", desc: "Bolja vidljivost na Googleu." },
                  { title: "Stalna podrška", desc: "Tu smo kad nas trebate." },
                  { title: "Responzivan dizajn", desc: "Izgleda sjajno na mobitelu." },
                  { title: "Sigurnost uključena", desc: "SSL certifikat i zaštita." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-green-900/30 flex items-center justify-center shrink-0 border border-green-900">
                      <Check size={14} className="text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="bg-zinc-900 p-6 md:p-8 rounded-3xl border border-zinc-800 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  Usporedba modela
                </h3>

                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-3">
                    <div className="col-span-4">Stavka</div>
                    <div className="col-span-4 text-red-500">Klasična izrada</div>
                    <div className="col-span-4 text-green-500 text-right">Rent a Web</div>
                  </div>

                  {/* Comparison Rows */}
                  {[
                    { label: "Početna cijena", old: "800€ - 4500€", new: "0€" },
                    { label: "Rok isporuke", old: "4 - 8 tjedana", new: "2 - 5 dana" },
                    { label: "Godišnje održavanje", old: "300€ - 800€", new: "Uključeno" },
                    { label: "Satnica programera", old: "50€ / sat", new: "Uključeno" },
                    { label: "Sigurnost & Backup", old: "Dodatno se plaća", new: "Uključeno" },
                    { label: "Tehnologija", old: "Zastarijeva", new: "Uvijek ažurno" },
                  ].map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-sm items-center py-3 border-b border-zinc-800/50 last:border-0 group hover:bg-zinc-800/30 transition-colors px-2 -mx-2 rounded-lg">
                      <div className="col-span-4 font-medium text-zinc-300">{item.label}</div>
                      <div className="col-span-4 text-zinc-500 text-xs sm:text-sm">{item.old}</div>
                      <div className="col-span-4 font-bold text-white text-right text-xs sm:text-sm">{item.new}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800 text-center bg-zinc-900/50 rounded-xl">
                  <p className="text-zinc-400 text-sm mb-1">Ukupna ušteda u prvoj godini</p>
                  <p className="text-2xl font-bold text-white">preko <span className="text-green-500">2.500 €</span></p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* --- AI Consultant Section --- */}
      <AIConsultant />

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-black relative border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Jednostavne, transparentne cijene</h2>
              <p className="text-zinc-400 text-lg">Odaberite opciju koja vam najviše odgovara. Bez ugovorne obveze.</p>
            </div>

            {/* Common Features Banner */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16 text-sm md:text-base text-zinc-400 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Mjesečna pretplata
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Bez ugovorne obveze
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Otkaži bilo kada
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Brza isporuka
              </div>
            </div>
          </FadeIn>

          {/* SUBSCRIPTION CARDS */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            <FadeIn delay={100} className="h-full">
              <PricingCard
                title="Starter"
                price="39"
                icon={Star}
                priceId="price_1SxaGbKhkXukXczcwVqlzrOx"
                onCheckout={handleCheckout}
                loading={checkoutLoading}
                description="Za testiranje poslovne ideje i jednostavan nastup."
                targetAudience="Poduzetnici početnici, obrti"
                features={[
                  "Jednostavna landing stranica",
                  "Kontakt sekcija / forma",
                  "Moderan i responzivan dizajn",
                  "Hosting (Vercel)",
                  "Povezivanje vlastite domene",
                  "Osnovne animacije (scroll, hover)",
                  "Email notifikacije"
                ]}
              />
            </FadeIn>

            <FadeIn delay={200} className="h-full">
              <PricingCard
                title="Advanced"
                price="89"
                icon={Rocket}
                priceId="price_1SxaHAKhkXukXczc0cPpLMH2"
                onCheckout={handleCheckout}
                loading={checkoutLoading}
                recommended={true}
                description="Za aktivne male biznise koji žele brzo doći do klijenata."
                targetAudience="Mali biznisi, uslužne djelatnosti"
                features={[
                  "Više podstranica (Naslovna, Usluge...)",
                  "Moderan dizajn + animacije",
                  "Hosting i domena uključeni",
                  "Google Ads kampanja (postavljanje)",
                  "Održavanje i tehnička podrška",
                  "Brza isporuka"
                ]}
              />
            </FadeIn>

            <FadeIn delay={300} className="h-full">
              <PricingCard
                title="Web Shop Start"
                price="199"
                icon={ShoppingBag}
                priceId="price_1SxaHkKhkXukXczcEyO1eXFe"
                onCheckout={handleCheckout}
                loading={checkoutLoading}
                description="Krenite u online prodaju bez velikog ulaganja."
                targetAudience="Mali webshopovi, prodaja proizvoda"
                features={[
                  "Web shop do 20 proizvoda",
                  "Košarica i checkout",
                  "Kartično plaćanje (Stripe)",
                  "Hosting i održavanje",
                  "Osnovni SEO",
                  "Moderan, responzivan dizajn",
                  "Integracija sa E-računi, SOLO, Synesis..."
                ]}
              />
            </FadeIn>
          </div>

          {/* EXTRAS */}
          <FadeIn delay={350}>
            <div className="max-w-4xl mx-auto mb-20">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Dodatne opcije za Web Shop</h3>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex-1">
                  <div className="p-2 bg-zinc-800 text-white rounded-lg"><Zap size={20} /></div>
                  <div>
                    <div className="font-bold text-white">Google Ads Vođenje</div>
                    <div className="text-sm text-zinc-500">+50€ / mjesečno</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex-1">
                  <div className="p-2 bg-zinc-800 text-white rounded-lg"><Monitor size={20} /></div>
                  <div>
                    <div className="font-bold text-white">3 AI SEO Članka</div>
                    <div className="text-sm text-zinc-500">+60€ / mjesečno</div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* BUYOUT & MAINTENANCE SECTION */}
          <FadeIn delay={400}>
            <div className="max-w-5xl mx-auto">
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-8 border-b border-zinc-800 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Želite otkupiti web? Pogledajte opcije.</h3>
                  <p className="text-zinc-400">Nudimo i opciju jednokratnog otkupa stranice.</p>
                </div>

                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                  {/* Left Col: One-time prices */}
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-blue-900/20 text-blue-500 flex items-center justify-center"><CreditCard size={20} /></div>
                      <h4 className="text-lg font-bold text-white">Otkup weba (Jednokratno)</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-zinc-800/50">
                        <span className="text-zinc-300 font-medium">Landing Page</span>
                        <span className="text-xl font-bold text-white">390 €</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-zinc-800/50">
                        <span className="text-zinc-300 font-medium">Web Stranica</span>
                        <span className="text-xl font-bold text-white">790 €</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-zinc-800/50">
                        <span className="text-zinc-300 font-medium">Web Shop</span>
                        <span className="text-xl font-bold text-white">1.990 €</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Annual Maintenance */}
                  <div className="p-8 space-y-6 bg-zinc-900/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-orange-900/20 text-orange-500 flex items-center justify-center"><RefreshCw size={20} /></div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Godišnje održavanje</h4>
                        <div className="text-xs text-orange-500 font-semibold uppercase tracking-wide">Obavezno uz otkup</div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="font-bold text-white">Za web stranice</span>
                          <span className="font-bold text-lg text-white">250 € <span className="text-xs font-normal text-zinc-500">/ god</span></span>
                        </div>
                        <div className="text-sm text-zinc-500 flex flex-wrap gap-2">
                          <span className="bg-zinc-800 px-2 py-1 rounded">.com domena</span>
                          <span className="bg-zinc-800 px-2 py-1 rounded">Hosting</span>
                          <span className="bg-zinc-800 px-2 py-1 rounded">Održavanje</span>
                          <span className="bg-zinc-800 px-2 py-1 rounded">Podrška</span>
                        </div>
                      </div>

                      <div className="w-full h-px bg-zinc-800"></div>

                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="font-bold text-white">Za web shop</span>
                          <span className="font-bold text-lg text-white">350 € <span className="text-xs font-normal text-zinc-500">/ god</span></span>
                        </div>
                        <div className="text-sm text-zinc-500 flex flex-wrap gap-2">
                          <span className="bg-zinc-800 px-2 py-1 rounded">Hosting</span>
                          <span className="bg-zinc-800 px-2 py-1 rounded">Sigurnost</span>
                          <span className="bg-zinc-800 px-2 py-1 rounded">Updateovi</span>
                          <span className="bg-zinc-800 px-2 py-1 rounded">Održavanje</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="testimonials" className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <h2 className="text-3xl font-bold text-center text-white mb-16">Što kažu naši korisnici</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            <FadeIn delay={0} className="h-full">
              <ReviewCard
                name="Dario Cesarec"
                role="Motion rehab"
                text="Pacijenti sada lako nalaze sve informacije o terapijama. Stranica izgleda profesionalno i ulijeva povjerenje, što je u mom poslu ključno."
                avatarColor="bg-blue-600"
              />
            </FadeIn>
            <FadeIn delay={150} className="h-full">
              <ReviewCard
                name="Danko Đurić"
                role="DANKO ogradni sustavi"
                text="Trebala mi je jednostavna stranica da prikažem naše projekte. Rent a Web je to riješio brzo, a upiti za ponude sada stižu redovito."
                avatarColor="bg-orange-600"
              />
            </FadeIn>
            <FadeIn delay={300} className="h-full">
              <ReviewCard
                name="Adrijana Stjepić"
                role="Franjić Teks"
                text="Naš asortiman radne odjeće napokon izgleda profesionalno online. Klijenti nas lakše nalaze, a ja se ne moram brinuti oko tehničkog održavanja."
                avatarColor="bg-purple-600"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-24 bg-black border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn>
            <h2 className="text-3xl font-bold text-center text-white mb-12">Česta pitanja</h2>
            <div className="space-y-2">
              {[
                {
                  q: "Moram li potpisati ugovor?",
                  a: "Ne. Svi paketi funkcioniraju kao mjesečna pretplata bez ugovorne obveze. Pretplatu možete otkazati u bilo kojem trenutku."
                },
                {
                  q: "Koliko brzo dobivam web stranicu?",
                  a: "Landing page je gotov unutar 48 sati od trenutka kada zaprimimo sve podatke.\n\nWeb stranice i webshopovi u roku 5–7 radnih dana, ovisno o paketu."
                },
                {
                  q: "Što ako želim prestati koristiti uslugu?",
                  a: "Jednostavno otkažete pretplatu.\n\nNema penala, nema skrivenih troškova."
                },
                {
                  q: "Mogu li kasnije otkupiti web stranicu?",
                  a: "Da. U bilo kojem trenutku možete otkupiti web:\n\n• Landing page: 390 €\n• Web stranica: 790 €\n• Web shop: 1.990 €\n\nUz godišnje održavanje:\n• Web stranice: 250 € / god\n• Web shop: 350 € / god"
                },
                {
                  q: "Što se događa ako ne otkupim web?",
                  a: "Web ostaje aktivan dok traje pretplata. Ako otkažete pretplatu i ne otkupite web, stranica se gasi."
                },
                {
                  q: "Je li hosting uključen u cijenu?",
                  a: "Da. Hosting, tehničko održavanje i osnovna podrška uključeni su u sve pakete."
                },
                {
                  q: "Mogu li koristiti vlastitu domenu?",
                  a: "Da. Ako već imate domenu, povezujemo je bez dodatnih troškova.\n\nAko nemate, možemo osigurati domenu uz godišnju naknadu."
                },
                {
                  q: "Mogu li kasnije promijeniti paket?",
                  a: "Naravno. Paket možete nadograditi ili promijeniti u bilo kojem trenutku."
                },
                {
                  q: "Što je s Google oglasima?",
                  a: "U Advanced paketu Google Ads su uključeni.\n\nZa Web Shop paket Google Ads se mogu dodati kao opcija uz dodatnu mjesečnu naknadu. Budžet za oglase nije uključen."
                },
                {
                  q: "Jesu li cijene konačne?",
                  a: "Da. Nema skrivenih troškova. Sve što je uključeno u paket jasno je navedeno."
                },
                {
                  q: "Je li ovo rješenje za mene ako tek pokrećem posao?",
                  a: "Da — upravo za to je i namijenjeno.\n\nNajam weba omogućuje vam da krenete bez velikog početnog ulaganja i testirate ideju bez rizika."
                }
              ].map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaqIndex === idx}
                  onClick={() => toggleFaq(idx)}
                />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- CONTACT / FINAL CTA --- */}
      <section id="contact" className="py-24 bg-zinc-900 relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-green-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-50%] left-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">Spremni pokrenuti posao?</h2>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                Nabavite profesionalnu web stranicu bez glavobolje. Ispunite formu i krećemo odmah.
              </p>
            </div>

            {/* CONTACT FORM */}
            <div className="max-w-2xl mx-auto">
              <ContactForm />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black text-zinc-500 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 font-bold text-white text-xl">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
              <img
                src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png"
                alt="Rent a Web Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span>Rent a Web</span>
          </div>
          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Politika privatnosti</a>
            <a href="#" className="hover:text-white transition-colors">Uvjeti korištenja</a>
            <a href="#contact" className="hover:text-white transition-colors">Kontakt</a>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Rent a Web. Sva prava pridržana.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;