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
    price: "249",
    features: ["Custom Dizajn", "Hosting Uključen", "Domena (.hr i .com)", "SSL Certifikat", "Osnovni SEO", "Mjesečno Održavanje"],
    priceId: "price_1Ql8xQLbfUNXa5Hz6ZGLKyJl", // Replace with your actual Stripe Price ID
    color: "bg-zinc-800",
    textColor: "text-white",
    buttonColor: "bg-white text-black hover:bg-zinc-200"
  },
  {
    name: "Advanced",
    price: "349",
    features: ["Sve u Starteru", "Napredni SEO", "Blog Sekcija", "Google Analytics", "Prioritetna Podrška", "Brže Učitavanje"],
    priceId: "price_1QlWXZLbfUNXa5Hz84Q1Vmn2", // Replace with your actual Stripe Price ID
    recommended: true,
    color: "bg-zinc-900 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    textColor: "text-green-500",
    buttonColor: "bg-green-500 text-white hover:bg-green-400"
  },
  {
    name: "Web Shop Start",
    price: "499",
    features: ["Sve u Advancedu", "WooCommerce", "Do 50 Proizvoda", "Integracija Plaćanja", "E-commerce SEO", "Obuka"],
    priceId: "price_1QlWYlLbfUNXa5HzJ0Q1Vmn3", // Replace with your actual Stripe Price ID
    color: "bg-zinc-800",
    textColor: "text-white",
    buttonColor: "bg-white text-black hover:bg-zinc-200"
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
                    <div key={plan.name} className={`relative p-8 rounded-3xl border ${plan.recommended ? 'border-green-500 scale-105 z-10' : 'border-zinc-800 bg-zinc-900/50'} flex flex-col`}>
                        {plan.recommended && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Najpopularnije
                            </div>
                        )}
                        <h3 className={`text-xl font-bold mb-2 ${plan.textColor}`}>{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-extrabold">{plan.price}€</span>
                            <span className="text-zinc-500 text-sm">/ jednokratno + mj.</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                                    <Check size={16} className="text-green-500" /> {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleSubscribe(plan.priceId)}
                            disabled={loadingPriceId === plan.priceId}
                            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.buttonColor}`}
                        >
                            {loadingPriceId === plan.priceId ? <Loader2 className="animate-spin" /> : "Odaberi paket"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
