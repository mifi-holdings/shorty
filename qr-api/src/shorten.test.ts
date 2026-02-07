import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shortenUrl } from './shorten.js';

const env = {
    KUTT_API_KEY: 'test-key',
    KUTT_BASE_URL: 'http://kutt:3000',
    SHORT_DOMAIN: 'https://mifi.me',
    DB_PATH: '/data/db.sqlite',
    UPLOADS_PATH: '/uploads',
    PORT: 8080,
};

describe('shortenUrl', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('calls Kutt API and returns shortUrl', async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ link: 'https://mifi.me/abc' }),
        });
        const result = await shortenUrl(
            env as Parameters<typeof shortenUrl>[0],
            {
                targetUrl: 'https://example.com',
            },
        );
        expect(result.shortUrl).toBe('https://mifi.me/abc');
        expect(fetch).toHaveBeenCalledWith(
            'http://kutt:3000/api/v2/links',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'test-key',
                },
                body: JSON.stringify({
                    target: 'https://example.com',
                    domain: 'mifi.me',
                }),
            }),
        );
    });

    it('sends customurl when customSlug provided', async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ link: 'https://mifi.me/myslug' }),
        });
        await shortenUrl(env as Parameters<typeof shortenUrl>[0], {
            targetUrl: 'https://example.com',
            customSlug: 'myslug',
        });
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({
                    target: 'https://example.com',
                    domain: 'mifi.me',
                    customurl: 'myslug',
                }),
            }),
        );
    });

    it('throws when KUTT_API_KEY is missing', async () => {
        await expect(
            shortenUrl(
                { ...env, KUTT_API_KEY: undefined } as Parameters<
                    typeof shortenUrl
                >[0],
                {
                    targetUrl: 'https://example.com',
                },
            ),
        ).rejects.toThrow('KUTT_API_KEY');
    });

    it('throws when Kutt returns non-ok', async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: () => Promise.resolve('Bad request'),
        });
        await expect(
            shortenUrl(env as Parameters<typeof shortenUrl>[0], {
                targetUrl: 'https://example.com',
            }),
        ).rejects.toThrow(/400/);
    });

    it('uses id when link is missing and prepends SHORT_DOMAIN', async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 'xyz99' }),
        });
        const result = await shortenUrl(
            env as Parameters<typeof shortenUrl>[0],
            { targetUrl: 'https://example.com' },
        );
        expect(result.shortUrl).toBe('https://mifi.me/xyz99');
    });

    it('prepends SHORT_DOMAIN when link is relative', async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ link: '/abc' }),
        });
        const result = await shortenUrl(
            env as Parameters<typeof shortenUrl>[0],
            { targetUrl: 'https://example.com' },
        );
        expect(result.shortUrl).toBe('https://mifi.me/abc');
    });

    it('throws when Kutt returns no link or id', async () => {
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({}),
        });
        await expect(
            shortenUrl(env as Parameters<typeof shortenUrl>[0], {
                targetUrl: 'https://example.com',
            }),
        ).rejects.toThrow('Kutt API did not return a short URL');
    });
});
