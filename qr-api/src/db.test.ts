import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import {
    initDb,
    createProject,
    listProjects,
    getProject,
    updateProject,
    deleteProject,
} from './db.js';

const testEnv = {
    DB_PATH: ':memory:',
    UPLOADS_PATH: '/tmp',
    PORT: 8080,
    KUTT_BASE_URL: 'http://kutt:3000',
    SHORT_DOMAIN: 'https://mifi.me',
};

describe('db', () => {
    let db: Database.Database;

    beforeEach(() => {
        db = initDb(testEnv as Parameters<typeof initDb>[0]);
    });

    it('creates and gets a project', () => {
        const p = createProject(db, { name: 'Test', originalUrl: 'https://example.com' });
        expect(p.id).toBeDefined();
        expect(p.name).toBe('Test');
        expect(p.originalUrl).toBe('https://example.com');
        const got = getProject(db, p.id);
        expect(got?.name).toBe('Test');
    });

    it('lists projects by updatedAt desc', async () => {
        createProject(db, { name: 'A' });
        await new Promise((r) => setTimeout(r, 2));
        createProject(db, { name: 'B' });
        const list = listProjects(db);
        expect(list.length).toBe(2);
        expect(list[0].name).toBe('B');
        expect(list[1].name).toBe('A');
    });

    it('updates a project', () => {
        const p = createProject(db, { name: 'Old' });
        const updated = updateProject(db, p.id, { name: 'New', recipeJson: '{"x":1}' });
        expect(updated?.name).toBe('New');
        expect(updated?.recipeJson).toBe('{"x":1}');
    });

    it('deletes a project', () => {
        const p = createProject(db, { name: 'Del' });
        const deleted = deleteProject(db, p.id);
        expect(deleted).toBe(true);
        expect(getProject(db, p.id)).toBeNull();
    });

    it('returns null for missing project', () => {
        expect(getProject(db, '00000000-0000-0000-0000-000000000000')).toBeNull();
        expect(updateProject(db, '00000000-0000-0000-0000-000000000000', { name: 'X' })).toBeNull();
        expect(deleteProject(db, '00000000-0000-0000-0000-000000000000')).toBe(false);
    });
});
