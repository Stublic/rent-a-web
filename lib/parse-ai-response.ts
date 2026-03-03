/**
 * parse-ai-response.ts
 * Robust parser for AI editor JSON responses.
 * Handles common issues:
 * - Literal newlines inside JSON string values
 * - Markdown code block wrapping
 * - HTML-only fallback
 */

export interface AiEditResponse {
    html: string;
    summary: string;
    suggestion: string;
}

export function parseAiResponse(rawText: string): AiEditResponse | null {
    let text = rawText.trim();

    // Strip markdown code block if AI adds one
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    // --- Attempt 1: Direct JSON.parse ---
    try {
        const parsed = JSON.parse(text);
        if (parsed.html && typeof parsed.html === 'string') {
            return {
                html: parsed.html,
                summary: parsed.summary || '✅ Izmjena primijenjena.',
                suggestion: parsed.suggestion || '',
            };
        }
    } catch (_) {
        // Expected — literal newlines in JSON string break this
    }

    // --- Attempt 2: Extract fields manually using regex ---
    // This handles the case where AI returns JSON with literal newlines in the "html" value
    try {
        // Extract html field: find "html": " ... then match until the closing pattern "summary":
        // We look for "html" : "..." where the value has literal newlines
        const htmlFieldStart = text.indexOf('"html"');
        if (htmlFieldStart !== -1) {
            // Find the opening quote of the value
            const colonAfterHtml = text.indexOf(':', htmlFieldStart + 6);
            if (colonAfterHtml !== -1) {
                // Scan for opening quote
                let valueStart = -1;
                for (let i = colonAfterHtml + 1; i < text.length; i++) {
                    if (text[i] === '"') { valueStart = i + 1; break; }
                }

                if (valueStart !== -1) {
                    // Now find the end of the HTML value:
                    // Look for ",\n  "summary" or similar patterns that signal the next field
                    const summaryFieldPattern = /",?\s*"summary"\s*:/;
                    const summaryMatch = summaryFieldPattern.exec(text.substring(valueStart));

                    let htmlValue: string;
                    let remainingText: string;

                    if (summaryMatch) {
                        htmlValue = text.substring(valueStart, valueStart + summaryMatch.index);
                        remainingText = text.substring(valueStart + summaryMatch.index);
                    } else {
                        // No summary field — try to find end of JSON object
                        // Look for the last } and work backwards
                        const lastBrace = text.lastIndexOf('}');
                        if (lastBrace > valueStart) {
                            // Find the closing quote before the brace
                            let endQuote = lastBrace;
                            for (let i = lastBrace - 1; i > valueStart; i--) {
                                if (text[i] === '"' && text[i - 1] !== '\\') { endQuote = i; break; }
                            }
                            htmlValue = text.substring(valueStart, endQuote);
                        } else {
                            htmlValue = text.substring(valueStart);
                        }
                        remainingText = '';
                    }

                    // Unescape the HTML value (handle \\n, \\t, \\", etc.)
                    htmlValue = unescapeJsonString(htmlValue);

                    // Extract summary and suggestion from remaining text
                    let summary = '✅ Izmjena primijenjena.';
                    let suggestion = '';

                    if (remainingText) {
                        const summaryExtract = remainingText.match(/"summary"\s*:\s*"([^"]*)"/);
                        if (summaryExtract) summary = summaryExtract[1];

                        const suggestionExtract = remainingText.match(/"suggestion"\s*:\s*"([^"]*)"/);
                        if (suggestionExtract) suggestion = suggestionExtract[1];
                    }

                    if (htmlValue.includes('<!DOCTYPE') || htmlValue.includes('<html') || htmlValue.includes('<head')) {
                        return { html: htmlValue, summary, suggestion };
                    }
                }
            }
        }
    } catch (e) {
        console.warn('⚠️ Manual JSON field extraction failed:', e);
    }

    // --- Attempt 3: Extract raw HTML from response ---
    const htmlMatch = text.match(/<!DOCTYPE[\s\S]*<\/html>/i);
    if (htmlMatch) {
        let summary = '✅ Izmjena primijenjena.';
        const summaryComment = text.match(/<!-- EDIT_SUMMARY: (.+?) -->/);
        if (summaryComment) summary = summaryComment[1];
        return { html: htmlMatch[0], summary, suggestion: '' };
    }

    // --- Attempt 4: If the text itself looks like HTML ---
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        return { html: text, summary: '✅ Izmjena primijenjena.', suggestion: '' };
    }

    return null;
}

/**
 * Unescape JSON string escape sequences
 */
function unescapeJsonString(str: string): string {
    return str
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}
