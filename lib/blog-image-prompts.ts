/**
 * Blog Cover Image Prompt Generator
 * 
 * Industry-aware, high-quality image prompts for Gemini image generation.
 * Produces editorial-grade, text-free images tailored to each industry vertical.
 */

// ─── Visual Category Enum ────────────────────────────────────────────────────

export type VisualCategory =
    | 'TRADES_SERVICES'
    | 'BEAUTY_WELLNESS'
    | 'FOOD_HOSPITALITY'
    | 'TECH_FINANCE_B2B'
    | 'HEALTH_MEDICAL'
    | 'CREATIVE_ARTS'
    | 'REAL_ESTATE'
    | 'FITNESS_SPORT'
    | 'RETAIL_ECOMMERCE'
    | 'EDUCATION_COACHING'
    | 'AUTOMOTIVE'
    | 'NATURE_AGRICULTURE'
    | 'DEFAULT';

// ─── Industry → Visual Category Mapping ──────────────────────────────────────

interface IndustryMatcher {
    keywords: string[];
    category: VisualCategory;
}

const INDUSTRY_MATCHERS: IndustryMatcher[] = [
    // Beauty & Wellness
    {
        keywords: ['frizer', 'salon', 'šiš', 'kos', 'hair', 'friz', 'kozmet', 'ljepot',
            'beauty', 'manikur', 'pedikur', 'spa', 'masaž', 'nega', 'lash', 'trepavic',
            'nokt', 'nails', 'depilacij', 'tretman'],
        category: 'BEAUTY_WELLNESS',
    },
    // Food & Hospitality
    {
        keywords: ['restoran', 'pizzeria', 'pizza', 'caffe', 'café', 'kafić', 'bistro',
            'konoba', 'grill', 'kuhinja', 'pekar', 'pekara', 'kruh', 'kolač', 'torta',
            'slastičar', 'catering', 'hrana', 'food', 'hotel', 'hostel', 'smještaj',
            'apartman', 'resort', 'konobar', 'meni'],
        category: 'FOOD_HOSPITALITY',
    },
    // Trades & Services
    {
        keywords: ['građevin', 'gradi', 'renovacij', 'soboslikar', 'ličilac', 'fasad',
            'krov', 'zidar', 'vodoinstalater', 'instal', 'kupaon', 'sanitarij',
            'elektr', 'čišćen', 'posprem', 'clean', 'higijena', 'dezinfek',
            'prijevoz', 'dostava', 'logistik', 'kamion', 'kurirsk', 'klima',
            'keramičar', 'stolar', 'bravar', 'moler', 'parketar', 'vrtlar', 'vrt',
            'hortikultur', 'uređenj vrta', 'selidbe'],
        category: 'TRADES_SERVICES',
    },
    // Automotive
    {
        keywords: ['auto', 'mehaničar', 'automobil', 'vozil', 'gume', 'motor',
            'servis auto', 'autopraonik', 'praonica', 'vulkanizer', 'limarij', 'lakirnic'],
        category: 'AUTOMOTIVE',
    },
    // Tech, Finance & B2B
    {
        keywords: ['softver', 'razvoj', 'programer', 'web', 'app', 'digital', 'startup',
            'tech', 'it', 'saas', 'računovod', 'porez', 'financij', 'reviz', 'knjigovod',
            'odvjetn', 'pravn', 'sud', 'ugovor', 'pravo', 'notarsk', 'konzulting',
            'agencij', 'marketing', 'seo', 'analitik'],
        category: 'TECH_FINANCE_B2B',
    },
    // Health & Medical
    {
        keywords: ['liječn', 'doktor', 'klinik', 'stomatolog', 'zubar', 'medicin',
            'zdravl', 'fizioterapeut', 'fizikaln', 'terapeut', 'psiholog', 'nutricionist',
            'ljekarn', 'farmaceut', 'optičar', 'optik', 'veterinar'],
        category: 'HEALTH_MEDICAL',
    },
    // Fitness & Sport
    {
        keywords: ['fitness', 'teretana', 'gym', 'trening', 'sport', 'trener', 'pilates',
            'yoga', 'wellness', 'crossfit', 'bokser', 'borb', 'plivan', 'ples', 'dance'],
        category: 'FITNESS_SPORT',
    },
    // Creative & Arts
    {
        keywords: ['fotografij', 'fotograf', 'video', 'sniman', 'vjenčanj', 'wedding',
            'portret', 'tiskara', 'tisak', 'dizajn', 'grafičk', 'print', 'glazb',
            'glazben', 'glazbenik', 'studio', 'sniman glazb', 'cvjeć', 'flower',
            'buket', 'florist', 'umjetn', 'galerij', 'tattoo', 'tetovir'],
        category: 'CREATIVE_ARTS',
    },
    // Real Estate
    {
        keywords: ['nekretnin', 'stan', 'kuć', 'real estate', 'prodaj nekretnin', 'najam',
            'dom', 'prostor', 'interijer', 'uređenj', 'home', 'stanovan', 'namještaj',
            'arhitekt'],
        category: 'REAL_ESTATE',
    },
    // Education & Coaching
    {
        keywords: ['coach', 'kouč', 'mentori', 'savjet', 'life', 'konzultacij',
            'škol', 'edukacij', 'tečaj', 'podučavan', 'instrukcij', 'učenj',
            'predavan', 'seminar', 'radionic', 'vrtić', 'dječj'],
        category: 'EDUCATION_COACHING',
    },
    // Retail & Ecommerce
    {
        keywords: ['trgovin', 'shop', 'dućan', 'prodavaonic', 'webshop', 'ecommerce',
            'prodaj', 'butik', 'moda', 'fashion', 'odjeć', 'obuć'],
        category: 'RETAIL_ECOMMERCE',
    },
    // Nature & Agriculture
    {
        keywords: ['poljopriv', 'farma', 'OPG', 'ekolog', 'bio', 'organ',
            'turizam', 'putovanj', 'travel', 'odmor', 'izlet', 'agroturizam'],
        category: 'NATURE_AGRICULTURE',
    },
];

