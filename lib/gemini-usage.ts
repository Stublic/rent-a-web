import { prisma } from './prisma';

// Pricing per 1M tokens (in USD)
// Update these if models change or prices update.
const PRICING = {
    'gemini-3-flash-preview': { input: 0.075, output: 0.30 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.0-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 3.50, output: 10.50 },
    'gemini-3.1-pro-preview': { input: 1.25, output: 10.00 },
    'gemini-3-pro-image-preview': { image: 0.03 },
};

/**
 * Log Gemini API usage to the database.
 * Does not block the main request (fire and forget).
 */
export async function logGeminiUsage({
    type,
    model,
    tokensInput = 0,
    tokensOutput = 0,
    isImage = false,
}: {
    type: string;
    model: string;
    tokensInput?: number;
    tokensOutput?: number;
    isImage?: boolean;
}) {
    try {
        let cost = 0;

        // Match the model or default to flash if not found
        const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gemini-1.5-flash'];

        if (isImage) {
            cost = 'image' in pricing ? pricing.image : 0.03;
        } else {
            const inputPricing = 'input' in pricing ? pricing.input : 0;
            const outputPricing = 'output' in pricing ? pricing.output : 0;
            const inputCost = (tokensInput / 1_000_000) * inputPricing;
            const outputCost = (tokensOutput / 1_000_000) * outputPricing;
            cost = inputCost + outputCost;
        }

        // Await the write — fire-and-forget doesn't work in Next.js because
        // the request context is closed before the unawaited Promise resolves.
        await prisma.geminiUsage.create({
            data: {
                type,
                model,
                tokensInput,
                tokensOutput,
                cost,
            }
        });

    } catch (err) {
        console.error('Failed to log Gemini usage:', err);
    }
}
