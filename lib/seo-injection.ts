/**
 * SEO Injection Utility
 * ---------------------
 * Deterministically injects SEO metadata into every served page at serve-time.
 * Covers: JSON-LD LocalBusiness schema, canonical URL, Open Graph, Twitter Cards.
 */

// ─── Industry → schema.org type mapping ─────────────────────────────
const INDUSTRY_SCHEMA_MAP: Record<string, string> = {
    restoran: 'Restaurant',
    pizzeria: 'Restaurant',
    bistro: 'Restaurant',
    konoba: 'Restaurant',
    kafić: 'CafeOrCoffeeShop',
    caffe: 'CafeOrCoffeeShop',
    bar: 'BarOrPub',
    pub: 'BarOrPub',
    slastičarna: 'Bakery',
    catering: 'FoodService',
    vodoinstalater: 'Plumber',
    električar: 'Electrician',
    majstor: 'HomeAndConstructionBusiness',
    keramičar: 'HomeAndConstructionBusiness',
    soboslikar: 'HomeAndConstructionBusiness',
    stolar: 'HomeAndConstructionBusiness',
    bravar: 'HomeAndConstructionBusiness',
    klima: 'HVACBusiness',
    frizer: 'HairSalon',
    'frizerski salon': 'HairSalon',
    salon: 'BeautySalon',
    kozmetičar: 'BeautySalon',
    spa: 'DaySpa',
    wellness: 'HealthAndBeautyBusiness',
    masaža: 'DaySpa',
    odvjetnik: 'LegalService',
    'javni bilježnik': 'Notary',
    stomatolog: 'Dentist',
    zubar: 'Dentist',
    doktor: 'Physician',
    poliklinika: 'MedicalClinic',
    ordinacija: 'MedicalClinic',
    klinika: 'MedicalClinic',
    psiholog: 'MedicalBusiness',
    fizioterapeut: 'MedicalBusiness',
    veterinar: 'VeterinaryCare',
    ljekarna: 'Pharmacy',
    optičar: 'Optician',
    teretana: 'ExerciseGym',
    fitness: 'ExerciseGym',
    gym: 'ExerciseGym',
    yoga: 'ExerciseGym',
    pilates: 'ExerciseGym',
    crossfit: 'ExerciseGym',
    fotograf: 'Photographer',
    hotel: 'Hotel',
    hostel: 'Hostel',
    apartman: 'LodgingBusiness',
    smještaj: 'LodgingBusiness',
    'kuća za odmor': 'LodgingBusiness',
    kamp: 'Campground',
    turizam: 'TouristInformationCenter',
    autoservis: 'AutoRepair',
    'auto servis': 'AutoRepair',
    mehaničar: 'AutoRepair',
    vulkanizer: 'TireShop',
    autopraonici: 'AutoWash',
    autopraonica: 'AutoWash',
    'rent a car': 'AutoRental',
    autoškola: 'DrivingSchool',
    škola: 'EducationalOrganization',
    edukacija: 'EducationalOrganization',
    tečaj: 'EducationalOrganization',
    akademija: 'EducationalOrganization',
    nekretnine: 'RealEstateAgent',
    'agencija za nekretnine': 'RealEstateAgent',
    knjigovodstvo: 'AccountingService',
    konzalting: 'ProfessionalService',
    marketing: 'ProfessionalService',
    agencija: 'ProfessionalService',
    prevodioc: 'ProfessionalService',
    prijevod: 'ProfessionalService',
};

/**
 * Map user industry input to a schema.org type.
 */
function getSchemaOrgType(industry: string): string {
    const normalized = (industry || '').toLowerCase().trim();

    // Direct match
    if (INDUSTRY_SCHEMA_MAP[normalized]) return INDUSTRY_SCHEMA_MAP[normalized];

    // Fuzzy match — check if industry contains any keyword
    for (const [keyword, schemaType] of Object.entries(INDUSTRY_SCHEMA_MAP)) {
        if (normalized.includes(keyword) || keyword.includes(normalized)) {
            return schemaType;
        }
    }

    return 'LocalBusiness';
}

