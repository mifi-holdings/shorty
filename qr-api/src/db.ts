import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { Env } from './env.js';

export interface Project {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    originalUrl: string;
    shortenEnabled: number;
    shortUrl: string | null;
    recipeJson: string;
    logoFilename: string | null;
    folderId: string | null;
}

export interface Folder {
    id: string;
    name: string;
    sortOrder: number;
}

export function initDb(env: Env): Database.Database {
    const db = new Database(env.DB_PATH);
    db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT 'Untitled QR',
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            originalUrl TEXT NOT NULL DEFAULT '',
            shortenEnabled INTEGER NOT NULL DEFAULT 0,
            shortUrl TEXT,
            recipeJson TEXT NOT NULL DEFAULT '{}',
            logoFilename TEXT,
            folderId TEXT
        )
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT 'Folder',
            sortOrder INTEGER NOT NULL DEFAULT 0
        )
    `);
    try {
        db.exec(`ALTER TABLE projects ADD COLUMN folderId TEXT`);
    } catch {
        // column already exists (existing DB)
    }
    return db;
}

export function createProject(
    db: Database.Database,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>,
): Project {
    const id = randomUUID();
    const now = new Date().toISOString();
    const name = data.name ?? 'Untitled QR';
    const originalUrl = data.originalUrl ?? '';
    const shortenEnabled = data.shortenEnabled ?? 0;
    const shortUrl = data.shortUrl ?? null;
    const recipeJson = data.recipeJson ?? '{}';
    const logoFilename = data.logoFilename ?? null;
    const folderId = data.folderId ?? null;

    db.prepare(
        `INSERT INTO projects (id, name, createdAt, updatedAt, originalUrl, shortenEnabled, shortUrl, recipeJson, logoFilename, folderId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
        id,
        name,
        now,
        now,
        originalUrl,
        shortenEnabled,
        shortUrl,
        recipeJson,
        logoFilename,
        folderId,
    );

    return getProject(db, id)!;
}

export function listProjects(
    db: Database.Database,
): Omit<
    Project,
    'recipeJson' | 'originalUrl' | 'shortUrl' | 'shortenEnabled'
>[] {
    const rows = db
        .prepare(
            'SELECT id, name, createdAt, updatedAt, logoFilename, folderId FROM projects ORDER BY updatedAt DESC, createdAt DESC, id DESC',
        )
        .all() as Array<{
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        logoFilename: string | null;
        folderId: string | null;
    }>;
    return rows;
}

export function getProject(db: Database.Database, id: string): Project | null {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
        | Project
        | undefined;
    return row ?? null;
}

export function updateProject(
    db: Database.Database,
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Project | null {
    const existing = getProject(db, id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();
    const name = data.name ?? existing.name;
    const originalUrl = data.originalUrl ?? existing.originalUrl;
    const shortenEnabled = data.shortenEnabled ?? existing.shortenEnabled;
    const shortUrl =
        data.shortUrl !== undefined ? data.shortUrl : existing.shortUrl;
    const recipeJson = data.recipeJson ?? existing.recipeJson;
    const logoFilename =
        data.logoFilename !== undefined
            ? data.logoFilename
            : existing.logoFilename;
    const folderId =
        data.folderId !== undefined ? data.folderId : existing.folderId;

    db.prepare(
        `UPDATE projects SET name = ?, updatedAt = ?, originalUrl = ?, shortenEnabled = ?, shortUrl = ?, recipeJson = ?, logoFilename = ?, folderId = ? WHERE id = ?`,
    ).run(
        name,
        updatedAt,
        originalUrl,
        shortenEnabled,
        shortUrl,
        recipeJson,
        logoFilename,
        folderId,
        id,
    );

    return getProject(db, id);
}

export function deleteProject(db: Database.Database, id: string): boolean {
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
}

export function listFolders(db: Database.Database): Folder[] {
    const rows = db
        .prepare(
            'SELECT id, name, sortOrder FROM folders ORDER BY sortOrder ASC, name ASC',
        )
        .all() as Folder[];
    return rows;
}

export function createFolder(
    db: Database.Database,
    data: { name?: string; sortOrder?: number },
): Folder {
    const id = randomUUID();
    const name = data.name ?? 'Folder';
    const sortOrder = data.sortOrder ?? listFolders(db).length;
    db.prepare(
        'INSERT INTO folders (id, name, sortOrder) VALUES (?, ?, ?)',
    ).run(id, name, sortOrder);
    return { id, name, sortOrder };
}

export function getFolder(db: Database.Database, id: string): Folder | null {
    const row = db
        .prepare('SELECT id, name, sortOrder FROM folders WHERE id = ?')
        .get(id) as Folder | undefined;
    return row ?? null;
}

export function updateFolder(
    db: Database.Database,
    id: string,
    data: Partial<Pick<Folder, 'name' | 'sortOrder'>>,
): Folder | null {
    const existing = getFolder(db, id);
    if (!existing) return null;
    const name = data.name ?? existing.name;
    const sortOrder = data.sortOrder ?? existing.sortOrder;
    db.prepare('UPDATE folders SET name = ?, sortOrder = ? WHERE id = ?').run(
        name,
        sortOrder,
        id,
    );
    return getFolder(db, id);
}

export function deleteFolder(db: Database.Database, id: string): boolean {
    db.prepare('UPDATE projects SET folderId = NULL WHERE folderId = ?').run(
        id,
    );
    const result = db.prepare('DELETE FROM folders WHERE id = ?').run(id);
    return result.changes > 0;
}
