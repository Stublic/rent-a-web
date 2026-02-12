// Stock image APIs integration for Pexels and Unsplash

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface StockImage {
    url: string;
    photographer: string;
    source: 'pexels' | 'unsplash';
}

/**
 * Search for stock images on Pexels
 */
export async function searchPexels(query: string, perPage: number = 1): Promise<StockImage[]> {
    if (!PEXELS_API_KEY) {
        console.warn('Pexels API key not configured');
        return [];
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`);
        }

        const data = await response.json();

        return data.photos.map((photo: any) => ({
            url: photo.src.large,
            photographer: photo.photographer,
            source: 'pexels' as const
        }));
    } catch (error) {
        console.error('Pexels search failed:', error);
        return [];
    }
}

/**
 * Search for stock images on Unsplash
 */
export async function searchUnsplash(query: string, perPage: number = 1): Promise<StockImage[]> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn('Unsplash API key not configured');
        return [];
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = await response.json();

        return data.results.map((photo: any) => ({
            url: photo.urls.regular,
            photographer: photo.user.name,
            source: 'unsplash' as const
        }));
    } catch (error) {
        console.error('Unsplash search failed:', error);
        return [];
    }
}

/**
 * Search both Pexels and Unsplash, return first available result
 */
export async function searchStockImages(query: string): Promise<string | null> {
    // Try Pexels first
    const pexelsResults = await searchPexels(query, 1);
    if (pexelsResults.length > 0) {
        return pexelsResults[0].url;
    }

    // Fallback to Unsplash
    const unsplashResults = await searchUnsplash(query, 1);
    if (unsplashResults.length > 0) {
        return unsplashResults[0].url;
    }

    // Return placeholder if both fail
    return `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop`;
}

/**
 * Get industry-specific image queries
 */
export function getIndustryImageQueries(industry: string): {
    hero: string;
    about: string;
    features: string;
    services: string;
} {
    const industryMap: Record<string, any> = {
        'vodoinstalater': {
            hero: 'plumbing professional work',
            about: 'plumber tools equipment',
            features: 'modern bathroom renovation',
            services: 'plumbing services'
        },
        'restoran': {
            hero: 'restaurant interior elegant',
            about: 'chef cooking kitchen',
            features: 'fresh food ingredients',
            services: 'restaurant dining experience'
        },
        'odvjetnik': {
            hero: 'law office professional',
            about: 'lawyer consultation',
            features: 'legal books justice',
            services: 'legal services'
        },
        'frizerski salon': {
            hero: 'modern hair salon',
            about: 'hairdresser cutting hair',
            features: 'hair styling products',
            services: 'hair salon services'
        },
        'fitness': {
            hero: 'fitness gym modern',
            about: 'personal training',
            features: 'gym equipment',
            services: 'fitness training'
        }
    };

    const normalized = industry.toLowerCase();

    // Find matching industry or use generic
    const queries = industryMap[normalized] || {
        hero: `${industry} business professional`,
        about: `${industry} team work`,
        features: `${industry} modern`,
        services: `${industry} services`
    };

    return queries;
}
