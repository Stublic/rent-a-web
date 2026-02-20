/**
 * AI Image Generation utility
 * Uses gemini-3-pro-image-preview to generate relevant images,
 * uploads them to Vercel Blob, and returns public URLs.
 * Falls back to Pexels stock photos if image generation fails.
 *
 * Designed for reuse in both /try/generate and the main project generator.
 */

import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Image generation model
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

// ─── Style → photo aesthetic modifier ─────────────────────────────────────────
export const STYLE_IMAGE_MODS: Record<string, string> = {
    organic: 'warm natural lighting, earthy tones, sage green and terracotta palette, plants and natural textures, calm and grounded mood',
    luxury: 'ultra-minimalist, white marble surfaces, gold accents, soft diffused light, elegant and aspirational',
    scandinavian: 'bright airy space, white and light wood tones, clean lines, functional simplicity, Scandinavian interior',
    cyberpunk: 'dark dramatic lighting, neon green or magenta accent light, high contrast, moody and futuristic',
    dark_web3: 'dark background, blue and purple neon glows, moody dramatic atmosphere, tech aesthetic',
    retro: 'warm film grain, slightly desaturated vintage tones, nostalgic 70s or 90s mood, soft vignette',
    playful: 'bright vibrant colors, cheerful energy, soft pastel accents, friendly and welcoming',
    corporate: 'professional clean environment, navy and slate tones, formal and trustworthy atmosphere',
    glassmorphism: 'bright airy, colorful blurred background with frosted glass elements, dreamlike quality',
    bento: 'clean minimal flat composition, soft whites and light grays, organised and uncluttered',
    neo_brutalism: 'high contrast bold composition, graphic and punchy, raw and unfiltered energy',
    editorial: 'editorial fashion photography style, asymmetric composition, artistic and refined',
    typography_first: 'minimal graphic composition, strong geometric shapes, typographic feel',
    neumorphism: 'soft gray palette, very low contrast, gentle shadows, calm and tactile feel',
    monochrome: 'black and white photography, strong contrast, architectural composition',
    industrial: 'concrete and steel textures, dark moody industrial setting, raw materials',
    ecommerce: 'clean white product photography background, high detail, sharp and commercial',
    portfolio: 'dramatic artistic photography, dark background, moody cinematic lighting',
    material: 'clean flat colorful environment, bright and vibrant, layered depth',
    handmade: 'warm rustic textures, handmade craft aesthetic, artisan workshop atmosphere',
};

