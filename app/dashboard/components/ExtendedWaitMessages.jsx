"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Fun & informative messages shown when generation takes longer than expected
const EXTENDED_MESSAGES = [
    { text: "AI razmišlja extra duboko danas... 🧠", sub: "Kompleksniji dizajn = više vremena" },
    { text: "Kreativnost zahtijeva strpljenje! 🎨", sub: "Svaki piksel se ručno slaže (šalim se, AI to radi)" },
    { text: "Webica piše u prosjeku 3000+ linija koda 📝", sub: "To je kao pola romana — samo ljepšeg" },
    { text: "Generira se responsivni dizajn za sve uređaje 📱", sub: "Mobilni, tablet, desktop — sve u jednom" },
    { text: "AI model obrađuje tvoje slike i sadržaj 🖼️", sub: "Slike se optimiziraju za brzo učitavanje" },
    { text: "Još malo! Savršenstvo ne trpi žurbu ⏳", sub: "Kvaliteta > brzina" },
    { text: "Zabavni fact: prosječna web stranica ima 50+ sekcija CSS-a 🤓", sub: "AI ih generira sve u jednom potezu" },
    { text: "Koristi se napredni AI model za bolji rezultat 🚀", sub: "Automatski fallback na jači model" },
    { text: "AI piše mobile-first kod s animacijama ✨", sub: "Smooth scroll, fade-in, hover efekti..." },
    { text: "Fun fact: Webica AI procesira tisuće linija koda u minuti ⚡", sub: "Ali kreativnost ipak traje malo duže" },
    { text: "Skoro gotovo! AI radi završne provjere 🔍", sub: "Validacija HTML-a, pristupačnosti i brzine" },
    { text: "AI optimizira SEO meta tagove za Google 🔎", sub: "Naslov, opis i strukturirani podaci" },
    { text: "Tvoja stranica će biti brža od 90% web stranica 🏎️", sub: "Optimizirani CSS i minimalan JavaScript" },
    { text: "Generiraju se lazy-load slike i WebP format 📸", sub: "Za najbolji Core Web Vitals score" },
];

/**
 * Rotating "extended wait" message component.
 * Shows after `showAfterSeconds` and rotates every `rotateEvery` seconds.
 */
export function ExtendedWaitBanner({ seconds, showAfterSeconds = 60, rotateEvery = 8, accentColor = '#fbbf24' }) {
    const [messageIndex, setMessageIndex] = useState(0);

    // Pick a random starting index once
    const startIndex = useMemo(() => Math.floor(Math.random() * EXTENDED_MESSAGES.length), []);

    useEffect(() => {
        if (seconds < showAfterSeconds) return;
        const elapsed = seconds - showAfterSeconds;
        setMessageIndex((startIndex + Math.floor(elapsed / rotateEvery)) % EXTENDED_MESSAGES.length);
    }, [seconds, showAfterSeconds, rotateEvery, startIndex]);

    if (seconds < showAfterSeconds) return null;

    const msg = EXTENDED_MESSAGES[messageIndex];

    return (
        <div className="mx-6 mb-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={messageIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl px-4 py-3 text-center"
                    style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
                >
                    <p className="text-sm font-medium" style={{ color: accentColor }}>
                        {msg.text}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: `${accentColor}aa` }}>
                        {msg.sub}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
