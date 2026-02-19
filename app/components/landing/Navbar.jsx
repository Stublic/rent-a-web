'use client';
import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeProvider';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#how-it-works', label: 'Kako radi' },
    { href: '#examples', label: 'Primjeri' },
    { href: '#pricing', label: 'Cijene' },
    { href: '#testimonials', label: 'Iskustva' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <nav
      className="fixed w-full z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'var(--lp-nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--lp-border)' : '1px solid transparent',
        padding: scrolled ? '12px 0' : '20px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img
              src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png"
              alt="Rent a Web Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--lp-heading)' }}>
            Rent a Web
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--lp-surface)]"
              style={{ color: 'var(--lp-text-secondary)' }}
              onMouseEnter={e => e.target.style.color = 'var(--lp-heading)'}
              onMouseLeave={e => e.target.style.color = 'var(--lp-text-secondary)'}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#ai-consultant"
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            style={{ color: '#a78bfa' }}
          >
            <Sparkles size={13} /> AI Analiza
          </a>

          <div className="w-px h-5 mx-2" style={{ background: 'var(--lp-border)' }} />

          <ThemeToggle />

          <a
            href="#contact"
            className="ml-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'var(--lp-heading)',
              color: 'var(--lp-bg)',
            }}
          >
            Započni →
          </a>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button onClick={() => setIsOpen(!isOpen)} style={{ color: 'var(--lp-heading)' }}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="md:hidden absolute top-full left-0 w-full p-6 flex flex-col gap-3 shadow-xl border-b"
          style={{
            background: 'var(--lp-bg)',
            borderColor: 'var(--lp-border)',
          }}
        >
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium py-2"
              style={{ color: 'var(--lp-text-secondary)' }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#ai-consultant"
            onClick={() => setIsOpen(false)}
            className="text-lg font-medium py-2 flex items-center gap-2"
            style={{ color: '#a78bfa' }}
          >
            <Sparkles size={16} /> AI Analiza
          </a>
          <a
            href="#contact"
            onClick={() => setIsOpen(false)}
            className="w-full py-3 rounded-xl font-bold text-center block mt-2"
            style={{
              background: 'var(--lp-heading)',
              color: 'var(--lp-bg)',
            }}
          >
            Započni
          </a>
        </div>
      )}
    </nav>
  );
}
