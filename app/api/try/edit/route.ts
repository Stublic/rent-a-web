import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { parseAiResponse } from '@/lib/parse-ai-response';
import { logGeminiUsage } from '@/lib/gemini-usage';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip) {
    const now = Date.now();
    const key = `edit:${ip}`;
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.windowStart > RATE_WINDOW) {
        rateLimitMap.set(key, { windowStart: now, count: 1 });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

const EDIT_PROMPT_TEMPLATE = `
Ti si Webica AI Editor — prijateljski, stručan asistent za uređivanje web stranica.
Korisnik ti daje zahtjev za izmjenu (na hrvatskom jeziku), a ti ga primijeni na HTML stranici.

**Trenutni HTML:**
\`\`\`html
{{HTML}}
\`\`\`

**Zahtjev korisnika:**
"{{REQUEST}}"

**Tvoj zadatak:**
1. Pažljivo razumij što korisnik želi
2. Primijeni SAMO tražene izmjene, zadrži sve ostalo netaknuto
3. Vrati odgovor kao JSON objekt (bez markdown wrappinga)

**KRITIČNA PRAVILA (self-healing):**
- NIKADA ne dodavaj klasu "hidden" na vidljive elemente
- NIKADA ne dupliciraj sadržaj stranice — svaka sekcija smije postojati samo jednom
- UVIJEK osiguraj da je overflow-x: hidden na html i body elementima
- SVE container elementi moraju imati max-width: 100% — stranica se NE SMIJE horizontalno skrolati
- Ako stranica ima fixed ili sticky navigaciju, OBAVEZNO dodaj padding-top na prvi element ispod navbara (jednako visini navbara, npr. padding-top: 80px) da se sadržaj ne sakrije ispod navigacije
- URL-ovi u src i href atributima MORAJU biti čisti (npr. src="https://example.com/img.jpg"), NIKADA ne stavljaj escape znakove ili duple navodnike
- Ako primjetiš bilo koji od gore navedenih problema u trenutnom HTML-u, ISPRAVI ih
- Zadrži sve postojeće skripte, forme i funkcionalnosti

**Smjernice za izmjene:**
- BOJA: promijeni CSS / inline style / Tailwind klase
- TEKST: promijeni tekstualni sadržaj
- SLIKE: ažuriraj src atribute
- LAYOUT: podesi CSS spacing, sizing, positioning, flexbox, grid
- DODAVANJE: umetni nove sekcije/elemente koristeći stil koji je već prisutan na stranici
- BRISANJE: ukloni tražene elemente

**Odgovor (SAMO čisti JSON, bez \`\`\`json wrappinga):**
{
  "html": "...kompletni modificirani HTML dokument koji počinje s <!DOCTYPE html>...",
  "summary": "Kratki opis što si napravio (na hrvatskom, 1-2 rečenice)",
  "suggestion": "Relevantan prijedlog za sljedeću izmjenu u obliku pitanja (na hrvatskom, npr. 'Želiš li da sada uredimo boje u footer sekciji?')"
}

VAŽNO: Vrati ISKLJUČIVO JSON objekt. Bez markdown blokova, bez objašnjenja izvan JSON-a.
`;



export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Previše zahtjeva. Pokušajte ponovno za sat vremena.' },
                { status: 429 }
            );
        }

        if (!GOOGLE_API_KEY || !model) {
            return NextResponse.json(
                { error: 'AI sustav nije konfiguriran.' },
                { status: 500 }
            );
        }

        const { html, editRequest } = await req.json();

        if (!html || !editRequest) {
            return NextResponse.json(
                { error: 'HTML i zahtjev za uređivanje su obavezni.' },
                { status: 400 }
            );
        }

        if (editRequest.length > 500) {
            return NextResponse.json(
                { error: 'Zahtjev je predugačak (max 500 znakova).' },
                { status: 400 }
            );
        }

        console.log(`🆓 Trial edit: "${editRequest.substring(0, 80)}..."`);

        const prompt = EDIT_PROMPT_TEMPLATE
            .replace('{{HTML}}', html)
            .replace('{{REQUEST}}', editRequest);

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 60000)
            )
        ]) as any;

        const response = await result.response;
        const rawText = response.text();

        if (response.usageMetadata) {
            logGeminiUsage({
                type: 'try_edit_page',
                model: 'gemini-2.0-flash',
                tokensInput: response.usageMetadata.promptTokenCount || 0,
                tokensOutput: response.usageMetadata.candidatesTokenCount || 0,
            });
        }

        // Parse AI response (JSON or fallback)
        const parsed = parseAiResponse(rawText);
        if (!parsed) {
            return NextResponse.json(
                { error: 'AI nije vratio ispravan odgovor. Pokušajte ponovno.' },
                { status: 500 }
            );
        }

        // Sanitize HTML (self-healing)
        let modifiedHtml = sanitizeHtml(parsed.html);

        // Basic validation
        if (!modifiedHtml.includes('<!DOCTYPE') && !modifiedHtml.includes('<html')) {
            return NextResponse.json(
                { error: 'AI nije vratio ispravan HTML. Pokušajte ponovno.' },
                { status: 500 }
            );
        }

        if (modifiedHtml.length > 200000) {
            modifiedHtml = modifiedHtml.substring(0, 200000);
        }

        console.log(`✅ Trial edit applied: "${parsed.summary}"`);

        return NextResponse.json({
            html: modifiedHtml,
            message: parsed.summary,
            suggestion: parsed.suggestion,
        });

    } catch (error) {
        console.error('❌ Trial edit error:', error);

        if (error.message === 'AI timeout') {
            return NextResponse.json(
                { error: 'Uređivanje je predugo trajalo. Pokušajte ponovno.' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: 'Greška pri uređivanju. Pokušajte ponovno.' },
            { status: 500 }
        );
    }
}