// ─── Category → Visual Style Presets ─────────────────────────────────────────

interface VisualStyle {
    /** Base aesthetic description — camera, mood, environment */
    aesthetic: string;
    /** Lighting specification */
    lighting: string;
    /** Camera / lens specification */
    camera: string;
    /** Color palette direction */
    palette: string;
    /** Extra emphasis or avoidance */
    emphasis: string;
}

const CATEGORY_STYLES: Record<VisualCategory, VisualStyle> = {
    BEAUTY_WELLNESS: {
        aesthetic: 'editorial beauty photography, soft dreamy atmosphere, elegant and luxurious feel, spa-like tranquility',
        lighting: 'soft diffused natural window light, gentle rim lighting, luminous skin tones, golden hour warmth',
        camera: 'shot on 85mm f/1.4 lens, shallow depth of field, creamy bokeh, intimate close-up or medium shot',
        palette: 'soft blush pinks, warm champagne, ivory whites, touches of rose gold, muted sage green accents',
        emphasis: 'must feel premium and aspirational, like a Vogue Beauty editorial. Focus on textures: fresh flowers, candles, marble, silk fabrics, essential oils. Avoid clinical or sterile environments.',
    },
    FOOD_HOSPITALITY: {
        aesthetic: 'professional food photography, appetizing and mouth-watering, warm convivial atmosphere, Michelin-star presentation',
        lighting: 'warm directional side-light from a single source, dramatic food shadows, golden ambient glow, candlelight warmth',
        camera: 'shot on 50mm f/1.8 macro lens, extremely shallow depth of field, steam and motion captured, overhead or 45-degree angle',
        palette: 'rich warm tones, deep burgundy, honey gold, rustic wood browns, fresh herb greens, creamy whites',
        emphasis: 'focus on food textures: glistening sauces, crispy crusts, fresh ingredients, artisan plating. Must trigger appetite. Avoid flat or cafeteria-style shots. Think Bon Appétit magazine cover.',
    },
    TRADES_SERVICES: {
        aesthetic: 'cinematic documentary photography, authentic and powerful, skilled craftsmanship in action, gritty premium realism',
        lighting: 'dramatic volumetric lighting with dust particles, strong directional key light, deep atmospheric shadows, natural workshop light',
        camera: 'shot on 35mm f/2.0 lens, wide angle environmental portrait, sharp foreground with soft background, dynamic composition',
        palette: 'industrial steel blues, warm amber highlights, concrete grays, safety orange accents, deep shadows',
        emphasis: 'show mastery and precision of craft. Focus on weathered hands, professional tools, raw materials, the process of building. Must feel authentic not staged. Avoid cheesy thumbs-up poses.',
    },
    AUTOMOTIVE: {
        aesthetic: 'premium automotive photography, sleek and powerful, high-end car magazine editorial quality, precision engineering detail',
        lighting: 'dramatic studio lighting with reflections on metal surfaces, strong rim light outlining shapes, polished surface highlights',
        camera: 'shot on 24-70mm f/2.8 lens, dynamic low angle, sharp reflections, motion blur for speed, detailed close-ups of engineering',
        palette: 'deep metallic blacks, chrome silver, racing red accents, midnight blue, polished carbon fiber textures',
        emphasis: 'focus on precision, engineering detail, clean lines, and power. Show tools and machinery as objects of beauty. Avoid generic car wash or parking lot shots.',
    },
    TECH_FINANCE_B2B: {
        aesthetic: 'premium 3D abstract render, sleek futuristic minimalism, geometric precision. NO photographs of people.',
        lighting: 'soft ambient global illumination with sharp specular highlights, subtle neon edge glow, volumetric light rays through glass',
        camera: 'studio 3D render with shallow depth of field, isometric or slight perspective angle, sharp focus on geometric forms',
        palette: 'deep navy midnight blue, electric cyan accents, frosted glass white, subtle purple gradients, metallic gold or silver highlights',
        emphasis: 'MUST be abstract or conceptual — floating 3D geometric shapes, glass spheres, interconnected nodes, data visualization aesthetics. ABSOLUTELY NO photos of people shaking hands, NO office meetings, NO laptops on desks. Think Apple keynote visuals or Stripe marketing renders.',
    },
    HEALTH_MEDICAL: {
        aesthetic: 'clean clinical photography with warmth, trustworthy and caring atmosphere, modern medical facility, human-centered healthcare',
        lighting: 'bright even lighting with soft shadows, clean white balance, warm undertones for a welcoming feel, natural light through large windows',
        camera: 'shot on 50mm f/2.0 lens, clean medium shots, balanced composition, slight shallow depth for a warm feel while keeping clarity',
        palette: 'clean whites, soft medical blues, gentle aqua teal, warm skin tones, touches of fresh green for vitality',
        emphasis: 'convey trust, cleanliness, and caring expertise. Focus on modern equipment, pristine environments, and professional care. Avoid cold or scary sterile hospital vibes. Think premium private clinic.',
    },
    FITNESS_SPORT: {
        aesthetic: 'high-energy sports photography, powerful and dynamic, peak athletic performance, motivational intensity',
        lighting: 'dramatic high-contrast directional light, sweat glistening highlights, dark moody gym atmosphere with accent light, volumetric haze',
        camera: 'shot on 70-200mm f/2.8 telephoto lens, frozen peak action, motion blur on extremities, tight crop on effort and power',
        palette: 'bold blacks, electric green or neon blue accents, deep charcoal, metallic gym textures, fire orange for energy',
        emphasis: 'capture raw energy, dedication, and transformation. Focus on equipment texture, heavy weights, ropes, movement. Avoid generic stock gym poses. Think Nike campaign photography.',
    },
    CREATIVE_ARTS: {
        aesthetic: 'artistic editorial photography, creative and expressive, studio atmosphere with authentic creative mess, moody and inspiring',
        lighting: 'dramatic chiaroscuro lighting, single strong key light with deep shadows, rim light on subject, practical lights visible in frame',
        camera: 'shot on 35mm f/1.4 lens, natural environmental portrait style, artistic composition, slight grain for film texture',
        palette: 'rich deep blacks, warm accent from practical lights, saturated color pops of the creative tools, earthy wood tones',
        emphasis: 'show the creative process: paint splatters, camera equipment, musical instruments, design tools. Must feel authentic and artisanal. Avoid sterile or corporate-looking creative spaces.',
    },
    REAL_ESTATE: {
        aesthetic: 'architectural photography, luxurious living spaces, aspirational lifestyle, magazine-cover interiors',
        lighting: 'golden hour exterior light, bright well-lit interiors with window light, twilight blue-hour for dramatic exterior shots',
        camera: 'shot on 16-35mm f/2.8 wide-angle tilt-shift lens, corrected vertical lines, symmetrical composition, deep focus throughout',
        palette: 'warm natural wood, creamy whites, sage greens, marble grays, brass gold hardware accents, sky blues',
        emphasis: 'showcase premium living spaces, stunning architectural details, curated interiors. Focus on scale, light, and livability. Avoid empty sterile rooms. Think Architectural Digest feature.',
    },
    EDUCATION_COACHING: {
        aesthetic: 'bright inspiring lifestyle photography, warm and empowering, personal growth atmosphere, approachable professionalism',
        lighting: 'bright natural daylight, warm golden tones, soft fill light, greenhouse / conservatory quality light',
        camera: 'shot on 50mm f/1.8 lens, medium shot with environmental context, clean background, warm and inviting framing',
        palette: 'warm whites, soft sage greens, natural wood, sunshine yellow accents, calm terracotta, fresh plant greens',
        emphasis: 'convey growth, transformation, and trust. Focus on organized inspiring spaces: books, notebooks, plants, whiteboards with concepts. Avoid classroom or lecture-hall clichés. Think premium co-working or coaching studio.',
    },
    RETAIL_ECOMMERCE: {
        aesthetic: 'premium product photography, commercial lifestyle shot, aspirational shopping experience, trend-forward styling',
        lighting: 'bright clean studio lighting, soft even shadows, high-key setups with subtle gradient backgrounds',
        camera: 'shot on 90mm f/2.8 macro lens for detail or 50mm for lifestyle, tack-sharp product focus, styled flat-lay or vignette composition',
        palette: 'bright whites, pastel accent colors, kraft paper naturals, pop of brand-appropriate vibrant color',
        emphasis: 'show products or shopping contexts as premium and desirable. Beautiful packaging, styled arrangements, unboxing aesthetic. Avoid cluttered messy displays. Think premium brand lookbook.',
    },
    NATURE_AGRICULTURE: {
        aesthetic: 'epic landscape and nature photography, breathtaking vistas, authentic farm-to-table storytelling, connection to the land',
        lighting: 'golden hour magic-hour sunlight, dramatic cloud formations, warm sun beams through foliage, misty morning atmosphere',
        camera: 'shot on 16-35mm f/4 wide-angle lens for landscapes, or 85mm for intimate detail, deep focus, polarized sky',
        palette: 'lush forest greens, golden wheat, sky blues, rich earth browns, sunset oranges, morning mist grays',
        emphasis: 'capture the beauty of nature and sustainable farming. Rolling fields, fresh produce close-ups, rustic farm buildings. Avoid overly processed HDR. Think National Geographic or Kinfolk magazine.',
    },
    DEFAULT: {
        aesthetic: 'premium editorial photography, clean modern composition, professional and trustworthy, versatile business aesthetic',
        lighting: 'soft studio lighting with gentle shadows, clean and bright, slightly warm color temperature',
        camera: 'shot on 50mm f/2.0 lens, clean balanced composition, moderate depth of field, professional framing',
        palette: 'clean neutrals, modern gray tones, subtle blue or green accents, warm highlights',
        emphasis: 'professional quality that works for any business context. Clean, modern, and polished. Focus on quality and trust.',
    },
};

