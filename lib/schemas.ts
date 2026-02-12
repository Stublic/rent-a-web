import { z } from 'zod';

export const contentSchema = z.object({
    // Basic Info
    businessName: z.string().min(2, "Ime biznisa mora imati bar 2 znaka"),
    industry: z.string().min(2, "Industrija je obavezna"),
    description: z.string().min(10, "Opis mora imati bar 10 znakova"),

    // Template & Style
    template: z.enum(['modern', 'professional', 'creative', 'minimal']).default('modern'),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Neispravan kod boje"),

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

    // Services (enhanced with descriptions and images)
    services: z.array(z.object({
        name: z.string().min(1, "Naziv usluge je obavezan"),
        description: z.string().optional().or(z.literal('')),
        imageUrl: z.string().url().optional().or(z.literal(''))
    })).min(1, "Bar jedna usluga je obavezna"),

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
