'use client';

import { ThemeProvider } from '@/app/components/landing/ThemeProvider';
import Navbar from '@/app/components/landing/Navbar';
import Footer from '@/app/components/landing/Footer';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Apply theme from localStorage
        const saved = localStorage.getItem('lp-theme') || 'dark';
        const el = document.querySelector('[data-landing="true"]');
        if (el) el.setAttribute('data-theme', saved);
    }, []);

    return (
        <ThemeProvider>
            <div data-landing="true" data-theme="dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--lp-bg)' }}>
                <Navbar />

                {/* Main content */}
                <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8rem 1.5rem 4rem' }}>
                    <div style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>

                        {/* Animated 404 number */}
                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                            {/* Glow blob */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--lp-accent-green) 20%, transparent) 0%, transparent 70%)',
                                filter: 'blur(40px)',
                                pointerEvents: 'none',
                            }} />
                            <div style={{
                                position: 'relative',
                                fontSize: 'clamp(8rem, 20vw, 14rem)',
                                fontWeight: 900,
                                lineHeight: 1,
                                letterSpacing: '-0.05em',
                                color: 'var(--lp-heading)',
                                opacity: 0.08,
                                userSelect: 'none',
                            }}>
                                404
                            </div>
                            {/* Overlay icon */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <div style={{
                                    width: '80px', height: '80px',
                                    borderRadius: '50%',
                                    background: 'var(--lp-surface)',
                                    border: '1px solid var(--lp-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 40px color-mix(in srgb, var(--lp-accent-green) 15%, transparent)',
                                }}>
                                    <Search size={32} style={{ color: 'var(--lp-accent-green)' }} />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                            fontWeight: 800,
                            marginBottom: '1rem',
                            color: 'var(--lp-heading)',
                            letterSpacing: '-0.02em',
                        }}>
                            Stranica nije pronađena
                        </h1>

                        {/* Description */}
                        <p style={{
                            fontSize: '1.05rem',
                            lineHeight: 1.7,
                            marginBottom: '2.5rem',
                            color: 'var(--lp-text-muted)',
                            maxWidth: '420px',
                            margin: '0 auto 2.5rem',
                        }}>
                            Ups! Stranica koju tražite ne postoji ili je premještena.
                            Provjerite URL ili se vratite na početnu.
                        </p>

                        {/* CTA buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link
                                href="/"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.85rem 2rem',
                                    borderRadius: '0.75rem',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    background: 'var(--lp-heading)',
                                    color: 'var(--lp-bg)',
                                    textDecoration: 'none',
                                    transition: 'transform 0.2s, opacity 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Home size={16} />
                                Početna stranica
                            </Link>

                            <button
                                onClick={() => window.history.back()}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.85rem 2rem',
                                    borderRadius: '0.75rem',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    background: 'transparent',
                                    color: 'var(--lp-text-secondary)',
                                    border: '1px solid var(--lp-border)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, background 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--lp-surface)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <ArrowLeft size={16} />
                                Natrag
                            </button>
                        </div>

                        {/* Quick links */}
                        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--lp-border)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--lp-text-muted)', marginBottom: '0.75rem' }}>
                                Možda tražite:
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {[
                                    { href: '/#pricing', label: 'Cijene' },
                                    { href: '/try', label: 'Isprobaj AI' },
                                    { href: '/auth/login', label: 'Prijava' },
                                    { href: '/#faq', label: 'FAQ' },
                                ].map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        style={{
                                            padding: '0.4rem 1rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            background: 'var(--lp-surface)',
                                            color: 'var(--lp-text-secondary)',
                                            border: '1px solid var(--lp-border)',
                                            textDecoration: 'none',
                                            transition: 'color 0.2s, border-color 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--lp-heading)'; e.currentTarget.style.borderColor = 'var(--lp-text-muted)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--lp-text-secondary)'; e.currentTarget.style.borderColor = 'var(--lp-border)'; }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </ThemeProvider>
    );
}
