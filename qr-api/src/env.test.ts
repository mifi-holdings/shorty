import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns defaults when env is minimal', () => {
        process.env = {};
        const env = loadEnv();
        expect(env.PORT).toBe(8080);
        expect(env.DB_PATH).toBe('/data/db.sqlite');
        expect(env.UPLOADS_PATH).toBe('/uploads');
        expect(env.KUTT_BASE_URL).toBe('http://kutt:3000');
        expect(env.SHORT_DOMAIN).toBe('https://mifi.me');
        expect(env.KUTT_API_KEY).toBeUndefined();
    });

    it('parses PORT and overrides defaults', () => {
        process.env = { PORT: '3000', KUTT_BASE_URL: 'http://localhost:3000' };
        const env = loadEnv();
        expect(env.PORT).toBe(3000);
        expect(env.KUTT_BASE_URL).toBe('http://localhost:3000');
    });

    it('throws when env is invalid', () => {
        process.env = { KUTT_BASE_URL: 'not-a-url' };
        expect(() => loadEnv()).toThrow(/Invalid env/);
    });
});
