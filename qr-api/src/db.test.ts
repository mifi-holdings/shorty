import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import {
    initDb,
    createProject,
    listProjects,
    getProject,
    updateProject,
    deleteProject,
    listFolders,
    createFolder,
    getFolder,
    updateFolder,
    deleteFolder,
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
        const p = createProject(db, {
            name: 'Test',
            originalUrl: 'https://example.com',
        });
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
        const updated = updateProject(db, p.id, {
            name: 'New',
            recipeJson: '{"x":1}',
        });
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
        expect(
            getProject(db, '00000000-0000-0000-0000-000000000000'),
        ).toBeNull();
        expect(
            updateProject(db, '00000000-0000-0000-0000-000000000000', {
                name: 'X',
            }),
        ).toBeNull();
        expect(deleteProject(db, '00000000-0000-0000-0000-000000000000')).toBe(
            false,
        );
    });

    it('updateProject preserves shortUrl, logoFilename, folderId when not provided', () => {
        const p = createProject(db, {
            name: 'P',
            shortUrl: 'https://mifi.me/x',
            logoFilename: 'logo.png',
            folderId: null,
        });
        const f = createFolder(db, { name: 'F' });
        updateProject(db, p.id, { folderId: f.id });
        const updated = getProject(db, p.id)!;
        expect(updated.shortUrl).toBe('https://mifi.me/x');
        expect(updated.logoFilename).toBe('logo.png');
        expect(updated.folderId).toBe(f.id);
    });

    it('updateProject with explicit logoFilename', () => {
        const p = createProject(db, { name: 'P', logoFilename: 'old.png' });
        updateProject(db, p.id, { logoFilename: null });
        expect(getProject(db, p.id)!.logoFilename).toBeNull();
        updateProject(db, p.id, { logoFilename: 'new.png' });
        expect(getProject(db, p.id)!.logoFilename).toBe('new.png');
    });

    it('listFolders returns empty then folders in sort order', () => {
        expect(listFolders(db)).toEqual([]);
        createFolder(db, { name: 'B', sortOrder: 1 });
        createFolder(db, { name: 'A', sortOrder: 0 });
        const list = listFolders(db);
        expect(list.length).toBe(2);
        expect(list[0].name).toBe('A');
        expect(list[1].name).toBe('B');
    });

    it('createFolder defaults name and sortOrder', () => {
        const f = createFolder(db, {});
        expect(f.id).toBeDefined();
        expect(f.name).toBe('Folder');
        expect(f.sortOrder).toBe(0);
    });

    it('getFolder returns folder or null', () => {
        const f = createFolder(db, { name: 'X' });
        expect(getFolder(db, f.id)?.name).toBe('X');
        expect(
            getFolder(db, '00000000-0000-0000-0000-000000000000'),
        ).toBeNull();
    });

    it('updateFolder and deleteFolder', () => {
        const f = createFolder(db, { name: 'Old' });
        const updated = updateFolder(db, f.id, { name: 'New', sortOrder: 5 });
        expect(updated?.name).toBe('New');
        expect(updated?.sortOrder).toBe(5);
        expect(
            updateFolder(db, '00000000-0000-0000-0000-000000000000', {
                name: 'X',
            }),
        ).toBeNull();
        const deleted = deleteFolder(db, f.id);
        expect(deleted).toBe(true);
        expect(getFolder(db, f.id)).toBeNull();
        expect(deleteFolder(db, '00000000-0000-0000-0000-000000000000')).toBe(
            false,
        );
    });

    it('deleteFolder nulls project folderId', () => {
        const folder = createFolder(db, { name: 'F' });
        const p = createProject(db, { name: 'P', folderId: folder.id });
        deleteFolder(db, folder.id);
        expect(getProject(db, p.id)!.folderId).toBeNull();
    });

    it('initDb tolerates existing folderId column', () => {
        const tmp = path.join(os.tmpdir(), `qr-db-${Date.now()}.sqlite`);
        try {
            const env = { ...testEnv, DB_PATH: tmp } as Parameters<
                typeof initDb
            >[0];
            const db1 = initDb(env);
            db1.close();
            const db2 = initDb(env);
            const list = listFolders(db2);
            expect(list).toEqual([]);
            db2.close();
        } finally {
            try {
                fs.unlinkSync(tmp);
            } catch {
                /* ignore */
            }
        }
    });
});
