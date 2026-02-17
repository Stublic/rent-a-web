import { z } from 'zod';

const ctaSchema = z.object({
    type: z.enum(['contact', 'phone', 'link', 'email', 'whatsapp']).default('contact'),
    label: z.string().optional().or(z.literal('')),
    url: z.string().optional().or(z.literal(''))
}).optional().default({ type: 'contact', label: '', url: '' });

export const contentSchema = z.object({
    // Basic Info
    businessName: z.string().min(2, "Ime biznisa mora imati bar 2 znaka"),
    industry: z.string().min(2, "Industrija je obavezna"),
    description: z.string().min(10, "Opis mora imati bar 10 znakova"),

    // Template & Style
    template: z.enum(['modern', 'professional', 'creative', 'minimal']).default('modern'),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Neispravan kod boje"),
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

    // SEO
    metaTitle: z.string().max(60, "Naslov ne smije biti duži od 60 znakova").optional().or(z.literal('')),
    metaDescription: z.string().max(160, "Opis ne smije biti duži od 160 znakova").optional().or(z.literal('')),
    metaKeywords: z.array(z.string()).optional().default([]),

    // Contact
    email: z.string().email("Neispravan email"),
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

    // Services (enhanced with CTA)
    services: z.array(z.object({
        name: z.string().min(1, "Naziv usluge je obavezan"),
        description: z.string().optional().or(z.literal('')),
        imageUrl: z.string().url().optional().or(z.literal('')),
        cta: ctaSchema
    })).min(1, "Bar jedna usluga je obavezna"),

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
