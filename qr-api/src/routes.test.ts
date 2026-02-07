import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { initDb } from './db.js';
import { createApp } from './app.js';

const testEnv = {
    DB_PATH: ':memory:',
    UPLOADS_PATH: path.join(os.tmpdir(), `qr-uploads-${Date.now()}`),
    PORT: 8080,
    KUTT_BASE_URL: 'http://kutt:3000',
    SHORT_DOMAIN: 'https://mifi.me',
    KUTT_API_KEY: undefined as string | undefined,
};

describe('app routes', () => {
    beforeEach(() => {
        if (fs.existsSync(testEnv.UPLOADS_PATH)) {
            fs.rmSync(testEnv.UPLOADS_PATH, { recursive: true });
        }
        fs.mkdirSync(testEnv.UPLOADS_PATH, { recursive: true });
    });

    const db = initDb(testEnv as Parameters<typeof initDb>[0]);
    const app = createApp(
        db,
        testEnv as Parameters<typeof createApp>[1],
        '/api',
    );

    it('GET /health returns ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('projects CRUD', async () => {
        const create = await request(app)
            .post('/projects')
            .send({ name: 'P1', originalUrl: 'https://a.com' });
        expect(create.status).toBe(201);
        expect(create.body.name).toBe('P1');
        const id = create.body.id;

        const get = await request(app).get(`/projects/${id}`);
        expect(get.status).toBe(200);
        expect(get.body.name).toBe('P1');
        expect(get.body.logoUrl).toBeNull();

        const list = await request(app).get('/projects');
        expect(list.status).toBe(200);
        expect(list.body).toHaveLength(1);

        const update = await request(app)
            .put(`/projects/${id}`)
            .send({ name: 'P2' });
        expect(update.status).toBe(200);
        expect(update.body.name).toBe('P2');

        const del = await request(app).delete(`/projects/${id}`);
        expect(del.status).toBe(204);
        const getAfter = await request(app).get(`/projects/${id}`);
        expect(getAfter.status).toBe(404);
    });

    it('projects validation', async () => {
        const bad = await request(app).post('/projects').send({ name: 123 });
        expect(bad.status).toBe(400);
        const noId = await request(app).get('/projects/not-a-uuid');
        expect(noId.status).toBe(400);
    });

    it('projects POST with logoFilename returns logoUrl', async () => {
        const create = await request(app)
            .post('/projects')
            .send({ name: 'WithLogo', logoFilename: 'logo.png' });
        expect(create.status).toBe(201);
        expect(create.body.logoUrl).toBe('/api/uploads/logo.png');
    });

    it('projects PUT with shortenEnabled false', async () => {
        const create = await request(app)
            .post('/projects')
            .send({ name: 'P', originalUrl: 'https://x.com' });
        const res = await request(app)
            .put(`/projects/${create.body.id}`)
            .send({ shortenEnabled: false });
        expect(res.status).toBe(200);
        expect(res.body.shortenEnabled).toBe(false);
    });

    it('projects PUT invalid body returns 400', async () => {
        const create = await request(app).post('/projects').send({ name: 'P' });
        const res = await request(app)
            .put(`/projects/${create.body.id}`)
            .send({ name: 123 });
        expect(res.status).toBe(400);
    });

    it('projects PUT 404 when project does not exist', async () => {
        const res = await request(app)
            .put('/projects/00000000-0000-0000-0000-000000000000')
            .send({ name: 'X' });
        expect(res.status).toBe(404);
    });

    it('projects DELETE 404 when project does not exist', async () => {
        const res = await request(app).delete(
            '/projects/00000000-0000-0000-0000-000000000000',
        );
        expect(res.status).toBe(404);
    });

    it('folders CRUD', async () => {
        const create = await request(app).post('/folders').send({ name: 'F1' });
        expect(create.status).toBe(201);
        expect(create.body.name).toBe('F1');
        const id = create.body.id;

        const get = await request(app).get(`/folders/${id}`);
        expect(get.status).toBe(200);

        const list = await request(app).get('/folders');
        expect(list.status).toBe(200);
        expect(list.body.length).toBeGreaterThanOrEqual(1);

        await request(app).put(`/folders/${id}`).send({ name: 'F2' });
        const del = await request(app).delete(`/folders/${id}`);
        expect(del.status).toBe(204);
    });

    it('folders validation', async () => {
        const noId = await request(app).get('/folders/not-a-uuid');
        expect(noId.status).toBe(400);
        const notFound = await request(app).get(
            '/folders/00000000-0000-0000-0000-000000000000',
        );
        expect(notFound.status).toBe(404);
    });

    it('folders POST invalid body returns 400', async () => {
        const res = await request(app).post('/folders').send({ name: 123 });
        expect(res.status).toBe(400);
    });

    it('folders PUT invalid id returns 400', async () => {
        const res = await request(app)
            .put('/folders/not-a-uuid')
            .send({ name: 'X' });
        expect(res.status).toBe(400);
    });

    it('folders PUT invalid body returns 400', async () => {
        const create = await request(app).post('/folders').send({ name: 'F' });
        const res = await request(app)
            .put(`/folders/${create.body.id}`)
            .send({ name: 999 });
        expect(res.status).toBe(400);
    });

    it('folders PUT 404 when folder does not exist', async () => {
        const res = await request(app)
            .put('/folders/00000000-0000-0000-0000-000000000000')
            .send({ name: 'X' });
        expect(res.status).toBe(404);
    });

    it('folders DELETE 404 when folder does not exist', async () => {
        const res = await request(app).delete(
            '/folders/00000000-0000-0000-0000-000000000000',
        );
        expect(res.status).toBe(404);
    });

    it('shorten returns 503 when KUTT_API_KEY missing', async () => {
        const res = await request(app)
            .post('/shorten')
            .send({ targetUrl: 'https://x.com' });
        expect(res.status).toBe(503);
    });

    it('shorten validates body', async () => {
        const res = await request(app).post('/shorten').send({});
        expect(res.status).toBe(400);
    });

    it('uploads/logo returns 400 when no file', async () => {
        const res = await request(app).post('/uploads/logo');
        expect(res.status).toBe(400);
    });

    it('uploads/:filename returns 400 for invalid filename', async () => {
        const res = await request(app).get('/uploads/..hidden');
        expect(res.status).toBe(400);
    });

    it('uploads/:filename returns 404 for missing file', async () => {
        const res = await request(app).get('/uploads/nonexistent.png');
        expect(res.status).toBe(404);
    });

    it('shorten returns 502 when Kutt returns no URL', async () => {
        vi.stubGlobal('fetch', vi.fn());
        const envWithKey = { ...testEnv, KUTT_API_KEY: 'key' };
        const appWithKey = createApp(
            db,
            envWithKey as Parameters<typeof createApp>[1],
        );
        (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({}),
        });
        const res = await request(appWithKey)
            .post('/shorten')
            .send({ targetUrl: 'https://x.com' });
        expect(res.status).toBe(502);
    });

    it('shorten returns 502 when fetch rejects with non-Error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce('network error'));
        const envWithKey = { ...testEnv, KUTT_API_KEY: 'key' };
        const appWithKey = createApp(
            db,
            envWithKey as Parameters<typeof createApp>[1],
        );
        const res = await request(appWithKey)
            .post('/shorten')
            .send({ targetUrl: 'https://x.com' });
        expect(res.status).toBe(502);
    });

    it('uploads/logo rejects non-image via error handler', async () => {
        const res = await request(app)
            .post('/uploads/logo')
            .attach('file', Buffer.from('fake pdf'), {
                filename: 'x.pdf',
                contentType: 'application/pdf',
            });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('image files');
    });

    it('uploads/logo accepts image and returns filename', async () => {
        const png = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ]); // PNG magic
        const res = await request(app)
            .post('/uploads/logo')
            .attach('file', png, {
                filename: 'logo.png',
                contentType: 'image/png',
            });
        expect(res.status).toBe(200);
        expect(res.body.filename).toBeDefined();
        expect(res.body.url).toContain(res.body.filename);
    });

    it('uploads/logo with no extension uses .bin', async () => {
        const png = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ]);
        const res = await request(app)
            .post('/uploads/logo')
            .attach('file', png, {
                filename: 'noext',
                contentType: 'image/png',
            });
        expect(res.status).toBe(200);
        expect(res.body.filename).toMatch(/\.bin$/);
    });

    it('uploads/:filename returns file when it exists', async () => {
        const png = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ]);
        const upload = await request(app)
            .post('/uploads/logo')
            .attach('file', png, {
                filename: 'logo.png',
                contentType: 'image/png',
            });
        const filename = upload.body.filename;
        const get = await request(app).get(`/uploads/${filename}`);
        expect(get.status).toBe(200);
    });

    it('uploads/:filename returns 400 for absolute path', async () => {
        const res = await request(app).get(
            '/uploads/' + encodeURIComponent('/etc/passwd'),
        );
        expect(res.status).toBe(400);
    });
});
