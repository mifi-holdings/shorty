import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Database } from 'better-sqlite3';
import {
    createProject,
    getProject,
    listProjects,
    updateProject,
    deleteProject,
} from '../db.js';

const createBodySchema = z.object({
    name: z.string().optional(),
    originalUrl: z.string().optional(),
    shortenEnabled: z.boolean().optional(),
    shortUrl: z.string().nullable().optional(),
    recipeJson: z.string().optional(),
    logoFilename: z.string().nullable().optional(),
    folderId: z.string().uuid().nullable().optional(),
});

const updateBodySchema = createBodySchema.partial();

const idParamSchema = z.object({ id: z.string().uuid() });

export function projectsRouter(db: Database, baseUrl: string) {
    const router = Router();
    const toJson = (p: ReturnType<typeof getProject>) =>
        p
            ? {
                  ...p,
                  shortenEnabled: Boolean(p.shortenEnabled),
                  logoUrl: p.logoFilename ? `${baseUrl}/uploads/${p.logoFilename}` : null,
              }
            : null;

    router.post('/', (req: Request, res: Response) => {
        try {
            const parsed = createBodySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const data = parsed.data;
            const project = createProject(db, {
                name: data.name,
                originalUrl: data.originalUrl,
                shortenEnabled: data.shortenEnabled ? 1 : 0,
                shortUrl: data.shortUrl ?? null,
                recipeJson: data.recipeJson ?? '{}',
                logoFilename: data.logoFilename ?? null,
                folderId: data.folderId ?? null,
            });
            return res.status(201).json(toJson(project));
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

    router.get('/', (_req: Request, res: Response) => {
        try {
            const list = listProjects(db);
            const items = list.map((p) => ({
                id: p.id,
                name: p.name,
                updatedAt: p.updatedAt,
                logoUrl: p.logoFilename ? `${baseUrl}/uploads/${p.logoFilename}` : null,
                folderId: p.folderId ?? null,
            }));
            return res.json(items);
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

    router.get('/:id', (req: Request, res: Response) => {
        const parsed = idParamSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const project = getProject(db, parsed.data.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        return res.json(toJson(project));
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
        const data = bodyParsed.data;
        const project = updateProject(db, paramParsed.data.id, {
            name: data.name,
            originalUrl: data.originalUrl,
            shortenEnabled: data.shortenEnabled !== undefined ? (data.shortenEnabled ? 1 : 0) : undefined,
            shortUrl: data.shortUrl,
            recipeJson: data.recipeJson,
            logoFilename: data.logoFilename,
            folderId: data.folderId,
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        return res.json(toJson(project));
    });

    router.delete('/:id', (req: Request, res: Response) => {
        const parsed = idParamSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid id' });
        }
        const deleted = deleteProject(db, parsed.data.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Project not found' });
        }
        return res.status(204).send();
    });

    return router;
}
