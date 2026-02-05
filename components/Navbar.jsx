'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  ChevronDown, 
  ArrowRight, 
  Monitor, 
  ShoppingBag, 
  Rocket, 
  CreditCard, 
  Menu, 
  X, 
  Star,
  Zap,
  Layout,
  ExternalLink,
  Quote,
  Sparkles,
  Loader2
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
        observer.disconnect();
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options]);

  return [ref, isVisible];
};

// Wrapper for animated sections
const FadeIn = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });
  
  return (
    <div
      ref={ref}
      className={`transform-gpu will-change-transform transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
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
        
        <div className="hidden md:flex items-center gap-8 font-medium text-zinc-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">Kako radi</a>
          <a href="#examples" className="hover:text-white transition-colors">Primjeri</a>
          <a href="#pricing" className="hover:text-white transition-colors">Cijene</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Iskustva</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <a href="#ai-consultant" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"><Sparkles size={14}/> AI Analiza</a>
          <a href="#contact" className="px-5 py-2.5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95">
            Započni
          </a>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 p-6 flex flex-col gap-4 shadow-xl">
          <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Kako radi</a>
          <a href="#examples" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Primjeri</a>
          <a href="#ai-consultant" onClick={() => setIsOpen(false)} className="text-lg font-medium text-purple-400 flex items-center gap-2"><Sparkles size={16}/> AI Analiza</a>
          <a href="#pricing" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Cijene</a>
          <a href="#testimonials" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">Iskustva</a>
          <a href="#faq" onClick={() => setIsOpen(false)} className="text-lg font-medium text-zinc-300">FAQ</a>
          <a href="#contact" onClick={() => setIsOpen(false)} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-center block">Započni</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
