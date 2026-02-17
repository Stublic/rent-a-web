'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300">
            {/* Header */}
            <div className="bg-black border-b border-zinc-800">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
                            <img
                                src="https://framerusercontent.com/images/fbLxHSQG15wQ5GLsHXeLv64Nvlo.png"
                                alt="Rent a Web Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="font-bold text-white text-lg">Rent a Web</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold text-white mb-2">Politika Privatnosti</h1>
                <p className="text-zinc-500 mb-12">Posljednja izmjena: 13. veljače 2026.</p>

                <div className="space-y-10 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Voditelj Obrade</h2>
                        <p>
                            Voditelj obrade osobnih podataka je Webica ("mi", "nas"), sa sjedištem u
                            Republici Hrvatskoj. Za sva pitanja o zaštiti podataka obratite nam se na:{' '}
                            <a href="mailto:jurica@webica.hr" className="text-green-500 hover:text-green-400">
                                jurica@webica.hr
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Podatke Koje Prikupljamo</h2>
                        <p>Prikupljamo sljedeće osobne podatke:</p>

                        <div className="mt-4 space-y-4">
                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                                <h3 className="text-white font-medium mb-2">Podaci o računu</h3>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 text-sm">
                                    <li>Ime i prezime</li>
                                    <li>Email adresa</li>
                                    <li>Profilna fotografija (ako koristite Google prijavu)</li>
                                </ul>
                            </div>

                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                                <h3 className="text-white font-medium mb-2">Podaci o plaćanju</h3>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 text-sm">
                                    <li>Stripe Customer ID (ne pohranjujemo brojeve kartica!)</li>
                                    <li>Povijest transakcija i računa</li>
                                    <li>Adresa za račun (ako je unesena putem Stripe-a)</li>
                                </ul>
                            </div>

                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                                <h3 className="text-white font-medium mb-2">Podaci o korištenju</h3>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 text-sm">
                                    <li>Generirani sadržaj web stranica</li>
                                    <li>AI edit povijest</li>
                                    <li>IP adresa i User Agent (za sigurnosne svrhe)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Svrha i Pravna Osnova Obrade</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm mt-4 border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-700 text-left text-zinc-400">
                                        <th className="py-3 pr-4">Svrha</th>
                                        <th className="py-3 pr-4">Pravna osnova</th>
                                    </tr>
                                </thead>
                                <tbody className="text-zinc-300">
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-3 pr-4">Pružanje usluge (generiranje stranica)</td>
                                        <td className="py-3 pr-4">Izvršenje ugovora (čl. 6(1)(b) GDPR)</td>
                                    </tr>
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-3 pr-4">Naplata i izdavanje računa</td>
                                        <td className="py-3 pr-4">Zakonska obveza (čl. 6(1)(c) GDPR)</td>
                                    </tr>
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-3 pr-4">Slanje email obavijesti o usluzi</td>
                                        <td className="py-3 pr-4">Legitimni interes (čl. 6(1)(f) GDPR)</td>
                                    </tr>
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-3 pr-4">Poboljšanje usluge (analitika)</td>
                                        <td className="py-3 pr-4">Privola (čl. 6(1)(a) GDPR)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Primatelji i Obrada Podataka</h2>
                        <p>Vaši podaci se dijele sa sljedećim trećim stranama:</p>
                        <ul className="list-disc list-inside mt-3 space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Stripe, Inc.</strong> — obrada plaćanja (SAD, EU Standard Contractual Clauses)</li>
                            <li><strong className="text-zinc-200">Supabase, Inc.</strong> — baza podataka (EU regija: Frankfurt)</li>
                            <li><strong className="text-zinc-200">Vercel, Inc.</strong> — hosting i CDN (globalno, Edge Network)</li>
                            <li><strong className="text-zinc-200">Google LLC</strong> — AI (Gemini API) i autentikacija (SAD, SCC)</li>
                            <li><strong className="text-zinc-200">Solo.com.hr</strong> — izdavanje fiskalnih računa (Hrvatska)</li>
                        </ul>
                        <p className="mt-3 text-sm text-zinc-500">
                            Napomena: Svi navedeni procesori podataka imaju vlastite politike privatnosti i
                            odgovarajuće mehanizme za zaštitu podataka.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Vaša Prava (GDPR)</h2>
                        <p>Kao subjekt podataka u EU/EEA, imate sljedeća prava:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {[
                                ['Pristup', 'Pravo zatražiti kopiju svojih podataka'],
                                ['Ispravak', 'Pravo ispraviti netočne podatke'],
                                ['Brisanje', 'Pravo zatražiti brisanje podataka ("pravo na zaborav")'],
                                ['Ograničenje', 'Pravo ograničiti obradu podataka'],
                                ['Prenosivost', 'Pravo dobiti podatke u strojno čitljivom formatu'],
                                ['Prigovor', 'Pravo uložiti prigovor na obradu podataka'],
                            ].map(([title, desc]) => (
                                <div key={title} className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                                    <h4 className="text-green-500 font-medium text-sm">{title}</h4>
                                    <p className="text-xs text-zinc-400 mt-1">{desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-sm">
                            Za ostvarivanje prava obratite se na{' '}
                            <a href="mailto:jurica@webica.hr" className="text-green-500 hover:text-green-400">
                                jurica@webica.hr
                            </a>.
                            Na zahtjev ćemo odgovoriti u roku od 30 dana.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Kolačići (Cookies)</h2>
                        <p>Koristimo sljedeće kolačiće:</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm mt-4 border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-700 text-left text-zinc-400">
                                        <th className="py-3 pr-4">Kolačić</th>
                                        <th className="py-3 pr-4">Svrha</th>
                                        <th className="py-3 pr-4">Trajanje</th>
                                    </tr>
                                </thead>
                                <tbody className="text-zinc-300">
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-3 pr-4 font-mono text-xs">better-auth.session</td>
                                        <td className="py-3 pr-4">Autentikacija korisnika</td>
                                        <td className="py-3 pr-4">7 dana</td>
                                    </tr>
                                    <tr className="border-b border-zinc-800">
                                        <td className="py-3 pr-4 font-mono text-xs">cookie-consent</td>
                                        <td className="py-3 pr-4">Pohrana pristanka na kolačiće</td>
                                        <td className="py-3 pr-4">1 godina</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-sm text-zinc-500">
                            Bitan kolačić za autentikaciju je neophodan za funkcioniranje usluge i
                            ne zahtijeva privolu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Razdoblje Čuvanja Podataka</h2>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Podaci o računu:</strong> čuvaju se dok je račun aktivan + 30 dana nakon brisanja</li>
                            <li><strong className="text-zinc-200">Računi i transakcije:</strong> 11 godina (zakonska obveza, Opći porezni zakon)</li>
                            <li><strong className="text-zinc-200">Generirani sadržaj:</strong> briše se s brisanjem projekta</li>
                            <li><strong className="text-zinc-200">Logovi pristupa:</strong> 90 dana</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. Sigurnost Podataka</h2>
                        <p>
                            Primjenjujemo odgovarajuće tehničke i organizacijske mjere za zaštitu
                            vaših podataka, uključujući:
                        </p>
                        <ul className="list-disc list-inside mt-3 space-y-2 text-zinc-400">
                            <li>SSL/TLS enkripcija za sve podatke u prijenosu</li>
                            <li>Enkripcija podataka u mirovanju (Supabase)</li>
                            <li>Kartice se ne pohranjuju na našim serverima (Stripe PCI DSS)</li>
                            <li>Redovite sigurnosne provjere i ažuriranja</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">9. Pravo na Pritužbu</h2>
                        <p>
                            Ako smatrate da obrađujemo vaše podatke nezakonito, imate pravo
                            uložiti pritužbu nadležnom nadzornom tijelu:{' '}
                            <a
                                href="https://azop.hr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-400"
                            >
                                Agencija za zaštitu osobnih podataka (AZOP)
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">10. Kontakt</h2>
                        <p>
                            Za sva pitanja vezana uz zaštitu podataka:{' '}
                            <a href="mailto:jurica@webica.hr" className="text-green-500 hover:text-green-400">
                                jurica@webica.hr
                            </a>
                        </p>
                    </section>
                </div>

                {/* Back Link */}
                <div className="mt-16 pt-8 border-t border-zinc-800">
                    <Link href="/" className="text-green-500 hover:text-green-400 transition-colors text-sm">
                        ← Povratak na naslovnu
                    </Link>
                </div>
            </div>
        </div>
    );
}
