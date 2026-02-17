'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
                <h1 className="text-4xl font-bold text-white mb-2">Uvjeti Korištenja</h1>
                <p className="text-zinc-500 mb-12">Posljednja izmjena: 13. veljače 2026.</p>

                <div className="space-y-10 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">1. Opće Odredbe</h2>
                        <p>
                            Ovi Uvjeti korištenja ("Uvjeti") reguliraju korištenje usluge Rent a Web ("Usluga"),
                            koja je u vlasništvu i pod upravljanjem Webica ("Pružatelj usluge", "mi", "nas").
                            Korištenjem Usluge prihvaćate ove Uvjete u cijelosti.
                        </p>
                        <p className="mt-3">
                            Usluga omogućuje korisnicima ("Korisnik", "vi") generiranje, uređivanje i
                            hostanje profesionalnih web stranica putem AI tehnologije.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">2. Opis Usluge</h2>
                        <p>Rent a Web nudi sljedeće usluge:</p>
                        <ul className="list-disc list-inside mt-3 space-y-2 text-zinc-400">
                            <li>AI generiranje web stranica na temelju podataka koje korisnik unosi</li>
                            <li>AIEditor za naknadno uređivanje generiranih stranica (sustav žetona)</li>
                            <li>Hosting generirane web stranice na našoj infrastrukturi</li>
                            <li>Mogućnost povezivanja vlastite domene</li>
                            <li>Generiranje i slanje fiskaliziranih računa putem Solo API-ja</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">3. Pretplate i Plaćanje</h2>
                        <p>
                            Usluga se naplaćuje na mjesečnoj bazi putem Stripe Payment Gateway-a.
                            Cijene su izražene u EUR i uključuju sve pristojbe.
                        </p>
                        <ul className="list-disc list-inside mt-3 space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-200">Starter:</strong> 39 €/mj — jednostavna landing stranica</li>
                            <li><strong className="text-zinc-200">Advanced:</strong> 89 €/mj — višestraničje + Google Ads</li>
                            <li><strong className="text-zinc-200">Paket za poduzetnike:</strong> 399 €/mj — 5 profesionalnih web stranica</li>
                        </ul>
                        <p className="mt-3">
                            Pretplata se automatski obnavlja svakog mjeseca. Korisnik može otkazati pretplatu
                            u bilo kojem trenutku putem Dashboarda, a pristup uslugama ostaje aktivan do kraja
                            tekućeg obračunskog razdoblja.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">4. Žetoni (Tokeni) za AI Editor</h2>
                        <p>
                            Svaki projekt uključuje početnih 500 žetona za AI uređivanje. Žetoni se troše
                            prilikom svake AI izmjene. Dodatni žetoni mogu se kupiti jednokratno putem
                            Stripe-a. Kupljeni žetoni nemaju rok trajanja i vezani su za specifični projekt.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">5. Intelektualno Vlasništvo</h2>
                        <p>
                            <strong className="text-zinc-200">Sadržaj korisnika:</strong> Sav tekstualni i slikovni sadržaj koji korisnik
                            unosi ostaje u vlasništvu korisnika.
                        </p>
                        <p className="mt-3">
                            <strong className="text-zinc-200">Generirani kod:</strong> HTML, CSS i JavaScript kod koji AI generira
                            na temelju korisnikovih podataka daje se korisniku kao licencirani sadržaj za
                            korištenje isključivo unutar Rent a Web platforme. Korisnik nema pravo na
                            izvoz izvornog koda bez posebnog dogovora.
                        </p>
                        <p className="mt-3">
                            <strong className="text-zinc-200">Platforma:</strong> Sav softver, dizajn i logika platforme Rent a Web
                            ostaju u isključivom vlasništvu Pružatelja usluge.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">6. Dostupnost Usluge (SLA)</h2>
                        <p>
                            Nastojimo osigurati dostupnost usluge 24/7, ali ne jamčimo 100% uptime.
                            Planirani zastoji bit će najavljeni unaprijed putem emaila. Pružatelj usluge
                            ne snosi odgovornost za gubitak prihoda ili štetu uzrokovanu nedostupnošću usluge.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">7. Otkazivanje i Povrat Sredstava</h2>
                        <p>
                            Korisnik može otkazati pretplatu u bilo kojem trenutku. Nakon otkazivanja,
                            pristup projektu ostaje aktivan do kraja plaćenog razdoblja.
                        </p>
                        <p className="mt-3">
                            Povrat sredstava moguć je samo unutar 14 dana od prve kupnje, sukladno
                            Zakonu o zaštiti potrošača, osim ako je korisnik već generirao web stranicu
                            (čime se smatra da je usluga isporučena).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">8. Ograničenje Odgovornosti</h2>
                        <p>
                            AI-generirani sadržaj pruža se "kakav jest" (as-is). Pružatelj usluge ne
                            garantira točnost, prikladnost ili pravnu usklađenost generiranog sadržaja.
                            Korisnik je odgovoran za provjeru i prilagodbu sadržaja na svojoj web stranici.
                        </p>
                        <p className="mt-3">
                            Maksimalna odgovornost Pružatelja usluge ograničena je na iznos koji je
                            korisnik platio u posljednjih 12 mjeseci.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">9. Zabranjena Uporaba</h2>
                        <p>Korisnik se obvezuje da neće koristiti Uslugu za:</p>
                        <ul className="list-disc list-inside mt-3 space-y-2 text-zinc-400">
                            <li>Distribuciju ilegalnog, uvredljivog ili štetnog sadržaja</li>
                            <li>Kršenje prava intelektualnog vlasništva trećih strana</li>
                            <li>Phishing, spam ili malware distribuciju</li>
                            <li>Automatsku manipulaciju platformom (scraping, botovi)</li>
                        </ul>
                        <p className="mt-3">
                            U slučaju kršenja, Pružatelj zadržava pravo da trenutno obustavi ili ukine korisnički račun.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">10. Primjenjivo Pravo</h2>
                        <p>
                            Na ove Uvjete primjenjuje se pravo Republike Hrvatske. Za sve sporove
                            nadležan je sud u Zagrebu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4">11. Kontakt</h2>
                        <p>
                            Za sva pitanja vezana uz ove Uvjete, obratite nam se na:{' '}
                            <a href="mailto:jurica@webica.hr" className="text-green-500 hover:text-green-400 transition-colors">
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
