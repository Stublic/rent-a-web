// Industry-specific template prompts for website generation

export type TemplateStyle = 'modern' | 'professional' | 'creative' | 'minimal';

interface TemplateConfig {
    colorScheme: string;
    typography: string;
    layout: string;
    animations: string;
    designNotes: string;
}

export const templates: Record<TemplateStyle, TemplateConfig> = {
    modern: {
        colorScheme: "Bold gradients, vibrant accent colors, dark mode friendly",
        typography: "Sans-serif fonts (Inter, Poppins), clean hierarchy",
        layout: "Grid-based, asymmetric sections, full-width hero",
        animations: "Smooth parallax, fade-in on scroll, hover effects",
        designNotes: "Use glassmorphism, subtle shadows, rounded corners"
    },
    professional: {
        colorScheme: "Navy, gold, white - classic and trustworthy",
        typography: "Serif headings (Playfair), sans-serif body (Roboto)",
        layout: "Centered content, symmetric sections, traditional grid",
        animations: "Subtle fade-ins, minimal movement, professional feel",
        designNotes: "Clean lines, spacious whitespace, elegant and corporate"
    },
    creative: {
        colorScheme: "Bright colors, unexpected combinations, playful",
        typography: "Unique fonts, varied sizes, creative hierarchy",
        layout: "Asymmetric, overlapping sections, artistic flair",
        animations: "Bold transitions, interactive elements, dynamic",
        designNotes: "Break conventions, artistic layouts, eye-catching"
    },
    minimal: {
        colorScheme: "Monochrome with one accent color, lots of white space",
        typography: "Simple sans-serif (Helvetica, Arial), minimal sizes",
        layout: "Clean grid, lots of breathing room, simple structure",
        animations: "Minimal or none, focus on content",
        designNotes: "Less is more, clean lines, maximum readability"
    }
};

export const industryStyles: Record<string, TemplateStyle> = {
    'vodoinstalater': 'professional',
    'plumber': 'professional',
    'restoran': 'creative',
    'restaurant': 'creative',
    'odvjetnik': 'professional',
    'lawyer': 'professional',
    'frizerski salon': 'modern',
    'hair salon': 'modern',
    'fitness': 'modern',
    'gym': 'modern',
    'web dizajn': 'creative',
    'web design': 'creative',
    'consulting': 'professional',
    'konzultacije': 'professional',
    'marketing': 'creative',
    'fotografija': 'minimal',
    'photography': 'minimal',
};

export function getRecommendedTemplate(industry: string): TemplateStyle {
    const normalized = industry.toLowerCase();
    return industryStyles[normalized] || 'modern';
}

export function getTemplatePrompt(template: TemplateStyle, industry: string): string {
    const config = templates[template];

    return `
**DESIGN TEMPLATE: ${template.toUpperCase()}**
- Color Scheme: ${config.colorScheme}
- Typography: ${config.typography}
- Layout Style: ${config.layout}
- Animations: ${config.animations}
- Design Notes: ${config.designNotes}

Apply this design template to create a cohesive, ${template} website for a ${industry} business.
`;
}
