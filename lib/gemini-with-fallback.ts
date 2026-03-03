// Gemini model with automatic fallback and DB-configurable model names

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const DEFAULT_PRIMARY = 'gemini-3.1-pro-preview';
const DEFAULT_FALLBACK = 'gemini-3-pro-preview';

// ─── In-memory model cache (refreshes every 60 s) ───────────────────
let cachedModels: { primary: string; fallback: string } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export function clearModelCache() {
    cachedModels = null;
    cacheTimestamp = 0;
}

async function getConfiguredModels(): Promise<{ primary: string; fallback: string }> {
    const now = Date.now();
    if (cachedModels && now - cacheTimestamp < CACHE_TTL_MS) {
        return cachedModels;
    }

    try {
        const rows = await prisma.systemConfig.findMany({
            where: { key: { in: ['aiPrimaryModel', 'aiFallbackModel'] } },
        });
        const map: Record<string, string> = {};
        for (const r of rows) map[r.key] = r.value;

        cachedModels = {
            primary: map.aiPrimaryModel || DEFAULT_PRIMARY,
            fallback: map.aiFallbackModel || DEFAULT_FALLBACK,
        };
    } catch {
        // DB unreachable — use defaults
        cachedModels = { primary: DEFAULT_PRIMARY, fallback: DEFAULT_FALLBACK };
    }

    cacheTimestamp = now;
    return cachedModels;
}

/**
 * Try generating content with the primary model, fall back to a secondary model
 * on 503 Service Unavailable, quota errors, or timeout.
 */
export async function generateWithFallback(
    prompt: string | any[],
    options: {
        timeoutMs?: number;
        fallbackTimeoutMs?: number;
        systemInstruction?: string;
    } = {}
): Promise<{ response: any; modelUsed: string }> {
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not configured');

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const { timeoutMs = 120000, fallbackTimeoutMs, systemInstruction } = options;
    const timeouts = [timeoutMs, fallbackTimeoutMs ?? timeoutMs];

    const modelOptions: any = {};
    if (systemInstruction) modelOptions.systemInstruction = systemInstruction;

    const configured = await getConfiguredModels();
    const models = [configured.primary, configured.fallback];

    for (let i = 0; i < models.length; i++) {
        const modelName = models[i];
        const model = genAI.getGenerativeModel({ model: modelName, ...modelOptions });

        const currentTimeout = timeouts[i];
        try {
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('AI timeout')), currentTimeout)
                )
            ]);

            const response = await (result as any).response;
            if (i > 0) {
                console.log(`⚠️ Used fallback model: ${modelName} (primary was unavailable)`);
            }
            return { response, modelUsed: modelName };

        } catch (error: any) {
            const msg = error.message || '';
            const isRetryable =
                msg.includes('503') ||
                msg.includes('Service Unavailable') ||
                msg.includes('overloaded') ||
                msg.includes('high demand') ||
                msg.includes('quota') ||
                msg.includes('rate limit') ||
                msg.includes('RESOURCE_EXHAUSTED') ||
                msg === 'AI timeout';

            if (isRetryable && i < models.length - 1) {
                console.warn(`⚠️ Model ${modelName} failed (${msg.substring(0, 80)}), trying fallback...`);
                continue;
            }

            // Last model or non-retryable error — rethrow
            throw error;
        }
    }

    // Should not reach here
    throw new Error('All models failed');
}

/**
 * Get a Gemini model instance. For use in chat-based flows (startChat).
 * Returns primary model by default; call with fallback=true to get the fallback model.
 */
export async function getModel(useFallback = false) {
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not configured');
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const configured = await getConfiguredModels();
    const modelName = useFallback ? configured.fallback : configured.primary;
    return { model: genAI.getGenerativeModel({ model: modelName }), modelName };
}

// Re-export defaults for reference
export { DEFAULT_PRIMARY as PRIMARY_MODEL, DEFAULT_FALLBACK as FALLBACK_MODEL };