// ─── Working hours → schema.org openingHoursSpecification ───────────
const DAY_MAP: Record<string, string> = {
    ponedjeljak: 'Monday',
    utorak: 'Tuesday',
    srijeda: 'Wednesday',
    četvrtak: 'Thursday',
    petak: 'Friday',
    subota: 'Saturday',
    nedjelja: 'Sunday',
    pon: 'Monday',
    uto: 'Tuesday',
    sri: 'Wednesday',
    čet: 'Thursday',
    pet: 'Friday',
    sub: 'Saturday',
    ned: 'Sunday',
};

function mapDayToEnglish(day: string): string {
    const normalized = day.toLowerCase().trim();
    return DAY_MAP[normalized] || normalized;
}

interface WorkingHour {
    day: string;
    from?: string;
    to?: string;
    closed?: boolean;
}

interface OpeningHoursSpec {
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string;
    opens: string;
    closes: string;
}

function buildOpeningHours(hours: WorkingHour[]): OpeningHoursSpec[] {
    return hours
        .filter(h => !h.closed && h.from && h.to)
        .map(h => ({
            '@type': 'OpeningHoursSpecification' as const,
            dayOfWeek: mapDayToEnglish(h.day),
            opens: h.from!,
            closes: h.to!,
        }));
}

// ─── Main functions ─────────────────────────────────────────────────

interface ProjectData {
    contentData?: any;
    name?: string;
}

/**
 * Build a LocalBusiness JSON-LD object from project contentData.
 */
export function buildLocalBusinessJsonLd(
    project: ProjectData,
    domain: string,
): Record<string, any> | null {
    const data = project.contentData || {};
    const businessName = data.businessName || project.name;
    if (!businessName) return null;

    const baseUrl = `https://${domain}`;
    const schemaType = getSchemaOrgType(data.industry || '');

    const schema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: businessName,
        url: baseUrl,
    };

    // Description
    if (data.description) {
        schema.description = data.description;
    }

    // Contact
    if (data.phone) {
        schema.telephone = data.phone;
    }
    if (data.email) {
        schema.email = data.email;
    }

    // Address
    if (data.address) {
        schema.address = {
            '@type': 'PostalAddress',
            streetAddress: data.address,
            addressCountry: 'HR',
        };
    }

    // Logo
    if (data.logoUrl) {
        schema.logo = data.logoUrl;
        schema.image = data.logoUrl;
    } else if (data.heroImageUrl) {
        schema.image = data.heroImageUrl;
    }

    // Working hours
    const workingHours = data.workingHours as WorkingHour[] | undefined;
    if (workingHours && workingHours.length > 0) {
        const specs = buildOpeningHours(workingHours);
        if (specs.length > 0) {
            schema.openingHoursSpecification = specs;
        }
    }

    // Social / sameAs
    const social = data.socialLinks || {};
    const sameAs: string[] = [];
    if (social.facebook) sameAs.push(social.facebook);
    if (social.instagram) sameAs.push(social.instagram);
    if (social.linkedin) sameAs.push(social.linkedin);
    if (social.twitter) sameAs.push(social.twitter);
    if (sameAs.length > 0) schema.sameAs = sameAs;

    // Price range (generic for local business)
    schema.priceRange = '$$';

    return schema;
}

/**
 * Build SEO meta tags string (OG, Twitter, canonical, robots).
 */