// ─── Industry → image subject and environment ─────────────────────────────────
export const INDUSTRY_IMAGE_MAP = [
    {
        kw: ['frizer', 'salon', 'šiš', 'boja', 'kos', 'hair', 'friz'],
        hero: 'stylish modern hair salon interior with warm lighting', about: 'professional hairdresser styling client hair', services: 'hair styling tools and products flat lay'
    },
    {
        kw: ['restoran', 'pizzeria', 'pizza', 'caffe', 'café', 'kafić', 'bistro', 'konoba', 'grill', 'kuhinja'],
        hero: 'elegant restaurant dining area with warm ambient lighting', about: 'skilled chef plating gourmet food in professional kitchen', services: 'beautifully presented gourmet dish close-up'
    },
    {
        kw: ['auto', 'mehaničar', 'automobil', 'vozil', 'gume', 'motor', 'servis auto'],
        hero: 'modern professional car service garage', about: 'expert mechanic working on car engine with precision', services: 'automotive tools laid out in organized workshop'
    },
    {
        kw: ['odvjetn', 'pravn', 'sud', 'ugovor', 'pravo', 'notarsk'],
        hero: 'sophisticated law office with books and elegant furniture', about: 'professional lawyer in consultation meeting with client', services: 'legal documents and scales of justice on desk'
    },
    {
        kw: ['liječn', 'doktor', 'klinik', 'stomatolog', 'zubar', 'medicin', 'zdravl'],
        hero: 'modern bright medical clinic reception area', about: 'caring doctor having consultation with patient', services: 'advanced medical equipment in clean clinic room'
    },
    {
        kw: ['coach', 'kouč', 'mentori', 'personal', 'savjet', 'life', 'konzultacij'],
        hero: 'bright inspiring life coaching studio space with plants', about: 'warm empathetic coach in conversation with client', services: 'cozy consultation nook with natural light and plants'
    },
    {
        kw: ['dom', 'prostor', 'interijer', 'uređenj', 'home', 'stanovan', 'namještaj'],
        hero: 'beautifully designed modern home interior living room', about: 'interior designer reviewing room layout and fabric samples', services: 'architectural detail of elegant home decor'
    },
    {
        kw: ['fitness', 'teretana', 'gym', 'trening', 'sport', 'trener', 'pilates', 'yoga', 'wellness'],
        hero: 'bright modern fitness studio with equipment', about: 'personal trainer motivating client during workout session', services: 'close-up of fitness equipment and weights'
    },
    {
        kw: ['kozmet', 'ljepot', 'beauty', 'manikur', 'pedikur', 'spa', 'masaž', 'nega'],
        hero: 'luxurious beauty spa reception with soft lighting', about: 'beauty therapist providing professional skin treatment', services: 'premium skincare products arranged elegantly'
    },
    {
        kw: ['građevin', 'gradi', 'renovacij', 'soboslikar', 'ličilac', 'fasad', 'krov', 'zidar'],
        hero: 'modern construction site with professional workers', about: 'skilled construction team collaborating on renovation', services: 'professional construction tools and blueprints'
    },
    {
        kw: ['vodoinstalater', 'instal', 'kupaon', 'sanitarij'],
        hero: 'newly renovated luxurious modern bathroom', about: 'professional plumber installing fixtures with precision', services: 'modern plumbing fixtures and tools close-up'
    },
    {
        kw: ['računovod', 'porez', 'financij', 'reviz', 'knjigovod'],
        hero: 'clean modern accounting office with large windows', about: 'professional accountant reviewing financial documents', services: 'financial charts and documents on clean desk'
    },
    {
        kw: ['fotografij', 'fotograf', 'video', 'sniman', 'vjenčanj', 'wedding', 'portret'],
        hero: 'professional photography studio with camera equipment', about: 'photographer capturing beautiful portrait shot', services: 'professional camera lenses and equipment arranged'
    },
    {
        kw: ['nekretnin', 'stan', 'kuć', 'real estate', 'prodaj', 'najam'],
        hero: 'stunning modern house exterior in golden hour light', about: 'real estate agent showing client around bright property', services: 'elegant modern interior living room and dining area'
    },
    {
        kw: ['pekar', 'pekara', 'kruh', 'kolač', 'torta', 'slastičar'],
        hero: 'artisan bakery with fresh bread and pastries displayed', about: 'skilled baker pulling fresh bread from stone oven', services: 'beautiful freshly baked pastries and cakes close-up'
    },
    {
        kw: ['cvjeć', 'flower', 'buket', 'florist'],
        hero: 'colorful flower shop with bouquets on display', about: 'florist artfully arranging fresh flower bouquet', services: 'close-up of vibrant fresh flowers and petals'
    },
    {
        kw: ['softver', 'razvoj', 'programer', 'web', 'app', 'digital', 'startup', 'tech', 'it', 'saas'],
        hero: 'modern tech startup open office with screens and plants', about: 'developer team collaborating around computer screens', services: 'code on screen in modern development environment'
    },
    {
        kw: ['čišćen', 'posprem', 'clean', 'higijena', 'dezinfek'],
        hero: 'spotlessly clean bright modern home after cleaning', about: 'professional cleaner working with eco-friendly products', services: 'professional cleaning supplies and equipment organized'
    },
    {
        kw: ['prijevoz', 'dostava', 'taxi', 'logistik', 'kamion', 'kurirsk'],
        hero: 'professional delivery vehicles lined up in modern facility', about: 'smiling delivery professional with package at doorstep', services: 'organized logistics warehouse with packages'
    },
    {
        kw: ['hotel', 'hostel', 'smještaj', 'apartman', 'resort'],
        hero: 'luxury hotel lobby with elegant interior design', about: 'friendly hotel staff providing excellent guest service', services: 'luxurious hotel room with beautiful bed arrangement'
    },
    {
        kw: ['turizam', 'putovanj', 'travel', 'odmor', 'izlet', 'agencij'],
        hero: 'breathtaking travel destination landscape photography', about: 'experienced travel guide leading group on adventure', services: 'travel accessories maps and passport arranged beautifully'
    },
    {
        kw: ['vrtlar', 'vrt', 'hortikultur', 'uređenj vrta'],
        hero: 'beautifully landscaped garden with lush plants', about: 'professional gardener tending to beautiful garden', services: 'gardening tools and colorful flowers arranged'
    },
    {
        kw: ['glazb', 'glazben', 'glazbenik', 'studio', 'sniman glazb'],
        hero: 'professional music recording studio with equipment', about: 'musician recording in professional studio setting', services: 'professional music equipment microphone and instruments'
    },
    {
        kw: ['tiskara', 'tisak', 'dizajn', 'grafičk', 'print'],
        hero: 'creative design studio with color samples and screens', about: 'graphic designer working on creative project', services: 'printed design materials and color swatches'
    },
];

/**
 * Build business-specific and style-aware image generation prompts.
 */
