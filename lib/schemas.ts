import { z } from 'zod';

// Croatian field name mapping for user-friendly error messages
const FIELD_LABELS: Record<string, string> = {
    businessName: 'Ime biznisa',
    industry: 'Industrija',
    description: 'Opis',
    email: 'Email',
    phone: 'Telefon',
    primaryColor: 'Primarna boja',
    secondaryColor: 'Sekundarna boja',
    backgroundColor: 'Boja pozadine',
    textColor: 'Boja teksta',
    metaTitle: 'Meta naslov',
    metaDescription: 'Meta opis',
    services: 'Usluge',
    heroCta: 'CTA gumb',
    logoUrl: 'Logo',
    heroImageUrl: 'Hero slika',
};

/** Convert Zod validation errors into a specific Croatian error message */
export function formatValidationErrors(error: z.ZodError): string {
    const fieldErrors = error.flatten().fieldErrors;
    const issues: string[] = [];

    // Fields that are optional — skip their errors
    const SKIP_FIELDS = new Set(['heroCta', 'services', 'styleKey', 'template', 'autoColors', 'seoSettings']);

    for (const [field, msgs] of Object.entries(fieldErrors)) {
        if (SKIP_FIELDS.has(field)) continue;
        const messages = msgs as string[] | undefined;
        if (messages && messages.length > 0) {
            const label = FIELD_LABELS[field] || field;
            const msg = messages[0];
            // Only show Croatian custom messages, skip English Zod defaults
            if (msg && !/^(Invalid|Expected|Required|String|Number)/.test(msg)) {
                issues.push(`${label}: ${msg}`);
            } else {
                issues.push(`${label} je obavezno polje`);
            }
        }
    }

    if (issues.length === 0) return 'Molimo ispunite sva obavezna polja.';
    return issues.join('\n');
}

const ctaObjectSchema = z.object({
    type: z.enum(['contact', 'phone', 'link', 'email', 'whatsapp']).default('contact'),
    label: z.string().optional().or(z.literal('')),
    url: z.string().optional().or(z.literal(''))
});

// Preprocess: convert null, undefined, or empty objects to null
const ctaSchema = z.preprocess(
    (val) => {
        if (!val || typeof val !== 'object') return null;
        const v = val as any;
        if (!v.type && !v.label && !v.url) return null;
        return val;
    },
    ctaObjectSchema.nullable().optional().default(null)
);

export const contentSchema = z.object({
    // Basic Info
    businessName: z.string().min(2, "Ime biznisa mora imati barem 2 znaka"),
    industry: z.string().min(2, "Odaberite industriju"),
    description: z.string().min(10, "Opis mora imati barem 10 znakova"),

    // Template & Style
    template: z.enum(['modern', 'professional', 'creative', 'minimal']).default('modern'),
    styleKey: z.string().optional().or(z.literal('')).or(z.null()),
    autoColors: z.boolean().optional().default(true),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Neispravan kod boje").optional().or(z.literal('')),
    secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional().or(z.literal('')),
    backgroundColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional().or(z.literal('')),
    textColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional().or(z.literal('')),

    // Hero CTA
    heroCta: ctaSchema,

    // Brand Assets
    logoUrl: z.string().url().optional().or(z.literal('')),
    heroImageUrl: z.string().url().optional().or(z.literal('')),

    // Section Images
    aboutImageUrl: z.string().url().optional().or(z.literal('')),
    featuresImageUrl: z.string().url().optional().or(z.literal('')),
    servicesBackgroundUrl: z.string().url().optional().or(z.literal('')),

    // Design Reference (optional user URL for inspiration)
    designReferenceUrl: z.string().url().optional().or(z.literal('')),

    // SEO — now managed in Settings tab, kept here for backward compatibility
    metaTitle: z.string().max(60).optional().or(z.literal('')),
    metaDescription: z.string().max(160).optional().or(z.literal('')),
    metaKeywords: z.array(z.string()).optional().default([]),
    seoSettings: z.any().optional(),

    // Contact
    email: z.string().email("Unesite ispravan email"),
    phone: z.string().optional(),
    address: z.string().optional().or(z.literal('')),
    mapEmbed: z.string().optional().or(z.literal('')),

    // Working Hours
    workingHours: z.array(z.object({
        day: z.string(),
        from: z.string().optional().or(z.literal('')),
        to: z.string().optional().or(z.literal('')),
        closed: z.boolean().default(false)
    })).optional().default([]),

    // Services (optional)
    services: z.array(z.object({
        name: z.string().optional().or(z.literal('')),
        description: z.string().optional().or(z.literal('')),
        imageUrl: z.string().url().optional().or(z.literal('')),
        cta: ctaSchema
    })).optional().default([]),

    // Testimonials
    testimonials: z.array(z.object({
        name: z.string().min(1, "Ime je obavezno"),
        text: z.string().min(1, "Tekst je obavezan"),
        role: z.string().optional().or(z.literal('')),
        rating: z.number().min(1).max(5).default(5),
        imageUrl: z.string().url().optional().or(z.literal(''))
    })).optional().default([]),

    // FAQ
    faq: z.array(z.object({
        question: z.string().min(1, "Pitanje je obavezno"),
        answer: z.string().min(1, "Odgovor je obavezan")
    })).optional().default([]),

    // Gallery
    gallery: z.array(z.object({
        imageUrl: z.string().url(),
        caption: z.string().optional().or(z.literal(''))
    })).optional().default([]),

    // Pricing
    pricing: z.array(z.object({
        name: z.string().min(1, "Naziv je obavezan"),
        price: z.string().min(1, "Cijena je obavezna"),
        description: z.string().optional().or(z.literal('')),
        features: z.array(z.string()).optional().default([]),
        highlighted: z.boolean().default(false)
    })).optional().default([]),

    // Social Links
    socialLinks: z.object({
        facebook: z.string().url().optional().or(z.literal('')),
        instagram: z.string().url().optional().or(z.literal('')),
        linkedin: z.string().url().optional().or(z.literal('')),
        twitter: z.string().url().optional().or(z.literal(''))
    }).optional().default({
        facebook: '',
        instagram: '',
        linkedin: '',
        twitter: ''
    }),
});
