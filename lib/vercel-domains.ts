// Vercel Domains API helper for multi-tenant custom domains

const VERCEL_API = 'https://api.vercel.com';

function getHeaders() {
    return {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

function getTeamQuery() {
    return process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
}

/**
 * Generate a URL-safe subdomain slug from a project name.
 * Croatian characters are transliterated, spaces become hyphens, etc.
 */
export function generateSubdomain(name: string): string {
    const charMap: Record<string, string> = {
        'č': 'c', 'ć': 'c', 'š': 's', 'ž': 'z', 'đ': 'dj',
        'Č': 'c', 'Ć': 'c', 'Š': 's', 'Ž': 'z', 'Đ': 'dj',
        'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
    };

    return name
        .split('')
        .map(c => charMap[c] || c)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '')       // Trim leading/trailing hyphens
        .substring(0, 63);             // DNS label max length
}

/**
 * Add a domain (subdomain or custom) to the Vercel project.
 */
export async function addDomainToVercel(domain: string) {
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamQuery = getTeamQuery();

    const response = await fetch(
        `${VERCEL_API}/v9/projects/${projectId}/domains${teamQuery}`,
        {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name: domain }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error('Failed to add domain to Vercel:', data);
        throw new Error(data.error?.message || `Failed to add domain: ${domain}`);
    }

    return data;
}

/**
 * Remove a domain from the Vercel project.
 */
export async function removeDomainFromVercel(domain: string) {
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamQuery = getTeamQuery();

    const response = await fetch(
        `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}${teamQuery}`,
        {
            method: 'DELETE',
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        const data = await response.json();
        console.error('Failed to remove domain from Vercel:', data);
        throw new Error(data.error?.message || `Failed to remove domain: ${domain}`);
    }

    return true;
}

/**
 * Get domain configuration/verification status from Vercel.
 */
export async function getDomainConfig(domain: string) {
    const teamQuery = getTeamQuery();

    const response = await fetch(
        `${VERCEL_API}/v6/domains/${domain}/config${teamQuery}`,
        {
            method: 'GET',
            headers: getHeaders(),
        }
    );

    return response.json();
}

/**
 * Verify a domain on the Vercel project.
 */
export async function verifyDomain(domain: string) {
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamQuery = getTeamQuery();

    const response = await fetch(
        `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}/verify${teamQuery}`,
        {
            method: 'POST',
            headers: getHeaders(),
        }
    );

    return response.json();
}
