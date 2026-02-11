import { z } from 'zod';

export const contentSchema = z.object({
    businessName: z.string().min(2, "Ime biznisa mora imati bar 2 znaka"),
    industry: z.string().min(2, "Industrija je obavezna"),
    description: z.string().min(10, "Opis mora imati bar 10 znakova"),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Neispravan kod boje"),
    logoUrl: z.string().url().optional().or(z.literal('')),
    heroImageUrl: z.string().url().optional().or(z.literal('')),
    email: z.string().email("Neispravan email"),
    phone: z.string().optional(),
    services: z.array(z.string()).min(1, "Bar jedna usluga je obavezna"),
});