export function buildAIImagePrompts(
    businessName: string,
    businessDescription: string,
    styleKey?: string | null
): { hero: string; about: string; services: string } {
    const text = `${businessName} ${businessDescription}`.toLowerCase();
    const styleMod = styleKey ? (STYLE_IMAGE_MODS[styleKey] ?? '') : '';

    const matched = INDUSTRY_IMAGE_MAP.find(e => e.kw.some(kw => text.includes(kw)));

    const base = matched ?? {
        hero: `professional business environment for ${businessName}`,
        about: `professional team working at ${businessName}`,
        services: `professional service detail for ${businessName}`,
    };

    const suffix = styleMod
        ? `. Style: ${styleMod}. Photorealistic, high quality, no text, no people standing awkwardly.`
        : `. Photorealistic, professional photography, high quality, no text.`;

    return {
        hero: `${base.hero}${suffix} Wide landscape 16:9 format.`,
        about: `${base.about}${suffix} Natural candid feel.`,
        services: `${base.services}${suffix} Detailed and sharp.`,
    };
}

/**
 * Generate a single image using Gemini image model and upload to Vercel Blob.
 * Returns the public Blob URL, or null on any failure.
 */
export async function generateAndUploadImage(
    prompt: string,
    filename: string
): Promise<string | null> {
    if (!GOOGLE_API_KEY || !BLOB_TOKEN) return null;

    try {
        const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: prompt,
            config: {
                responseModalities: ['IMAGE'],
                imageConfig: {
                    aspectRatio: '16:9',
                    imageSize: '1K', // 1K is faster; use '2K' for main builder
                } as any,
            },
        });

        // Extract base64 image from response
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        const imagePart = parts.find((p: any) => p.inlineData?.data);
        if (!imagePart?.inlineData?.data) return null;

        const { data, mimeType } = imagePart.inlineData;
        const buffer = Buffer.from(data, 'base64');
        const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';

        // Upload to Vercel Blob
        const blob = await put(`ai-images/${filename}-${Date.now()}.${ext}`, buffer, {
            access: 'public',
            token: BLOB_TOKEN,
            contentType: mimeType,
        });

        console.log(`📷 AI image uploaded: ${blob.url}`);
        return blob.url;

    } catch (err: any) {
        console.error(`⚠️ Image gen failed for "${filename}":`, err.message?.slice(0, 100));
        return null;
    }
}

/**
 * Generate all 3 page images in parallel.
 * Falls back to Pexels or static URL on failure.
 */
export async function generatePageImages(config: {
    businessName: string;
    businessDescription: string;
    industry?: string;
    styleKey: string | null;
}): Promise<{ hero: string; about: string; services: string }> {
    const { businessName, businessDescription, styleKey } = config;
    const prompts = buildAIImagePrompts(businessName, businessDescription, styleKey);

    // Use short slug for filenames
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);

    const [heroUrl, aboutUrl, servicesUrl] = await Promise.all([
        generateAndUploadImage(prompts.hero, `${slug}-hero`),
        generateAndUploadImage(prompts.about, `${slug}-about`),
        generateAndUploadImage(prompts.services, `${slug}-services`),
    ]);

    // Internal Pexels fallback
    async function pexelsFallback(query: string): Promise<string | null> {
        try {
            const key = process.env.PEXELS_API_KEY;
            if (!key) return null;
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
                headers: { Authorization: key }
            });
            const data = await res.json();
            const photos = data?.photos;
            if (!photos?.length) return null;
            const photo = photos[Math.floor(Math.random() * photos.length)];
            return photo.src.large2x || photo.src.large || null;
        } catch { return null; }
    }

    const FALLBACKS = {
        hero: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1400',
        about: 'https://images.pexels.com/photos/4350057/pexels-photo-4350057.jpeg?auto=compress&cs=tinysrgb&w=900',
        services: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1000',
    };

    const text = `${businessName} ${businessDescription}`.toLowerCase();
    const ind = INDUSTRY_IMAGE_MAP.find(e => e.kw.some(kw => text.includes(kw)));
    const styleMod = styleKey ? (STYLE_IMAGE_MODS[styleKey] ?? '') : '';
    const mod = styleMod ? ` ${styleMod.split(',')[0]}` : '';

    return {
        hero: heroUrl ?? await pexelsFallback((ind?.hero ?? 'professional business') + mod) ?? FALLBACKS.hero,
        about: aboutUrl ?? await pexelsFallback((ind?.about ?? 'professional team') + mod) ?? FALLBACKS.about,
        services: servicesUrl ?? await pexelsFallback((ind?.services ?? 'professional service') + mod) ?? FALLBACKS.services,
    };
}
