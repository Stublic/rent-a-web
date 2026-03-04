# SUPPORT KNOWLEDGE BASE — Rent a webica

> **Verzija dokumenta:** 1.0  
> **Posljednje ažuriranje:** 2026-03-03  
> **Autor analize:** AI Systems Analyst (iz kompletnog codebase audita)

---

## Sadržaj

1. [System Overview](#1-system-overview)
2. [Subscription & Token Logic](#2-subscription--token-logic)
3. [User Workflows & Edge Cases](#3-user-workflows--edge-cases)
4. [Troubleshooting Guide](#4-troubleshooting-guide)
5. [STRICT AI SUPPORT RULES](#5-strict-ai-support-rules)

---

## 1. System Overview

### 1.1 Što je Rent a webica?

**Rent a webica** je SaaS platforma za najam profesionalnih web stranica po modelu mjesečne pretplate. Umjesto jednokratnog troška od 1000€+, korisnici plaćaju mjesečnu pretplatu (od 39€/mj) koja uključuje AI-generiran dizajn, hosting, domenu, SSL i održavanje.

### 1.2 Tehnološki Stack

| Komponenta             | Tehnologija                                       |
|------------------------|---------------------------------------------------|
| Framework              | Next.js 14 (App Router)                           |
| Styling                | Tailwind CSS                                      |
| Baza podataka          | PostgreSQL (Prisma ORM)                           |
| Autentikacija          | Better Auth (email + social providers)            |
| Plaćanja               | Stripe (subscriptions + one-time token purchases) |
| AI Motor               | Google Gemini (gemini-3-pro, gemini-3-flash)      |
| Hosting                | Vercel (multi-tenant via subdomain routing)       |
| Domene                 | Vercel Domains API                                |
| Fiskalizacija          | SOLO API (HR fiskalni račun)                      |
| Email                  | Nodemailer (SMTP)                                 |
| Slike                  | Vercel Blob, Google Gemini Image Generation       |

### 1.3 Baza podataka — Ključni modeli

| Model               | Svrha                                                                  |
|----------------------|------------------------------------------------------------------------|
| `User`               | Korisnik platforme, sadrži subscription status, Stripe ID, token balans |
| `Project`            | Pojedinačna web stranica korisnika, sadrži generiran HTML i meta podatke |
| `StripeSubscription` | Cache Stripe pretplate za brze lookupe                                 |
| `Invoice`            | Fiskalni računi (pretplata i kupnja tokena)                            |
| `BlogPost`           | Blog članci unutar projekta                                            |
| `BlogCategory`       | Kategorije bloga                                                       |
| `ContactSubmission`  | Prijave kontakt formi s korisničkih stranica                           |
| `Media`              | Uploadane slike i datoteke                                             |
| `Feedback`           | Korisničke povratne informacije                                        |
| `GeminiUsage`        | Praćenje potrošnje Gemini API poziva (tokeni + cijena)                 |
| `DesignReference`    | Admin referentne slike dizajna za AI                                   |
| `SystemConfig`       | Konfiguracija sustava (npr. aktivni AI model)                          |

### 1.4 Multi-tenant arhitektura

Sustav koristi **subdomensko rutiranje** putem Next.js middleware-a:

- **Glavna aplikacija**: `rent.webica.hr` → dashboard, admin, API
- **Korisničke stranice**: `{subdomena}.webica.hr` → rewrite na `/site/{subdomena}`
- **Custom domene**: npr. `mojadomela.hr` → također rewrite na `/site/{domena}`

Middleware automatski prepoznaje je li request za glavni app ili za tenant web stranicu.

---

## 2. Subscription & Token Logic

### 2.1 Paketi i cijene

| Paket           | Cijena  | Opis                                            | Status      |
|-----------------|---------|--------------------------------------------------|-------------|
| **Starter**     | 39€/mj  | AI generirana one-page (landing) stranica        | ✅ Dostupno |
| **Advanced**    | 99€/mj  | Kompleksna multi-page stranica (Nasl., Usluge, O nama, Kontakt) | ✅ Dostupno |
| **Web Shop Start** | 199€/mj | Katalog + košarica + checkout                 | 🔜 Coming Soon |

#### Starter paket uključuje:
- AI generirana one-page (landing) stranica
- Kontakt forma i napredni SEO
- 500 AI tokena za uređivanje (jednokratni bonus pri aktivaciji)
- Hosting na poddomeni (`{slug}.webica.hr`)
- Custom domena (opcija)
- SSL & sigurnosne nadogradnje
- Prodajna struktura stranice (conversion flow)
- Stranica gotova u ~45 sekundi

#### Advanced paket uključuje:
- Sve iz Starter paketa
- Kompleksna struktura (više podstranica)
- CMS za Blog (objave + kategorije + tagovi)
- **20 AI članaka mjesečno** (SEO friendly) — mjesečni limit resetira se automatski
- Custom domena
- Napredne animacije & UX efekti
- Napredna AI SEO optimizacija
- AI generiranje slika za web
- Pravni aspekti (GDPR, Uvjeti korištenja)

### 2.2 Token sustav

Tokeni su **account-level** — dijele se između svih projekata jednog korisnika.

| Parametar                   | Vrijednost                   |
|-----------------------------|------------------------------|
| Početni bonus (nova pretplata) | **500 tokena** (jednokratno) |
| Cijena AI edita              | **50 tokena** po izmjeni     |
| Promjena stila               | **500 tokena**               |
| Reset projekta (Starter)     | **500 tokena**               |
| Reset projekta (Advanced)    | **1000 tokena**              |

#### Kupnja tokena

| Paket           | Tokeni | Cijena | Opis              | Ušteda |
|-----------------|--------|--------|--------------------|--------|
| Basic           | 500    | 5€     | ~10 AI izmjena     | —      |
| **Popular** ⭐  | 1.500  | 12€    | ~30 AI izmjena     | 20%    |
| Pro             | 5.000  | 35€    | ~100 AI izmjena    | 30%    |

**Kupnja tokena** ide putem Stripe one-time payment. Webhook `stripe-tokens` automatski:
1. Dodaje tokene na korisnikov račun (`User.editorTokens`)
2. Generira SOLO fiskalni račun
3. Sprema Invoice u bazu
4. Šalje potvrdni email s računom

### 2.3 Stripe Webhooks — Što se događa automatski

#### Webhook: `checkout.session.completed`

**Za pretplate** (ima `subscriptionId`):
1. Dohvaća Stripe subscription → mapira `priceId` u plan name
2. Traži korisnika po `stripeCustomerId` ili `email`
3. **Nova pretplata**: kreira novi `Project` u statusu `DRAFT`
4. **Obnova (renewal)**: reactivira postojeći projekt (briše `cancelledAt`, resetira `deletionReminders`)
5. Ažurira korisnikove podatke (`subscriptionStatus`, `stripeCustomerId`, `planName`)
6. Dodjeljuje **500 tokena** (samo za nove pretplate, ne za obnove!)
7. Kreira **SOLO fiskalni račun** via `api.solo.com.hr/racun`
8. Sprema `Invoice` u bazu
9. Šalje **potvrdni email** s PDF računom u privitku

**Za token purchase** (nema `subscriptionId`):
- Preskače — obrađuje ga zasebni webhook `stripe-tokens`

#### Webhook: `customer.subscription.deleted`
- Postavlja `stripeSubscriptionId = null` na projektu
- Postavlja `cancelledAt = NOW()`

#### Webhook: `customer.subscription.updated`
- Ako je status `canceled` ili `cancel_at_period_end` → isti tretman kao `deleted`

### 2.4 Otkazivanje i 90-dnevni Grace Period

Kada korisnik otkaže:

1. **API `/api/cancel-subscription`** poziva `stripe.subscriptions.cancel()` (odmah, ne na kraju perioda)
2. Na projektu se postavlja `cancelledAt = NOW()`, `stripeSubscriptionId = null`
3. **Web stranica ostaje online** (subdomena i dalje radi) ali korisnik gubi aktivnu pretplatu

#### Cron Job: Deletion Reminders (`/api/cron/deletion-reminders`)

Pokreće se periodično i provjerava sve projekte s `cancelledAt != null`:

| Dan nakon otkazivanja | Oznaka    | Poruka korisniku        | Urgency  |
|------------------------|-----------|--------------------------|----------|
| 30                     | 2 mjeseca | Email podsjetnik         | low      |
| 60                     | 1 mjesec  | Email podsjetnik         | medium   |
| 83                     | 7 dana    | Email upozorenje         | high     |
| 87                     | 3 dana    | Email upozorenje         | critical |
| 89                     | 24 sata   | Posljednje upozorenje    | critical |
| **90**                 | —         | **TRAJNO BRISANJE**      | —        |

**Pri brisanju** (dan 90+): briše BlogPost, BlogCategory, Media, Invoice, Project → šalje finalni email o brisanju.

Napomena: `deletionReminders` polje u DB-u prati koje su poruke već poslane (comma-separated, npr. `"30,60,83"`).

### 2.5 Obnova pretplate (Renewal)

Endpoint: `/api/renew-subscription`

1. Dohvaća otkazani projekt
2. Mapira `planName` natrag u Stripe `priceId`
3. Kreira novi Stripe checkout session s `metadata.renewProjectId`
4. Webhook obradi checkout → reactivira isti projekt (ne kreira novi)

### 2.6 Email Drip Kampanja (`/api/cron/email-drip`)

Automatski emailovi za **nove korisnike** koji su se pretplatili:

| Dan | Naslov                                           | Cilj                        |
|-----|---------------------------------------------------|-----------------------------|
| 3   | Kako izvući maksimum iz AI editora?               | Educacija o editoru         |
| 7   | Vaša web stranica čeka — trebate li pomoć?        | Re-engagement               |
| 14  | Nadogradite iskustvo — posebna ponuda             | Upsell (Starter → Advanced) |

Drip se prati putem `User.lastDripEmailSent` (0, 3, 7, 14).

---

## 3. User Workflows & Edge Cases

### 3.1 Kompletni User Journey

```
Landing Page (/try)
    ↓ Korisnik unosi ime biznisa + industriju + opis
    ↓ Bira vizualni stil (20 opcija)
    ↓ AI generira preview (besplatno, bez registracije)
    ↓
PricingOverlay → odabir paketa → Stripe Checkout
    ↓ (ako nije prijavljen → /auth/login → redirect natrag)
    ↓
Stripe Webhook → kreira Project u DRAFT statusu
    ↓ Trial podaci (businessName, description) se prenose u contentData
    ↓ 500 tokena dodijeljeno
    ↓
Dashboard (/dashboard)
    ↓ Korisnik vidi novi projekt
    ↓
Content Form (/dashboard/projects/[id]/content)
    ↓ Korisnik ispunjava sve detalje (kontakt, usluge, FAQs, galerija...)
    ↓ Klik "Generiraj" → AI generira HTML
    ↓
Editor (/dashboard/projects/[id]/editor)
    ↓ AI Editor — korisnik piše zahtjeve za izmjene
    ↓ Svaka izmjena = 50 tokena
    ↓ Undo/Redo per-page
    ↓
Publish (/dashboard — "Objavi")
    ↓ Generira subdomain → registrira na Vercel API
    ↓ Status: PUBLISHED
    ↓ Opcija: custom domena
    ↓
Live Site → {subdomain}.webica.hr ili custom-domain.hr
```

### 3.2 Generiranje Stranica — Starter vs. Advanced

#### Starter Plan (`content-generator.ts`)
- **One-page** landing stranica
- AI generira kompletan HTML dokument (`<!DOCTYPE html>` do `</html>`)
- Sadrži sve sekcije: Hero, Features, Services, Testimonials, FAQ, Gallery, Pricing, Contact, Footer
- Kontakt forma automatski injektirana (`injectContactFormScript`)
- Sprema se u `Project.generatedHtml`

#### Advanced Plan (`advanced-generator.ts`)
- Samo **homepage** se generira odmah
- Podstranice (Usluge, O nama, Kontakt) generiraju se **on-demand** putem `generate-subpage.ts`
- HTML se sprema u `Project.generatedHtml` (homepage) + `Project.reactFiles` (podstranice — JSON: `{ "usluge": "<!DOCTYPE...>", "o-nama": "..." }`)
- Koristi **Industry Blueprints** — idealna struktura sekcija za svaku industriju (restoran, salon, fotograf, itd.)
- Koristi **Section Catalog** — Tailwind layout obrasci (HeroSplit, BentoGrid, PricingCards, itd.)

#### Subpage Generation (`generate-subpage.ts`)
- Preddefinirane podstranice: `usluge` (Services), `o-nama` (About), `kontakt` (Contact)
- **Custom subpages**: korisnik može kreirati vlastite s odabranim sekcijama
- Subpage dizajn koristi homepage kao **design reference** (boje, fontovi, animacije)
- `deleteSubpageAction` — brisanje podstranice

### 3.3 Content Update Flow (`update-content.ts`)

**Dvoslojna logika** za ažuriranje sadržaja putem Content Form-e:

**Tier 1 — Direct HTML Replacements** (bez AI-a, instant):
- Zamjena teksta, kontakt info (email, telefon, adresa)
- Zamjena boja (hex vrijednosti u CSS-u)
- Zamjena social linkova, CTA labela, map embeda
- Zamjena URL-ova slika

**Tier 2 — Structural Changes** (zahtijeva AI):
- Dodavanje/brisanje/ažuriranje usluga, testimonialsa, FAQ-a, galerije, cijena
- Promjena radnog vremena
- Svaka strukturalna promjena → Gemini generira ažurirani HTML
- AI prima samo relevantne sekcije + fokusirani prompt (ne cijelu stranicu)

### 3.4 AI Editor Workflow (`edit-website.ts`)

1. Korisnik piše zahtjev u chat ("Promijeni naslov u XYZ")
2. Sustav provjerava **token balance** (≥ 50 tokena)
3. Gradi **multi-turn conversation** (Gemini Chat API s punom historijom)
4. Šalje trenutni HTML + korisnikov zahtjev
5. AI vraća JSON: `{ html, summary, suggestion }`
6. HTML se sanitizira → validira → sprema u bazu
7. Deducira 50 tokena s korisnikovog računa
8. Snapshot prethodnog HTML-a sprema se u `editHistory` (za undo)
9. Vraća korisniku: izmijenjeni HTML + sažetak + prijedlog sljedećeg koraka

**Undo** (`undoLastEditAction`): vraća zadnji snapshot iz `editHistory`, filtriran per-page (podstranice imaju zasebnu historiju).

**Timeout**: 120 sekundi → poruka "Zahtjev je predugo trajao"

**Model fallback**: Ako primarni model vrati 503/timeout/quota, pokušava se fallback model.

### 3.5 Visual Editor

Osim AI editora, korisnici imaju i **Visual Editor** koji omogućuje:
- Klik na element → direktno uređivanje teksta (inline)
- Zamjena slika (upload ili URL)
- Zamjena pozadinskih slika
- Sve promjene se injektiraju u HTML putem JavaScripta (`visual-editor-injection.js`)

### 3.6 Promjena Stila (`change-style.ts`)

- Korisnik može odabrati jedan od **20 dizajnerskih stilova**
- Košta **500 tokena**
- Regenerira kompletnu stranicu s istim sadržajem ali novim vizualnim stilom
- Stilovi su grupirani u 4 kategorije:
  - **Moderno & Tehnološki**: Bento/Apple, Dark/Web3, Neo-Brutalism, Korporativno, Glassmorphism
  - **Kreativno & Odvažno**: Editorial, Tipografija, Playful/App, Cyberpunk, Retro/90s
  - **Elegantno & Premium**: Luxury, Organic/Earthy, Monochrome, Neumorphism, Skandinavski
  - **Specifične niše**: Industrial, E-commerce, Portfolio, Material/Google, Handmade

### 3.7 Reset Projekta (`reset-project.ts`)

Potpuno resetiranje projekta na "prazan" stav:
- Zahtijeva potvrdu: korisnik mora upisati `obriši {ime projekta}`
- Briše: generatedHtml, reactFiles, contentData, blog postove, kategorije, kontakt submisije, medije
- Uklanja domene s Vercela
- Status se vraća na `DRAFT`
- Cijena: 500 tokena (Starter) / 1000 tokena (Advanced/Growth)
- **Pretplata ostaje aktivna** — samo sadržaj se briše

### 3.8 Blog Sustav

- Dostupno samo na **Advanced** paketu
- AI generiranje članaka: `/api/blog/generate`
- **Limit**: 20 AI generiranih članaka mjesečno (`Project.blogPostsUsedThisMonth`)
- Automatski mjesečni reset (`Project.blogPostsResetAt`)
- Blog obuhvaća: naslov, slug, excerpt, sadržaj, cover image, kategorija, tagovi, SEO meta
- Statusi: `DRAFT`, `PUBLISHED`

### 3.9 Domene i Publishing

#### Publiciranje stranice
1. Generira se **subdomena** od imena projekta (transliteracija hrvatskih znakova: č→c, š→s, ž→z, đ→dj)
2. Dodaje se na Vercel API: `{subdomena}.webica.hr`
3. Status projekta → `PUBLISHED`
4. Stranica odmah dostupna

#### Custom domena
1. Korisnik unosi domenu (npr. `mojadomela.hr`)
2. Dodaje se na Vercel API
3. Korisnik mora konfigurirati DNS (CNAME → `cname.vercel-dns.com` ili A record)
4. Verifikacija putem Vercel API-ja

#### Republish
Kada korisnik napravi izmjene nakon publishanja → "Republish" gumb bumpa `publishedAt` timestamp.

#### Unpublish
Uklanja domene s Vercela, status → `GENERATED`, **subdomain se čuva** za potencijalni re-publish.

### 3.10 Kontakt Forma

- Automatski injektirana u svaku generiranu stranicu
- JavaScript fetch() šalje podatke na `/api/site/{projectId}/contact`
- Sprema se u `ContactSubmission` tablicu
- Korisnik ih vidi u dashboardu pod "Upiti" (Inquiries)
- `contactEmail` field na projektu može override-ati korisnikov email za notifikacije

### 3.11 SOLO Fiskalizacija

Svaki payment (pretplata ili kupnja tokena) automatski generira **fiskalni račun** putem SOLO API-ja:
- Endpoint: `https://api.solo.com.hr/racun`
- Tip usluge: Usluga (ne proizvod)
- Valuta: EUR
- Način plaćanja: Kartično
- Napomena uključuje VAT izuzeće: "Obveznik nije u sustavu PDV-a prema čl. 90."
- PDF račun šalje se korisniku emailom i sprema u `Invoice` tablicu

### 3.12 Admin Panel

Admin korisnici (`User.role = 'ADMIN'`) imaju pristup:
- `/admin` dashboard s globalnom statistikom
- Pregled svih korisnika, projekata, računa, feedbackova
- Design reference management
- AI model switcher (SystemConfig — odabir Gemini verzije)
- Gemini usage tracking (input/output tokeni, cijena po API pozivu)
- Mogućnost edita bilo kojeg projekta (admin bypass)

---

## 4. Troubleshooting Guide

### 4.1 Problemi s plaćanjem i pretplatom

| Problem | Mogući uzrok | Rješenje |
|---------|-------------|----------|
| Korisnik platio ali nema projekta | Webhook nije stigao ili je failao | Admin provjera u Stripe dashboardu → ručno kreiranje projekta ili sync |
| Dupli projekti | Webhook procesiran dvaput | Obrisati duplikat u admin panelu |
| "Unauthorized" pri checkout-u | Korisnik nije prijavljen | Redirect na `/auth/login` — trial data sprema se u localStorage |
| Pretplata aktivna ali nema novog projekta | Token purchase checkout (nema subscriptionId) — ispravno preskočen | Provjeriti s korisnikom jesu li kupili token paket umjesto pretplate |
| Ne dolazi potvrdni email | SMTP konfiguracija, email u spam folderu | Provjeri SMTP env vars; korisnik neka pogleda spam/junk folder |
| Fiskalni račun nije kreiran | SOLO API token nevažeći ili API error | Provjeri server logove za "❌ Solo API error"; ručno kreiranje u SOLO |

### 4.2 Problemi s generiranjem

| Problem | Mogući uzrok | Rješenje |
|---------|-------------|----------|
| Generiranje traje predugo | AI model pod opterećenjem / rate limit | Pokušati ponovo za 1-2 min; sustav ima 120s timeout |
| AI vratio neispravan HTML | Parsiranje AI odgovora failalo | Sustav prikazuje poruku; korisnik treba reformulirati zahtjev ili probati opet |
| Stranica izgleda "polomljeno" | AI dodao broken CSS/JS ili duplicirao sekcije | Undo u editoru; ili resetirati projekt ako je ozbiljno |
| Slike se ne prikazuju | Vercel Blob URL istekao ili AI generirao nepostojeći URL | Korisnik može zamijeniti slike putem Visual Editora ili Content Forme |
| "hasGenerated" flag problem | Projekt označen kao generiran bez validnog HTML-a | Admin reset `hasGenerated = false` u bazi |

### 4.3 Problemi s AI Editorom

| Problem | Mogući uzrok | Rješenje |
|---------|-------------|----------|
| "Nemate dovoljno tokena" | `User.editorTokens < 50` | Korisnik mora kupiti token paket na `/dashboard/projects/{id}/tokens` |
| AI ne razumije zahtjev | Preširok ili nejasan zahtjev | Savjet: biti konkretan, jedna izmjena po zahtjevu |
| Izmjena "pojela" sekciju | AI pogrešno interpretirao zahtjev | Koristiti **Undo** gumb; preformulirati zahtjev |
| Editor timeout (120s) | Prevelik HTML ili prezahtjevan edit | Skratiti zahtjev; pokušati ponovo |
| Undo ne radi | Nema editHistory za odabranu stranicu | Provjera da je odabrana prava stranica (home vs. subpage) |
| Fallback model korišten | Primarni model vratio 503 ili high demand | Normalan rad — fallback model možda generira nešto drugačiji rezultat |

### 4.4 Problemi s domenama

| Problem | Mogući uzrok | Rješenje |
|---------|-------------|----------|
| Subdomena ne radi | Vercel API error pri dodavanju | Provjeri server logove; pokušaj republish |
| Custom domena ne radi | DNS zapisi nisu ispravno postavljeni | Korisnik mora dodati **CNAME** zapis: `www` → `cname.vercel-dns.com` ILI **A** zapis: `76.76.21.21` |
| "Domain already in use" | Druga Vercel stranica koristi domenu | Korisnik mora ukloniti domenu s prethodnog projekta prvo |
| SSL certifikat nije aktivan | DNS propagacija u tijeku | Čekati do 48h za propagaciju; provjeriti DNS konfiguraciju |
| "Site must be published first" | Pokušaj dodavanja custom domene prije objave | Korisnik mora prvo objaviti stranicu (Publish) |

### 4.5 Problemi s blogom

| Problem | Mogući uzrok | Rješenje |
|---------|-------------|----------|
| "Dosegnuli ste mjesečni limit" | `blogPostsUsedThisMonth >= 20` | Čekati do reset-a (sljedeći mjesec) ili ručno pisati članke |
| Blog post se ne prikazuje | Status = DRAFT | Korisnik mora promijeniti status na PUBLISHED |
| Blog nedostupan na Starter planu | Blog nije uključen u Starter | Upgrade na Advanced paket |

### 4.6 Problemi s kontakt formom

| Problem | Mogući uzrok | Rješenje |
|---------|-------------|----------|
| Kontakt forma ne šalje | JavaScript script nije injektiran | Koristiti API `/api/fix-contact-form` za re-injekciju |
| Ne dolaze emailovi | contactEmail nije postavljen; SMTP error | Provjeriti Project.contactEmail; provjeriti SMTP logove |
| Upiti se ne prikazuju u dashboardu | ContactSubmission tablica | Provjera baze; moguće da projektu nedostaje `projectId` mapiranje |

### 4.7 Grace Period & Brisanje

| Problem | Mogući uzrok | Rješenje |
|---------|-------------|----------|
| Korisnik želi obnoviti nakon otkazivanja | Grace period (90 dana) još aktivan | `/api/renew-subscription` — korisnik plaća novu pretplatu, isti projekt se reactivira |
| Podaci obrisani — korisnik želi nazad | Prošlo 90 dana, cron job obrisao sve | **Nema povratka** — podaci su trajno obrisani. Korisnik mora kreirati novi projekt |
| Korisnik ne prima reminder emaile | Email u spam-u; SMTP error | Provjera deliverability-ja; provjera logova cron joba |

---

## 5. STRICT AI SUPPORT RULES

### 5.1 Definicija: Tehnički Ticket vs. Content/Design Zahtjev

> **⚠️ OVO JE NAJVAŽNIJA SEKCIJA ZA SUPPORT TIM**

#### ✅ TEHNIČKI TICKET — Zahtijeva admin intervenciju

Ticket se klasificira kao **TEHNIČKI** ako korisnik prijavljuje:

1. **Sustav ne funkcionira ispravno**
   - "Ne mogu se prijaviti" (auth error)
   - "Stripe plaćanje nije prošlo ali mi je skinut novac"
   - "Dashboard prikazuje grešku / prazan ekran"
   - "Stranica se ne otvara na mojoj domeni"
   - "Blog se ne otvara na live stranici"
   - "Kontakt forma ne šalje poruke"

2. **Podatkovni problemi**
   - "Platili smo ali nemamo projekt u dashboardu"
   - "Tokeni su se potrošili ali izmjena se nije spremila"
   - "Moj projekt je nestao" (mogući premature deletion)
   - "Dupli projekti u dashboardu"

3. **Infrastrukturni problemi**
   - "DNS konfiguracija ne radi unatoč ispravnim postavkama"
   - "SSL certifikat prikazuje grešku"
   - "Stranica prikazuje 500/404 error"
   - "AI generiranje konstantno failuje (ne samo jednom)"

4. **Billing problemi**
   - "Pretplata je otkazana ali ja to nisam napravio"
   - "Dupla naplata"
   - "Fiskalni račun je neispravan"
   - "Želim refund"

#### 🎨 CONTENT/DESIGN ZAHTJEV — Preusmjeriti na AI Editor

Zahtjev **NIJE** tehnički ticket ako korisnik želi:

1. **Vizualne promjene**
   - "Promijenite boju na plavu"
   - "Dodajte novu sekciju s cijenama"
   - "Stavite veću sliku u hero"
   - "Font je previše malen"
   - "Promijenite naslov u..."
   - "Želim drugačiji raspored sekcija"

2. **Sadržajne promjene**
   - "Ažurirajte broj telefona"
   - "Dodajte novu uslugu"
   - "Promijenite tekst u About sekciji"
   - "Dodajte novi testimonial"
   - "Ažurirajte radno vrijeme"
   - "Promijenite pozadinsku sliku"

3. **SEO izmjene**
   - "Promijenite meta title"
   - "Dodajte ključne riječi"

> **ODGOVOR ZA CONTENT/DESIGN ZAHTJEVE:**
>
> *"Ovakvu vrstu izmjene možete napraviti sami putem AI Editora u par sekundi! Otvorite svoj projekt u dashboardu, kliknite 'Editor', i opišite željenu promjenu na hrvatskom. AI će automatski primijeniti izmjenu. Svaka izmjena troši 50 tokena.*
>
> *Alternativno, za kontakt podatke, usluge, boje i slično — možete koristiti Content formu (tab 'Sadržaj') koja omogućuje direktne izmjene bez potrošnje tokena."*

### 5.2 Eskalacija — Kada support ne zna

**Eskalirati administratoru** u sljedećim situacijama:
- Korisnik tvrdi da je sustav pogrešno naplaćivao
- Server konzistentno vraća 500 errore
- AI generiranje **uopće** ne radi (ne samo za jednog korisnika)
- Korisnik ima specifične regulatorne / pravne zahtjeve (GDPR, brisanje podataka)
- Potrebna intervencija u bazi podataka

### 5.3 Ključni Workflow za Support Agenta

```
Korisnik šalje ticket
    │
    ├─ Je li problem TEHNIČKI? (auth, payment, infrastruktura, baza)
    │   └─ DA → Klasificiraj kao TEHNIČKI TICKET
    │         → Provjeri server logove (Vercel Logs)
    │         → Provjeri Stripe Dashboard
    │         → Provjeri bazu (Admin Panel)
    │         → Eskalirati ako ne možeš riješiti
    │
    └─ Je li problem DIZAJN/SADRŽAJ? (boje, tekst, raspored, slike)
        └─ DA → NE OTVARAJ TICKET
              → Uputi korisnika na AI EDITOR
              → Ili uputi na CONTENT FORMU
              → Pošalji link do projekta u dashboardu
```

### 5.4 Korisne Admin Akcije

| Akcija | Kako |
|--------|------|
| Dodaj tokene korisniku | Admin panel → Users → `admin-add-tokens.ts` |
| Provjeri Stripe status | Stripe Dashboard → search by email |
| Ručno sync pretplate | Workflow: `/sync-subscriptions` |
| Provjeri AI model status | Admin → Settings → Model Switcher |
| Provjeri Gemini potrošnju | Admin → Usage tab |
| Generiraj fiskalni račun ručno | SOLO Dashboard |
| Fix kontakt forme | API call: `POST /api/fix-contact-form` s `projectId` |
| Republish stranice | Admin panel → Projects → project detail → Republish |

---

> **Napomena**: Ovaj dokument je generiran automatskom analizom kompletnog codebase-a i odražava stanje sustava na dan 03.03.2026. Za ažurirane informacije, uvijek konzultiraj najnoviji kod.