export function buildSeoHeadTags(
    project: ProjectData,
    domain: string,
    pageKey: string = 'home',
): string {
    const data = project.contentData || {};
    const seoSettings = data.seoSettings || {};
    const pageSeo = seoSettings.pages?.[pageKey] || {};

    const businessName = data.businessName || project.name || '';
    const baseUrl = `https://${domain}`;

    // Resolve page path
    const pagePath = pageKey === 'home' ? '' : `/${pageKey}`;
    const pageUrl = `${baseUrl}${pagePath}`;

    // Title: manual SEO title > AI-generated <title> (handled separately) > fallback
    const title = pageSeo.title || data.metaTitle || businessName;
    // Description: manual SEO desc > AI-generated > fallback
    const description = pageSeo.description || data.metaDescription || data.description || '';
    // Image: manual OG image > logo > hero image
    const image = pageSeo.ogImage || data.logoUrl || data.heroImageUrl || '';

    const tags: string[] = [];

    // Canonical URL
    tags.push(`<link rel="canonical" href="${pageUrl}" />`);

    // Robots
    tags.push(`<meta name="robots" content="index, follow" />`);

    // Open Graph
    tags.push(`<meta property="og:type" content="website" />`);
    tags.push(`<meta property="og:locale" content="hr_HR" />`);
    tags.push(`<meta property="og:site_name" content="${escapeAttr(businessName)}" />`);
    tags.push(`<meta property="og:title" content="${escapeAttr(title)}" />`);
    if (description) {
        tags.push(`<meta property="og:description" content="${escapeAttr(truncate(description, 160))}" />`);
    }
    tags.push(`<meta property="og:url" content="${pageUrl}" />`);
    if (image) {
        tags.push(`<meta property="og:image" content="${image}" />`);
    }

    // Twitter Card
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
    tags.push(`<meta name="twitter:title" content="${escapeAttr(title)}" />`);
    if (description) {
        tags.push(`<meta name="twitter:description" content="${escapeAttr(truncate(description, 160))}" />`);
    }
    if (image) {
        tags.push(`<meta name="twitter:image" content="${image}" />`);
    }

    return tags.join('\n    ');
}

/**
 * Master function: inject JSON-LD + SEO meta tags into HTML <head>.
 * Deduplicates tags that may already exist from AI generation.
 */
export function injectSeoHead(
    html: string,
    project: ProjectData,
    domain: string,
    pageKey: string = 'home',
): string {
    // 1. Build JSON-LD
    const jsonLd = buildLocalBusinessJsonLd(project, domain);
    let jsonLdScript = '';
    if (jsonLd && !html.includes('application/ld+json')) {
        jsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`;
    }

    // 2. Build meta tags
    const seoTags = buildSeoHeadTags(project, domain, pageKey);

    // 3. Remove any existing duplicates from AI-generated HTML
    let cleaned = html;
    // Remove existing canonical (we'll inject a correct one)
    cleaned = cleaned.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
    // Remove existing OG tags (we'll inject correct ones)
    cleaned = cleaned.replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '');
    cleaned = cleaned.replace(/<meta\s+content="[^"]*"\s+property="og:[^"]*"\s*\/?>/gi, '');
    // Remove existing Twitter tags
    cleaned = cleaned.replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '');
    cleaned = cleaned.replace(/<meta\s+content="[^"]*"\s+name="twitter:[^"]*"\s*\/?>/gi, '');
    // Remove existing robots
    cleaned = cleaned.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/gi, '');

    // 4. Ensure <html lang="hr">
    if (cleaned.match(/<html[^>]*>/i)) {
        cleaned = cleaned.replace(/<html([^>]*)>/i, (match, attrs) => {
            if (/lang=/i.test(attrs)) {
                return match.replace(/lang="[^"]*"/i, 'lang="hr"');
            }
            return `<html lang="hr"${attrs}>`;
        });
    }

    // 5. Inject into <head>
    const injection = `\n    <!-- SEO Injection by Rent a webica -->\n    ${seoTags}\n    ${jsonLdScript}\n    <!-- End SEO Injection -->`;

    if (cleaned.includes('</head>')) {
        cleaned = cleaned.replace('</head>', injection + '\n</head>');
    }

    return cleaned;
}

// ─── Helpers ────────────────────────────────────────────────────────

function escapeAttr(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3).trimEnd() + '...';
}
