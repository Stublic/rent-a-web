/**
 * quality-check.ts
 * 
 * Post-generation validation for React websites.
 * Checks quality signals and returns warnings (non-blocking).
 */

interface QualityReport {
    warnings: string[];
    score: number; // 0-100
}

/**
 * Validate the quality of generated React pages.
 * Returns warnings (non-blocking) — these are logged, not shown to users.
 */
export function validateGeneratedQuality(
    files: Record<string, string>,
    expectedImageUrls: string[] = []
): QualityReport {
    const warnings: string[] = [];
    let score = 100;

    const requiredPages = ['pages/Home.jsx', 'pages/About.jsx', 'pages/Services.jsx', 'pages/Contact.jsx'];

    // 1. Check all required pages exist
    for (const page of requiredPages) {
        if (!files[page]) {
            warnings.push(`Missing required page: ${page}`);
            score -= 15;
        }
    }

    // 2. Check each page has substantial content (minimum imports + sections)
    for (const [path, content] of Object.entries(files)) {
        if (!path.startsWith('pages/')) continue;

        // Check for minimum section count (at least 2 Section components)
        const sectionCount = (content.match(/<Section/g) || []).length;
        if (sectionCount < 2) {
            warnings.push(`${path}: Only ${sectionCount} Section component(s). Expected at least 2.`);
            score -= 5;
        }

        // Check for React import
        if (!content.includes('import React')) {
            warnings.push(`${path}: Missing React import.`);
            score -= 5;
        }

        // Check for default export
        if (!content.includes('export default')) {
            warnings.push(`${path}: Missing default export.`);
            score -= 10;
        }

        // Check code length (too short = probably placeholder)
        if (content.length < 500) {
            warnings.push(`${path}: Very short content (${content.length} chars). May be a placeholder.`);
            score -= 10;
        }
    }

    // 3. Check Home page has key conversion sections
    const homePage = files['pages/Home.jsx'] || '';
    if (homePage) {
        // Check for hero section (Button + heading)
        if (!homePage.includes('Button') || !homePage.includes('<h1')) {
            warnings.push('Home page: Missing clear Hero section with heading and CTA button.');
            score -= 5;
        }

        // Check for multiple sections
        const homeSections = (homePage.match(/<Section/g) || []).length;
        if (homeSections < 4) {
            warnings.push(`Home page: Only ${homeSections} sections. A conversion-focused home should have 5-8.`);
            score -= 3;
        }
    }

    // 4. Check for Croatian text (look for Croatian-specific characters)
    const allContent = Object.values(files).join('\n');
    const hasCroatian = /[čćžšđČĆŽŠĐ]/.test(allContent);
    if (!hasCroatian) {
        warnings.push('No Croatian-specific characters found (č, ć, ž, š, đ). Content may not be in Croatian.');
        score -= 10;
    }

    // 5. Check image URLs are used (if provided)
    for (const imageUrl of expectedImageUrls) {
        if (imageUrl && !allContent.includes(imageUrl)) {
            warnings.push(`Provided image URL not used: ${imageUrl.substring(0, 60)}...`);
            score -= 2;
        }
    }

    // 6. Check Framer Motion usage
    const hasFramerMotion = allContent.includes('from "framer-motion"') || allContent.includes("from 'framer-motion'");
    if (!hasFramerMotion) {
        warnings.push('Framer Motion is not imported in any page. Animations may be missing.');
        score -= 5;
    }

    // 7. Check Contact page has ContactForm
    const contactPage = files['pages/Contact.jsx'] || '';
    if (contactPage && !contactPage.includes('ContactForm')) {
        warnings.push('Contact page: Missing ContactForm component.');
        score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    return { warnings, score };
}
