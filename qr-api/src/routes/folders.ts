import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from 'better-sqlite3';
import {
    listFolders,
    createFolder,
    getFolder,
    updateFolder,
    deleteFolder,
} from '../db.js';

const createBodySchema = z.object({
    name: z.string().optional(),
    sortOrder: z.number().optional(),
});

const updateBodySchema = createBodySchema.partial();
const idParamSchema = z.object({ id: z.string().uuid() });

export function foldersRouter(db: Database) {
    const router = Router();

    router.get('/', (_req: Request, res: Response) => {
        try {
            const folders = listFolders(db);
            return res.json(folders);
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

    router.post('/', (req: Request, res: Response) => {
        try {
            const parsed = createBodySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const folder = createFolder(db, parsed.data);
            return res.status(201).json(folder);
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

    router.get('/:id', (req: Request, res: Response) => {
        const parsed = idParamSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const folder = getFolder(db, parsed.data.id);
        if (!folder) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.json(folder);
    });

    router.put('/:id', (req: Request, res: Response) => {
        const paramParsed = idParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const bodyParsed = updateBodySchema.safeParse(req.body);
        if (!bodyParsed.success) {
            return res.status(400).json({ error: bodyParsed.error.message });
        }
        const folder = updateFolder(db, paramParsed.data.id, bodyParsed.data);
        if (!folder) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.json(folder);
    });

    router.delete('/:id', (req: Request, res: Response) => {
        const parsed = idParamSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const deleted = deleteFolder(db, parsed.data.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(204).send();
    });

    return router;
}
