"use client";

import { useSession } from "better-auth/react"; // Assuming we use better-auth client hook
import { authClient } from "@/lib/auth-client";
import { Check, Loader2, Sparkles, Zap, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

const plans = [
  {
    name: "Starter",
    subtitle: "Prodajna landing stranica",
    price: "39",
    features: [
      "AI generirana one-page (landing) stranica",
      "Kontakt forma i napredni SEO",
      "500 AI tokena za uređivanje",
      "Hosting na poddomeni",
      "Custom domena",
      "SSL & sigurnosne nadogradnje",
      "Prodajna struktura stranice (conversion flow)",
      "Stranica gotova u 45 sekundi, neograničen broj revizija",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
    description: "Idealno za male obrte i lokalne usluge koji žele brzo biti online.",
    targetAudience: "Poduzetnici početnici, obrti",
    color: "bg-zinc-800",
    textColor: "text-white",
    buttonColor: "bg-white text-black hover:bg-zinc-200",
    available: true,
  },
  {
    name: "Advanced",
    subtitle: "Ozbiljan biznis",
    price: "99",
    features: [
      "Sve iz Starter paketa",
      "Kompleksna struktura (Naslovnica, Usluge, O nama, Kontakt)",
      "CMS za Blog (objave + kategorije + tagovi)",
      "10 AI članaka mjesečno (SEO friendly)",
      "Custom domena",
      "Napredne animacije & UX efekti",
      "Napredna AI SEO optimizacija",
      "Generiranje slika za web (Nano Banana)",
      "Pravni aspekti (GDPR, Uvjeti korištenja)",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED,
    description: "Za tvrtke koje žele više: ozbiljniji web i SEO potencijal.",
    targetAudience: "Mali biznisi, uslužne djelatnosti",
    recommended: true,
    color: "bg-zinc-900 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    textColor: "text-green-500",
    buttonColor: "bg-green-500 text-white hover:bg-green-400",
    available: true,
  },
  {
    name: "Web Shop Start",
    subtitle: "Prodaja 0–24",
    price: "199",
    features: [
      "Katalog + košarica + checkout",
      "Upravljanje proizvodima i narudžbama",
      "Sve metode plaćanja",
      "AI SEO optimizacija i opis proizvoda",
      "Hosting + CMS + SSL",
      "Generiranje slika za web (Nano Banana)",
      "Integracija sa SOLO servisom (fiskalizacija)",
      "Pravni aspekti (GDPR, Uvjeti korištenja)",
    ],
    priceId: null,
    description: "Online prodaja bez kompliciranog sustava plaćanja.",
    targetAudience: "Web shopovi, online prodaja",
    color: "bg-zinc-800 opacity-60",
    textColor: "text-purple-400",
    buttonColor: "bg-zinc-700 text-zinc-400 cursor-not-allowed",
    available: false,
    comingSoon: true,
  }
];

export default function NewProjectPage() {
    const [loadingPriceId, setLoadingPriceId] = useState(null);
    const router = useRouter();

    const handleSubscribe = async (priceId) => {
        setLoadingPriceId(priceId);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            });
            const { url } = await response.json();
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Došlo je do greške prilikom kupnje.');
        } finally {
            setLoadingPriceId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white flex items-center gap-2 mb-8 transition-colors w-fit">
                <ArrowLeft size={20} /> Povratak na Dashboard
            </Link>

            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl font-bold mb-4">Dodaj novi projekt</h1>
                <p className="text-zinc-400">Odaberite paket za vašu novu web stranicu. Svi paketi uključuju hosting, domenu i održavanje.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan) => (
                    <div key={plan.name} className={`relative p-8 rounded-3xl border ${plan.recommended ? 'border-green-500 scale-105 z-10' : plan.comingSoon ? 'border-zinc-800 bg-zinc-900/30 opacity-70' : 'border-zinc-800 bg-zinc-900/50'} flex flex-col`}>
                        {plan.recommended && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Najpopularnije
                            </div>
                        )}
                        {plan.comingSoon && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Uskoro
                            </div>
                        )}
                        <h3 className={`text-xl font-bold mb-0.5 ${plan.textColor}`}>{plan.name}</h3>
                        {plan.subtitle && <p className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">{plan.subtitle}</p>}
                        <p className="text-sm mb-4 text-zinc-400 min-h-[40px]">{plan.description}</p>
                        
                        <div className="flex items-baseline gap-2 mb-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold">{plan.price}€</span>
                                <span className="text-sm text-zinc-500">/ mj</span>
                            </div>
                        </div>

                        {plan.targetAudience && (
                            <div className="text-xs text-zinc-500 italic border-t border-zinc-800/50 pt-2 mt-2 mb-6">
                                Za: {plan.targetAudience}
                            </div>
                        )}

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                                    <Check size={16} className="text-green-500 mt-0.5 shrink-0" /> 
                                    <span className="leading-snug">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => plan.available && handleSubscribe(plan.priceId)}
                            disabled={!plan.available || loadingPriceId === plan.priceId}
                            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.buttonColor} disabled:opacity-50`}
                        >
                            {loadingPriceId === plan.priceId ? <Loader2 className="animate-spin" /> : "Odaberi paket"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
