import type { Env } from './env.js';

export interface ShortenBody {
    targetUrl: string;
    customSlug?: string;
}

export interface ShortenResult {
    shortUrl: string;
}

export async function shortenUrl(
    env: Env,
    body: ShortenBody,
): Promise<ShortenResult> {
    if (!env.KUTT_API_KEY) {
        throw new Error('KUTT_API_KEY is not configured');
    }

    const base = env.KUTT_BASE_URL.replace(/\/$/, '');
    const apiKey = env.KUTT_API_KEY.trim();

    // Extract domain from SHORT_DOMAIN (e.g., "https://mifi.me" -> "mifi.me")
    const domain = env.SHORT_DOMAIN.replace(/^https?:\/\//, '').replace(
        /\/$/,
        '',
    );

    const res = await fetch(`${base}/api/v2/links`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
        },
        body: JSON.stringify({
            target: body.targetUrl,
            domain: domain,
            ...(body.customSlug && { customurl: body.customSlug }),
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Kutt API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { link?: string; id?: string };
    const link =
        data.link ??
        (data.id ? `${env.SHORT_DOMAIN.replace(/\/$/, '')}/${data.id}` : null);
    if (!link) {
        throw new Error('Kutt API did not return a short URL');
    }

    const shortUrl = link.startsWith('http')
        ? link
        : `${env.SHORT_DOMAIN.replace(/\/$/, '')}/${link.replace(/^\//, '')}`;
    return { shortUrl };
}
