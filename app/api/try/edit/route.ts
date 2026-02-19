

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

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

        const prompt = `
You are an expert HTML/CSS editor. The user has a website and wants to make a change.

**Current HTML:**
\`\`\`html
${html}
\`\`\`

**User's Edit Request (in Croatian):**
"${editRequest}"

**Your Task:**
1. Understand what the user wants to change
2. Modify the HTML accordingly
3. Return ONLY the complete, modified HTML
4. Do NOT add markdown code blocks, just raw HTML
5. Keep all existing functionality intact
6. Make minimal changes - only what's requested

**Guidelines:**
- If about COLOR: modify CSS/Tailwind classes
- If about TEXT: change text content
- If about IMAGES: update src attributes
- If about LAYOUT: adjust CSS spacing, sizing, positioning
- If about ADDING CONTENT: insert new elements maintaining style
- If about REMOVING: delete the requested elements

**Critical:**
- Start output with <!DOCTYPE html>
- Return valid, complete HTML
- No explanations, no markdown, no comments outside HTML

**Also return a brief summary of what you changed as an HTML comment at the very end of the file in this exact format:**
<!-- EDIT_SUMMARY: [Brief description in Croatian of what was changed] -->

**Output:** Complete HTML document with edit summary comment at the end.
`;

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 60000)
            )
        ]) as any;

        const response = await result.response;
        let modifiedHtml = response.text();

        modifiedHtml = modifiedHtml.replace(/```html/g, '').replace(/```/g, '').trim();

        if (!modifiedHtml.includes('<!DOCTYPE') && !modifiedHtml.includes('<html')) {
            return NextResponse.json(
                { error: 'AI nije vratio ispravan HTML. Pokušajte ponovno.' },
                { status: 500 }
            );
        }

        // Extract edit summary from HTML comment
        let message = 'Izmjena primijenjena.';
        const summaryMatch = modifiedHtml.match(/<!-- EDIT_SUMMARY: (.+?) -->/);
        if (summaryMatch) {
            message = summaryMatch[1];
            // Remove the comment from HTML
            modifiedHtml = modifiedHtml.replace(/<!-- EDIT_SUMMARY: .+? -->/, '').trim();
        }

        if (modifiedHtml.length > 200000) {
            modifiedHtml = modifiedHtml.substring(0, 200000);
        }

        console.log(`✅ Trial edit applied: "${message}"`);

        return NextResponse.json({ html: modifiedHtml, message });

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
