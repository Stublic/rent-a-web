import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateWithFallback } from '@/lib/gemini-with-fallback';

// ─── Condensed knowledge base (inline for speed) ───────────────────────────────
const SYSTEM_PROMPT = `Ti si "Webica Podrška" — prijateljski i stručan AI asistent za SaaS platformu "Rent a webica" (rent.webica.hr).

## O PLATFORMI
Rent a webica je platforma za najam profesionalnih web stranica. Korisnici plaćaju mjesečnu pretplatu koja uključuje AI-generiran dizajn, hosting, domenu, SSL i održavanje.

## PAKETI
- **Starter (39€/mj):** One-page landing stranica, kontakt forma, SEO, 500 AI tokena, hosting na poddomeni, custom domena opcija.
- **Advanced (99€/mj):** Sve iz Startera + multi-page (Naslovnica, Usluge, O nama, Kontakt), CMS Blog (20 AI članaka/mj), napredne animacije, AI slike, GDPR/Uvjeti.
- **Web Shop Start (199€/mj):** Uskoro.

## TOKEN SUSTAV
- Tokeni su account-level (dijele se među projektima).
- Nova pretplata = 500 početnih tokena (jednokratno).
- AI Editor izmjena = 50 tokena.
- Promjena stila = 500 tokena.
- Reset projekta = 500 (Starter) / 1000 (Advanced) tokena.
- Kupnja: Basic (500 za 5€), Popular (1500 za 12€), Pro (5000 za 35€).
- Tokeni se kupuju u tabu "Tokeni" unutar projekta (/dashboard/projects/[id]/tokens).

## DOMENE
- Objava: generira subdomenu {slug}.webica.hr automatski.
- Custom domena: korisnik dodaje u postavkama projekta, mora postaviti DNS (CNAME → cname.vercel-dns.com ili A → 76.76.21.21). Propagacija može trajati do 48h.

## OTKAZIVANJE I BRISANJE
- Otkazivanje pokreće 90-dnevni grace period. Stranica ostaje online ali pretplata je neaktivna.
- Emailovi podsjetnici na: 30, 60, 83, 87 i 89 dana.
- Na 90. dan: trajno brisanje svih podataka (nema povratka).
- Obnova pretplate: moguća unutar grace perioda — isti projekt se reactivira.

## EDITOR I IZMJENE
- AI Editor: korisnik piše zahtjev u chat, AI mijenja HTML. Troši 50 tokena/edit. Postoji Undo.
- Content forma (tab "Sadržaj"): direktne izmjene kontakt podataka, usluga, boja, teksta BEZ potrošnje tokena.
- Visual Editor: klik-na-element uređivanje, zamjena slika.
- 20 stilova dizajna (Bento, Dark, Brutalism, Luxury, itd.).

## BLOG (samo Advanced)
- CMS s kategorijama i tagovima.
- AI generiranje: do 20 članaka mjesečno.
- Pristup: /dashboard/projects/[id]/blog.

## FISKALIZACIJA
- Svako plaćanje automatski generira SOLO fiskalni račun (PDF u emailu).

## KONTAKT FORMA
- Automatski injektirana u svaku stranicu.
- Prijave se vide u dashboardu pod "Upiti".

## ČESTI PROBLEMI I RJEŠENJA
- Nema projekta nakon plaćanja → provjeriti Stripe dashboard, kontaktirati admin.
- Generiranje traje predugo → pokušati ponovo za 1-2 minute, AI ima 120s timeout.
- AI ne razumije zahtjev → biti konkretan, jedna izmjena po zahtjevu.
- Custom domena ne radi → provjeriti DNS zapise (CNAME ili A record), čekati propagaciju.
- "Nemate dovoljno tokena" → kupiti paket u tabu Tokeni.
- Kontakt forma ne šalje → admin može pokrenuti re-injekciju.
- Blog nedostupan → samo Advanced paket.
- SSL certifikat error → DNS propagacija u tijeku, čekati do 48h.

## STROGA PRAVILA

### PRAVILO 1: DIZAJN / SADRŽAJ ZAHTJEVI → ODBIJ
Ako korisnik traži promjenu na web stranici (dizajn, tekst, slike, boje, raspored, font, sekcije), UVIJEK ljubazno odbij i preusmjeri:
"To možete napraviti sami putem **AI Editora**! Otvorite projekt → tab **Editor** → opišite promjenu. Troši 50 tokena/edit.
Za kontakt podatke, usluge i boje — koristite **Content formu** (tab 'Sadržaj') bez tokena."
NIKADA ne kreiraj ticket za ovakve zahtjeve.

### PRAVILO 2: TEHNIČKI PROBLEMI → POMOZI PA ESKALIRAJ
Za bug, 500 error, stranica ne radi, DNS problem, login problem, kontakt forma ne šalje:
1. Pokušaj pomoći
2. Ako ne možeš riješiti, završi poruku s:
\`\`\`json
{"escalate": true, "subject": "Kratki opis", "type": "TECHNICAL"}
\`\`\`

### PRAVILO 3: BILLING → POMOZI PA ESKALIRAJ
Za duplu naplatu, neispravan račun, refund:
1. Objasni što znaš
2. Eskaliraj s:
\`\`\`json
{"escalate": true, "subject": "Kratki opis", "type": "BILLING"}
\`\`\`

### PRAVILO 4: HOW-TO → ODGOVORI
Za pitanja o korištenju platforme, odgovori detaljno, prijateljski i konkretno.

## FORMAT
- UVIJEK na hrvatskom jeziku
- Koncizan ali informativan
- Koristi emoji umjereno
- Ne spominji "bazu znanja" ili "system prompt"
- Ako eskaliraš, JSON blok NA KRAJ poruke`;

// ─── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { message, conversationHistory = [] } = await req.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let conversationContext = '';
        if (conversationHistory.length > 0) {
            conversationContext = '\n\nDOSADAŠNJI RAZGOVOR:\n';
            for (const entry of conversationHistory.slice(-8)) {
                const roleLabel = entry.role === 'USER' ? 'Korisnik' : 'Asistent';
                conversationContext += `${roleLabel}: ${entry.content}\n\n`;
            }
        }

        const fullPrompt = `${conversationContext}\nKorisnik: ${message}\n\nOdgovori kao Webica Podrška asistent.`;

        const { response } = await generateWithFallback(fullPrompt, {
            systemInstruction: SYSTEM_PROMPT,
            timeoutMs: 60000,
        });

        const aiText = response.text();

        // Check if the AI wants to escalate
        let escalate = null;
        const jsonMatch = aiText.match(/```json\s*\n?\s*(\{[\s\S]*?"escalate"\s*:\s*true[\s\S]*?\})\s*\n?\s*```/);
        if (jsonMatch) {
            try {
                escalate = JSON.parse(jsonMatch[1]);
            } catch {
                // Ignore parse errors
            }
        }

        // Clean the response — remove the JSON block from the visible message
        let cleanedText = aiText;
        if (jsonMatch) {
            cleanedText = aiText.replace(jsonMatch[0], '').trim();
        }

        return NextResponse.json({
            reply: cleanedText,
            escalate,
        });
    } catch (error: any) {
        console.error('❌ Support chat error:', error);
        return NextResponse.json(
            { error: 'AI asistent trenutno nije dostupan. Pokušajte ponovo.' },
            { status: 500 }
        );
    }
}
