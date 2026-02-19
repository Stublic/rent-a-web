'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Landing Components
import { ThemeProvider } from './components/landing/ThemeProvider';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import HowItWorksShowcase from './components/landing/HowItWorksShowcase';
import Portfolio from './components/landing/Portfolio';
import Benefits from './components/landing/Benefits';
import AIConsultant from './components/landing/AIConsultant';
import Pricing from './components/landing/Pricing';
import Testimonials from './components/landing/Testimonials';
import FAQ from './components/landing/FAQ';
import Contact from './components/landing/Contact';
import Footer from './components/landing/Footer';

// Init Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function LandingPage() {
  const handleCheckout = async (priceId) => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert('Greška pri povezivanju s naplatom. Pokušajte ponovno.');
    }
  };

  return (
    <ThemeProvider>
      <main className="min-h-screen relative overflow-hidden transition-colors duration-300" data-landing="true">
        {/* Fonts are loaded in layout.js or next/font/google, removing inline style injection for cleanliness */}

        <Navbar />

        <Hero />

        <HowItWorksShowcase />

        <Portfolio />

        <Benefits />

        <AIConsultant />

        <Pricing onCheckout={handleCheckout} />

        <Testimonials />

        <FAQ />

        <Contact />

        <Footer />
      </main>
    </ThemeProvider>
  );
}