// ─── Strict Global Rules (apply to ALL prompts) ──────────────────────────────

const STRICT_RULES = [
    'Absolutely NO typography, NO words, NO letters, NO text, NO numbers, NO watermarks, NO logos, NO UI elements, NO overlays anywhere in the image.',
    'Clean composition with generous negative space on one side, perfectly framed for a website hero/cover background with room for text overlay.',
    'Avoid cheap stock photography clichés — must look like a high-end editorial shot or premium 3D render.',
    'No awkward poses, no forced smiles, no people staring directly at camera unless intentionally artistic.',
    'Ultra high quality, 8K detail, professional retouching, magazine-ready output.',
].join(' ');

// ─── Core Logic ──────────────────────────────────────────────────────────────

/**
 * Detect the visual category from industry text.
 * Matches against Croatian and English keywords.
 */
export function detectVisualCategory(industry: string): VisualCategory {
    const text = industry.toLowerCase();

    for (const matcher of INDUSTRY_MATCHERS) {
        if (matcher.keywords.some(kw => text.includes(kw))) {
            return matcher.category;
        }
    }

    return 'DEFAULT';
}

/**
 * Generate a production-quality image prompt for a blog cover image.
 *
 * @param subject    - The blog post title or topic (e.g. "Kada zamijeniti bateriju na iPhoneu")
 * @param industry   - Industry keywords from the project (e.g. "Frizerski salon", "IT servis")
 * @param businessContext - Optional business description for extra relevance
 * @returns A highly detailed image generation prompt
 */
export function generateBlogImagePrompt(
    subject: string,
    industry: string,
    businessContext?: string
): string {
    const category = detectVisualCategory(industry);
    const style = CATEGORY_STYLES[category];

    // Build a concise scene description from the subject
    const sceneContext = businessContext
        ? `for a business in the ${industry} industry (${businessContext})`
        : `for a ${industry} business`;

    const parts = [
        // 1. Core scene — what the image depicts
        `Create a stunning, high-end blog cover image visually inspired by the topic: "${subject}", ${sceneContext}.`,

        // 2. Aesthetic direction
        `Visual style: ${style.aesthetic}.`,

        // 3. Lighting
        `Lighting: ${style.lighting}.`,

        // 4. Camera & composition
        `Technical: ${style.camera}.`,

        // 5. Color palette
        `Color palette: ${style.palette}.`,

        // 6. Category-specific emphasis
        style.emphasis,

        // 7. Format
        'Wide 16:9 landscape format, optimized as a website hero banner.',

        // 8. Strict global rules
        STRICT_RULES,
    ];

    return parts.join(' ');
}
