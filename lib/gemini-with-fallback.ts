// Gemini model with automatic fallback and DB-configurable model names
// Uses streaming to avoid false timeouts on large generations.

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
        cachedModels = { primary: DEFAULT_PRIMARY, fallback: DEFAULT_FALLBACK };
    }

    cacheTimestamp = now;
    return cachedModels;
}

// ─── Streaming helper ────────────────────────────────────────────────

/**
 * Consume a Gemini stream with an inactivity timeout.
 * If no new chunk arrives within `inactivityMs`, rejects with 'AI timeout'.
 * This prevents killing a model that IS actively generating — only times out
 * when the model goes completely silent.
 */
async function consumeStreamWithTimeout(
    stream: AsyncIterable<any>,
    inactivityMs: number
): Promise<string> {
    const chunks: string[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = (reject: (e: Error) => void) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => reject(new Error('AI timeout')), inactivityMs);
    };

    return new Promise<string>((resolve, reject) => {
        resetTimer(reject);

        (async () => {
            try {
                for await (const chunk of stream) {
                    const text = chunk.text?.() || '';
                    if (text) {
                        chunks.push(text);
                        resetTimer(reject); // Model is alive — reset the clock
                    }
                }
                if (timer) clearTimeout(timer);

                if (chunks.length === 0) {
                    reject(new Error('AI returned empty response'));
                } else {
                    resolve(chunks.join(''));
                }
            } catch (err) {
                if (timer) clearTimeout(timer);
                reject(err);
            }
        })();
    });
}

// ─── Main generation function ────────────────────────────────────────

/**
 * Generate content with streaming + automatic fallback.
 *
 * - Uses `generateContentStream` instead of `generateContent`
 * - `inactivityMs` (default 120s) = max silence before timeout
 *   → Model actively generating will NEVER be killed
 *   → Only truly stuck/dead models get timed out
 * - Falls back to secondary model on 503, quota, or timeout
 */
export async function generateWithFallback(
    prompt: string | any[],
    options: {
        /** @deprecated Use inactivityMs instead. Kept for backwards compat — mapped to inactivityMs. */
        timeoutMs?: number;
        /** @deprecated Use fallbackInactivityMs instead. */
        fallbackTimeoutMs?: number;
        /** Max seconds of silence before timeout (default 120s). */
        inactivityMs?: number;
        /** Inactivity timeout for fallback model. */
        fallbackInactivityMs?: number;
        systemInstruction?: string;
    } = {}
): Promise<{ response: any; modelUsed: string; text: string }> {
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not configured');

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

    // Support both old timeoutMs and new inactivityMs
    const primaryInactivity = options.inactivityMs ?? options.timeoutMs ?? 120_000;
    const fallbackInactivity = options.fallbackInactivityMs ?? options.fallbackTimeoutMs ?? primaryInactivity;
    const inactivityTimeouts = [primaryInactivity, fallbackInactivity];

    const { systemInstruction } = options;
    const modelOptions: any = {};
    if (systemInstruction) modelOptions.systemInstruction = systemInstruction;

    const configured = await getConfiguredModels();
    const models = [configured.primary, configured.fallback];

    for (let i = 0; i < models.length; i++) {
        const modelName = models[i];
        const model = genAI.getGenerativeModel({ model: modelName, ...modelOptions });
        const inactivityMs = inactivityTimeouts[i];

        try {
            console.log(`🤖 Trying model: ${modelName} (inactivity timeout: ${Math.round(inactivityMs / 1000)}s)`);

            const streamResult = await model.generateContentStream(prompt);
            const text = await consumeStreamWithTimeout(streamResult.stream, inactivityMs);

            if (i > 0) {
                console.log(`⚠️ Used fallback model: ${modelName} (primary was unavailable)`);
            }
            console.log(`✅ Model ${modelName} generated ${text.length} chars`);

            // Build a response-like object for backward compatibility
            return {
                response: { text: () => text },
                modelUsed: modelName,
                text,
            };

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
                msg === 'AI timeout' ||
                msg === 'AI returned empty response';

            if (isRetryable && i < models.length - 1) {
                console.warn(`⚠️ Model ${modelName} failed (${msg.substring(0, 100)}), trying fallback...`);
                continue;
            }

            throw error;
        }
    }

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
